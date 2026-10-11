import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, ShieldAlert, Gauge, CheckCircle2 } from "lucide-react";

const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Limite = { id: string; categoria: string; limite_mensal: number };

export default function PFLimites() {
  const [limites, setLimites] = useState<Limite[]>([]);
  const [gastos, setGastos] = useState<Record<string, number>>({});
  const [categorias, setCategorias] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ categoria: "", limite_mensal: "" });
  const [loading, setLoading] = useState(true);

  const mesRef = useMemo(() => {
    const hoje = new Date();
    const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    return { inicio: iso(ini), fim: iso(fim), label: ini.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) };
  }, []);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [lim, trans] = await Promise.all([
      (supabase as any).from("pf_limites_categoria").select("id,categoria,limite_mensal").eq("user_id", user.id).order("categoria"),
      (supabase as any).from("pf_transacoes").select("categoria,valor,tipo").eq("user_id", user.id).eq("tipo", "despesa").gte("data", mesRef.inicio).lte("data", mesRef.fim),
    ]);

    setLimites((lim.data ?? []) as Limite[]);
    const soma: Record<string, number> = {};
    for (const t of trans.data ?? []) {
      soma[t.categoria] = (soma[t.categoria] ?? 0) + Number(t.valor);
    }
    setGastos(soma);
    setCategorias(Object.keys(soma).sort());
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const categoria = form.categoria.trim();
    if (!categoria) return;
    const { error } = await (supabase as any)
      .from("pf_limites_categoria")
      .upsert({ user_id: user.id, categoria, limite_mensal: Number(form.limite_mensal) }, { onConflict: "user_id,categoria" });
    if (error) return toast.error(error.message);
    toast.success("Limite combinado!");
    setForm({ categoria: "", limite_mensal: "" });
    setOpen(false);
    load();
  };

  const remover = async (id: string) => {
    await (supabase as any).from("pf_limites_categoria").delete().eq("id", id);
    load();
  };

  const linhas = limites.map((l) => {
    const gasto = gastos[l.categoria] ?? 0;
    const pct = (gasto / Number(l.limite_mensal)) * 100;
    const estado: "ok" | "atencao" | "estourou" = pct >= 100 ? "estourou" : pct >= 80 ? "atencao" : "ok";
    return { ...l, gasto, pct, estado, sobra: Number(l.limite_mensal) - gasto };
  });

  const estourados = linhas.filter((l) => l.estado === "estourou");
  const atencao = linhas.filter((l) => l.estado === "atencao");

  const cores = {
    ok: { barra: "bg-[hsl(var(--success))]", texto: "text-[hsl(var(--success))]", borda: "" },
    atencao: { barra: "bg-amber-500", texto: "text-amber-500", borda: "border-amber-500/40 bg-amber-500/5" },
    estourou: { barra: "bg-destructive", texto: "text-destructive", borda: "border-destructive/40 bg-destructive/5" },
  } as const;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif">Limites de gasto</h1>
          <p className="text-sm text-muted-foreground">
            Combine com você mesmo quanto pode gastar em cada categoria neste mês — {mesRef.label}.
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}><Plus className="h-4 w-4 mr-1" /> Novo limite</Button>
      </div>

      {(estourados.length > 0 || atencao.length > 0) && (
        <Card className={`p-4 ${estourados.length > 0 ? "border-destructive/40 bg-destructive/5" : "border-amber-500/40 bg-amber-500/5"}`}>
          <div className="flex gap-3">
            <ShieldAlert className={`h-5 w-5 shrink-0 ${estourados.length > 0 ? "text-destructive" : "text-amber-500"}`} />
            <div className="text-sm">
              {estourados.length > 0 && (
                <p>
                  <strong>Você passou do combinado em {estourados.length === 1 ? "1 categoria" : `${estourados.length} categorias`}:</strong>{" "}
                  {estourados.map((l) => l.categoria).join(", ")}. Respira — isso não é derrota, é informação. Ajuste o resto do mês.
                </p>
              )}
              {atencao.length > 0 && (
                <p className={estourados.length > 0 ? "mt-2" : ""}>
                  Está chegando perto em: {atencao.map((l) => l.categoria).join(", ")}. Segura um pouco até virar o mês.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {open && (
        <Card className="p-4">
          <form onSubmit={salvar} className="space-y-3">
            <div>
              <Label>Categoria</Label>
              <Input
                required
                list="pf-limites-categorias"
                placeholder="Ex.: Restaurante / Delivery"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              />
              <datalist id="pf-limites-categorias">
                {categorias.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <Label>Limite do mês</Label>
              <Input type="number" step="0.01" min="0.01" required value={form.limite_mensal} onChange={(e) => setForm({ ...form, limite_mensal: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">Salvar limite</Button>
          </form>
        </Card>
      )}

      {loading ? (
        <Card className="p-6 text-sm text-muted-foreground text-center">Carregando…</Card>
      ) : linhas.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground text-center">
          <Gauge className="h-8 w-8 mx-auto mb-2 text-primary/60" />
          <p>Nenhum limite combinado ainda.</p>
          <p className="text-xs mt-1">Comece pelas categorias que mais doem no fim do mês: delivery, streaming, transporte por app.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {linhas.map((l) => (
            <Card key={l.id} className={`p-3 ${cores[l.estado].borda}`}>
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold flex items-center gap-1">
                    {l.estado === "ok" && <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))]" />}
                    {l.categoria}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {l.sobra >= 0 ? `Ainda pode gastar ${BRL(l.sobra)}` : `Passou ${BRL(Math.abs(l.sobra))} do combinado`}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs ${cores[l.estado].texto}`}>{l.pct.toFixed(0)}%</div>
                  <div className="text-sm font-semibold tabular-nums">{BRL(l.gasto)}</div>
                  <div className="text-[10px] text-muted-foreground">de {BRL(Number(l.limite_mensal))}</div>
                </div>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                <div className={`h-full ${cores[l.estado].barra}`} style={{ width: `${Math.min(100, l.pct)}%` }} />
              </div>
              <div className="flex justify-end mt-2">
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => remover(l.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
