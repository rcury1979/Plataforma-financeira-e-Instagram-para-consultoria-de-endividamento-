import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Boxes, Plus, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, EmptyState, KpiCard } from "./_ui";
import { useEmpresaId } from "@/hooks/useEmpresaId";

type Saldo = { produto_id: string; nome: string; sku: string | null; unidade: string; estoque_minimo: number; saldo: number };
type Produto = { id: string; nome: string; unidade: string };

export default function Estoque() {
  const { empresaId } = useEmpresaId();
  const [saldos, setSaldos] = useState<Saldo[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ produto_id: "", tipo: "entrada", quantidade: "", custo_unitario: "", origem: "", observacoes: "" });

  const load = async () => {
    const [s, p] = await Promise.all([
      (supabase as any).from("estoque_saldo").select("*").order("nome"),
      (supabase as any).from("produtos").select("id,nome,unidade").eq("ativo", true).eq("tipo", "produto"),
    ]);
    if (s.error) return toast.error(s.error.message);
    setSaldos(s.data ?? []); setProdutos(p.data ?? []);
  };
  useEffect(() => { load(); }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId) return toast.error("Empresa não encontrada");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("estoque_movimentacoes").insert({
      empresa_id: empresaId, produto_id: form.produto_id, tipo: form.tipo,
      quantidade: Number(form.quantidade), custo_unitario: Number(form.custo_unitario) || 0,
      origem: form.origem || null, observacoes: form.observacoes || null, created_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Movimentação registrada");
    setForm({ produto_id: "", tipo: "entrada", quantidade: "", custo_unitario: "", origem: "", observacoes: "" });
    setOpen(false); load();
  };

  const abaixo = saldos.filter(s => Number(s.saldo) < Number(s.estoque_minimo) && Number(s.estoque_minimo) > 0);
  const total = saldos.reduce((acc, s) => acc + Number(s.saldo), 0);

  return (
    <div className="space-y-5 pb-24">
      <PageHeader title="Estoque" subtitle="Saldos, movimentações e alertas" icon={Boxes}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Movimentar</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova movimentação</DialogTitle></DialogHeader>
              <form onSubmit={salvar} className="space-y-3">
                <div>
                  <Label>Produto *</Label>
                  <select required className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.produto_id} onChange={e => setForm({ ...form, produto_id: e.target.value })}>
                    <option value="">Selecione…</option>
                    {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  {["entrada", "saida", "ajuste"].map(t => (
                    <Button key={t} type="button" size="sm" variant={form.tipo === t ? "default" : "outline"} onClick={() => setForm({ ...form, tipo: t })}>
                      {t === "entrada" ? "Entrada" : t === "saida" ? "Saída" : "Ajuste"}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Quantidade *</Label><Input required type="number" step="0.001" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} /></div>
                  <div><Label>Custo unit.</Label><Input type="number" step="0.01" value={form.custo_unitario} onChange={e => setForm({ ...form, custo_unitario: e.target.value })} /></div>
                </div>
                <div><Label>Origem</Label><Input placeholder="Ex.: NF 1234" value={form.origem} onChange={e => setForm({ ...form, origem: e.target.value })} /></div>
                <DialogFooter><Button type="submit">Registrar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        } />

      <div className="grid grid-cols-3 gap-2">
        <KpiCard icon={Boxes} label="Itens" value={String(saldos.length)} tone="primary" />
        <KpiCard icon={TrendingUp} label="Saldo total" value={total.toLocaleString("pt-BR")} />
        <KpiCard icon={AlertTriangle} label="Abaixo do mínimo" value={String(abaixo.length)} tone={abaixo.length ? "danger" : "neutral"} />
      </div>

      {abaixo.length > 0 && (
        <Card className="p-3 border-destructive/40 bg-destructive/5">
          <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-2">
            <AlertTriangle className="h-4 w-4" /> Alertas de estoque mínimo
          </div>
          <div className="space-y-1">
            {abaixo.map(s => (
              <div key={s.produto_id} className="text-xs flex justify-between">
                <span>{s.nome}</span>
                <span className="text-destructive font-semibold">{Number(s.saldo)} / mín {Number(s.estoque_minimo)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {saldos.length === 0 ? <EmptyState icon={Boxes} title="Sem estoque" description="Cadastre produtos e faça movimentações" /> : (
        <div className="space-y-2">
          {saldos.map(s => {
            const baixo = Number(s.saldo) < Number(s.estoque_minimo) && Number(s.estoque_minimo) > 0;
            return (
              <Card key={s.produto_id} className={`p-3 flex items-center gap-3 ${baixo ? "border-destructive/40" : ""}`}>
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${baixo ? "bg-destructive/15" : "bg-primary/10"}`}>
                  {baixo ? <TrendingDown className="h-4 w-4 text-destructive" /> : <Boxes className="h-4 w-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.nome}</div>
                  <div className="text-[11px] text-muted-foreground">{s.sku ?? "sem SKU"} · mín {Number(s.estoque_minimo)}</div>
                </div>
                <div className={`text-lg font-semibold tabular-nums ${baixo ? "text-destructive" : ""}`}>
                  {Number(s.saldo)} <span className="text-xs text-muted-foreground">{s.unidade}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
