import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Check, Heart, Snowflake, Zap, Trophy } from "lucide-react";

const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Metodo = "bola_neve" | "avalanche";

export default function PFDividas() {
  const [itens, setItens] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [metodo, setMetodo] = useState<Metodo>("bola_neve");
  const [form, setForm] = useState({ credor: "", valor_total: "", valor_pago: "0", taxa_juros_mensal: "", parcelas_total: "", vencimento: "" });

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await (supabase as any).from("pf_dividas").select("*").eq("user_id", user.id).order("vencimento", { ascending: true });
    setItens(data || []);
  };
  useEffect(() => { load(); }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await (supabase as any).from("pf_dividas").insert({
      user_id: user.id,
      credor: form.credor,
      valor_total: Number(form.valor_total),
      valor_pago: Number(form.valor_pago || 0),
      taxa_juros_mensal: form.taxa_juros_mensal ? Number(form.taxa_juros_mensal) : null,
      parcelas_total: form.parcelas_total ? Number(form.parcelas_total) : null,
      vencimento: form.vencimento || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Coragem! Reconhecer é o primeiro passo pra libertação. 💛");
    setForm({ credor: "", valor_total: "", valor_pago: "0", taxa_juros_mensal: "", parcelas_total: "", vencimento: "" });
    setOpen(false);
    load();
  };

  const quitar = async (id: string, credor: string) => {
    await (supabase as any).from("pf_dividas").update({ quitada: true }).eq("id", id);
    toast.success(`🎉 ${credor} QUITADA! Um peso a menos. Você é gigante!`, { duration: 5000 });
    load();
  };
  const remover = async (id: string) => {
    await (supabase as any).from("pf_dividas").delete().eq("id", id);
    load();
  };

  const abertas = itens.filter((i) => !i.quitada);
  const quitadas = itens.filter((i) => i.quitada);
  const totalAberto = abertas.reduce((s, i) => s + (Number(i.valor_total) - Number(i.valor_pago)), 0);
  const totalOriginal = abertas.reduce((s, i) => s + Number(i.valor_total), 0);
  const totalPago = abertas.reduce((s, i) => s + Number(i.valor_pago), 0);
  const pctLibertacao = totalOriginal > 0 ? (totalPago / totalOriginal) * 100 : 0;

  // Ordena pela estratégia escolhida — bola de neve: menor restante primeiro; avalanche: maior juros primeiro
  const ordenadas = useMemo(() => {
    const arr = [...abertas];
    if (metodo === "bola_neve") {
      arr.sort((a, b) => (Number(a.valor_total) - Number(a.valor_pago)) - (Number(b.valor_total) - Number(b.valor_pago)));
    } else {
      arr.sort((a, b) => Number(b.taxa_juros_mensal || 0) - Number(a.taxa_juros_mensal || 0));
    }
    return arr;
  }, [abertas, metodo]);

  const proximaFoco = ordenadas[0];

  const mensagem =
    abertas.length === 0
      ? "Nenhuma dívida aberta. Você é livre! 🕊️"
      : pctLibertacao > 75
      ? "Você está quase lá! A libertação está próxima."
      : pctLibertacao > 50
      ? "Mais da metade já se foi. Continue firme."
      : pctLibertacao > 25
      ? "Você começou. O mais difícil já ficou pra trás."
      : "Cada real quitado é uma corrente que se rompe. Um passo de cada vez.";

  return (
    <div className="space-y-4">
      {/* Header emocional */}
      <div className="relative overflow-hidden rounded-3xl gradient-warm p-6 text-primary-foreground shadow-warm">
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80">
            <Heart className="h-3.5 w-3.5" /> Meu plano de libertação
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div>
              <div className="text-xs opacity-90">Ainda faltam</div>
              <div className="font-serif text-3xl font-semibold">{BRL(totalAberto)}</div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setOpen(!open)} className="rounded-full">
              <Plus className="h-4 w-4 mr-1" /> Nova
            </Button>
          </div>
          {totalOriginal > 0 && (
            <>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden mt-4">
                <div className="h-full bg-white transition-all duration-700" style={{ width: `${pctLibertacao}%` }} />
              </div>
              <div className="flex justify-between text-[11px] mt-1.5 opacity-90">
                <span>{pctLibertacao.toFixed(0)}% do caminho</span>
                <span>{BRL(totalPago)} já quitado</span>
              </div>
            </>
          )}
          <p className="text-sm mt-3 italic opacity-95">"{mensagem}"</p>
        </div>
      </div>

      {/* Formulário */}
      {open && (
        <Card className="p-4">
          <form onSubmit={salvar} className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Sem julgamento. Só verdade. Escrever é o primeiro passo pra soltar.
            </div>
            <div><Label>De quem é essa dívida?</Label><Input required placeholder="Ex.: Banco, cartão, empréstimo…" value={form.credor} onChange={(e) => setForm({ ...form, credor: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor total</Label><Input type="number" step="0.01" required value={form.valor_total} onChange={(e) => setForm({ ...form, valor_total: e.target.value })} /></div>
              <div><Label>Já paguei</Label><Input type="number" step="0.01" value={form.valor_pago} onChange={(e) => setForm({ ...form, valor_pago: e.target.value })} /></div>
              <div><Label>Juros % ao mês</Label><Input type="number" step="0.01" value={form.taxa_juros_mensal} onChange={(e) => setForm({ ...form, taxa_juros_mensal: e.target.value })} /></div>
              <div><Label>Parcelas</Label><Input type="number" value={form.parcelas_total} onChange={(e) => setForm({ ...form, parcelas_total: e.target.value })} /></div>
            </div>
            <div><Label>Próximo vencimento</Label><Input type="date" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} /></div>
            <Button type="submit" className="w-full gradient-warm text-primary-foreground border-0">Adicionar ao plano</Button>
          </form>
        </Card>
      )}

      {/* Estratégia */}
      {abertas.length > 1 && (
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Estratégia recomendada</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMetodo("bola_neve")}
              className={`rounded-xl border p-3 text-left transition ${metodo === "bola_neve" ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <Snowflake className="h-4 w-4 text-primary mb-1" />
              <div className="text-sm font-semibold">Bola de neve</div>
              <div className="text-[11px] text-muted-foreground">Quita as menores primeiro. Vitórias rápidas = motivação.</div>
            </button>
            <button
              type="button"
              onClick={() => setMetodo("avalanche")}
              className={`rounded-xl border p-3 text-left transition ${metodo === "avalanche" ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <Zap className="h-4 w-4 text-primary mb-1" />
              <div className="text-sm font-semibold">Avalanche</div>
              <div className="text-[11px] text-muted-foreground">Ataca os maiores juros primeiro. Economiza mais no total.</div>
            </button>
          </div>
          {proximaFoco && (
            <div className="mt-3 rounded-xl bg-primary/5 border border-primary/20 p-3 text-sm">
              <div className="text-[10px] uppercase tracking-wider text-primary font-semibold">Foque agora em</div>
              <div className="font-semibold">{proximaFoco.credor}</div>
              <div className="text-xs text-muted-foreground">
                Falta {BRL(Number(proximaFoco.valor_total) - Number(proximaFoco.valor_pago))} — quando quitar, siga pra próxima. Um passo de cada vez.
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Lista */}
      {itens.length === 0 ? (
        <Card className="p-8 text-center">
          <Heart className="h-8 w-8 mx-auto mb-2 text-primary/60" />
          <p className="text-sm text-muted-foreground">Nenhuma dívida cadastrada.</p>
          <p className="text-xs text-primary mt-1">Que benção! Vamos manter assim. 💛</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {abertas.length > 0 && (
            <>
              <div className="text-xs uppercase tracking-wider text-muted-foreground pt-2">A libertar</div>
              {ordenadas.map((d) => {
                const restante = Number(d.valor_total) - Number(d.valor_pago);
                const pct = Number(d.valor_total) > 0 ? (Number(d.valor_pago) / Number(d.valor_total)) * 100 : 0;
                return (
                  <Card key={d.id} className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{d.credor}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {d.parcelas_total ? `${d.parcelas_pagas || 0}/${d.parcelas_total} parcelas · ` : ""}
                          {d.vencimento ? `Venc. ${new Date(d.vencimento).toLocaleDateString("pt-BR")}` : ""}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-destructive">{BRL(restante)}</div>
                        <div className="text-[10px] text-muted-foreground">de {BRL(Number(d.valor_total))}</div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                      <div className="h-full gradient-warm transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    {pct > 0 && pct < 100 && (
                      <div className="text-[10px] text-primary mt-1">{pct.toFixed(0)}% já libertado ✨</div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => quitar(d.id, d.credor)}>
                        <Check className="h-3 w-3 mr-1" /> Quitei essa!
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => remover(d.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </>
          )}

          {quitadas.length > 0 && (
            <>
              <div className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 pt-4 flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" /> Vitórias — {quitadas.length} liberta{quitadas.length > 1 ? "das" : "da"}
              </div>
              {quitadas.map((d) => (
                <Card key={d.id} className="p-3 border-emerald-500/30 bg-emerald-500/5 opacity-90">
                  <div className="flex justify-between items-center">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        {d.credor}
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400">Livre! {BRL(Number(d.valor_total))} quitados.</div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => remover(d.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
