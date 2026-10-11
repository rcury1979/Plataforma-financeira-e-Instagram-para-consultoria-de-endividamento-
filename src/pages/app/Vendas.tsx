import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ShoppingCart, Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, FilterChips, EmptyState, KpiCard } from "./_ui";
import { useEmpresaId } from "@/hooks/useEmpresaId";

type Pedido = { id: string; numero: number; status: string; data_emissao: string; valor_total: number; cliente_id: string | null; observacoes: string | null };
type Cliente = { id: string; nome: string };

const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const STATUS_LABELS: Record<string, string> = { orcamento: "Orçamento", pedido: "Pedido", faturado: "Faturado", cancelado: "Cancelado" };

export default function Vendas() {
  const { empresaId } = useEmpresaId();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [aba, setAba] = useState<"orcamento" | "pedido" | "faturado">("orcamento");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ cliente_id: "", descricao: "", quantidade: "1", preco: "", observacoes: "" });

  const load = async () => {
    const [pv, cl] = await Promise.all([
      (supabase as any).from("pedidos_venda").select("*").order("created_at", { ascending: false }),
      supabase.from("clientes").select("id,nome").eq("arquivado", false).order("nome"),
    ]);
    if (pv.error) return toast.error(pv.error.message);
    setPedidos(pv.data ?? []); setClientes((cl.data as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId) return toast.error("Empresa não encontrada");
    const { data: { user } } = await supabase.auth.getUser();
    const total = Number(form.quantidade) * Number(form.preco);
    const { data: pv, error } = await (supabase as any).from("pedidos_venda").insert({
      empresa_id: empresaId, cliente_id: form.cliente_id || null, vendedor_id: user?.id,
      status: "orcamento", valor_bruto: total, valor_total: total, observacoes: form.observacoes || null,
    }).select("id").single();
    if (error) return toast.error(error.message);
    if (form.descricao) {
      await (supabase as any).from("pedidos_venda_itens").insert({
        pedido_id: pv.id, descricao: form.descricao,
        quantidade: Number(form.quantidade), preco_unitario: Number(form.preco), total,
      });
    }
    toast.success("Orçamento criado");
    setForm({ cliente_id: "", descricao: "", quantidade: "1", preco: "", observacoes: "" });
    setOpen(false); load();
  };

  const avancar = async (p: Pedido) => {
    const next = p.status === "orcamento" ? "pedido" : p.status === "pedido" ? "faturado" : p.status;
    await (supabase as any).from("pedidos_venda").update({ status: next }).eq("id", p.id);
    toast.success(`Movido para ${STATUS_LABELS[next]}`);
    load();
  };

  const filtrados = pedidos.filter(p => p.status === aba);
  const totalMes = pedidos.filter(p => p.status === "faturado" && new Date(p.data_emissao).getMonth() === new Date().getMonth()).reduce((a, p) => a + Number(p.valor_total), 0);
  const clientesMap = Object.fromEntries(clientes.map(c => [c.id, c.nome]));

  return (
    <div className="space-y-5 pb-24">
      <PageHeader title="Vendas" subtitle="Orçamentos, pedidos e faturamento" icon={ShoppingCart}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo orçamento</DialogTitle></DialogHeader>
              <form onSubmit={salvar} className="space-y-3">
                <div>
                  <Label>Cliente</Label>
                  <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })}>
                    <option value="">Sem cliente</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div><Label>Descrição do item</Label><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Quantidade</Label><Input type="number" step="0.001" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} /></div>
                  <div><Label>Preço unitário</Label><Input type="number" step="0.01" value={form.preco} onChange={e => setForm({ ...form, preco: e.target.value })} /></div>
                </div>
                <div><Label>Observações</Label><Textarea rows={2} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
                <DialogFooter><Button type="submit">Criar orçamento</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        } />

      <div className="grid grid-cols-3 gap-2">
        <KpiCard label="Orçamentos" value={String(pedidos.filter(p => p.status === "orcamento").length)} tone="primary" />
        <KpiCard label="Pedidos" value={String(pedidos.filter(p => p.status === "pedido").length)} />
        <KpiCard label="Faturado/mês" value={BRL(totalMes)} tone="success" />
      </div>

      <FilterChips options={[
        { value: "orcamento", label: "Orçamentos" },
        { value: "pedido", label: "Pedidos" },
        { value: "faturado", label: "Faturados" },
      ] as const} value={aba} onChange={setAba as any} />

      {filtrados.length === 0 ? <EmptyState icon={ShoppingCart} title="Sem pedidos aqui" description="Crie um novo orçamento" /> : (
        <div className="space-y-2">
          {filtrados.map(p => (
            <Card key={p.id} className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">#{p.numero} — {clientesMap[p.cliente_id ?? ""] ?? "Sem cliente"}</div>
                <div className="text-[11px] text-muted-foreground">{new Date(p.data_emissao).toLocaleDateString("pt-BR")} · {STATUS_LABELS[p.status]}</div>
              </div>
              <div className="text-sm font-semibold">{BRL(Number(p.valor_total))}</div>
              {p.status !== "faturado" && p.status !== "cancelado" && (
                <Button variant="ghost" size="icon" onClick={() => avancar(p)}><ArrowRight className="h-4 w-4" /></Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
