import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ShoppingBag, Plus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, FilterChips, EmptyState, KpiCard } from "./_ui";
import { useEmpresaId } from "@/hooks/useEmpresaId";

type OC = { id: string; numero: number; status: string; data_emissao: string; data_prevista: string | null; valor_total: number; fornecedor_id: string | null; observacoes: string | null };
type Forn = { id: string; nome: string };

const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Compras() {
  const { empresaId } = useEmpresaId();
  const [ordens, setOrdens] = useState<OC[]>([]);
  const [fornecedores, setFornecedores] = useState<Forn[]>([]);
  const [aba, setAba] = useState<"aberta" | "recebida">("aberta");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fornecedor_id: "", descricao: "", quantidade: "1", preco: "", data_prevista: "", observacoes: "" });

  const load = async () => {
    const [oc, f] = await Promise.all([
      (supabase as any).from("ordens_compra").select("*").order("created_at", { ascending: false }),
      (supabase as any).from("fornecedores").select("id,nome").eq("ativo", true).order("nome"),
    ]);
    if (oc.error) return toast.error(oc.error.message);
    setOrdens(oc.data ?? []); setFornecedores(f.data ?? []);
  };
  useEffect(() => { load(); }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId) return toast.error("Empresa não encontrada");
    const total = Number(form.quantidade) * Number(form.preco);
    const { data: oc, error } = await (supabase as any).from("ordens_compra").insert({
      empresa_id: empresaId, fornecedor_id: form.fornecedor_id || null,
      status: "aberta", valor_total: total, data_prevista: form.data_prevista || null,
      observacoes: form.observacoes || null,
    }).select("id").single();
    if (error) return toast.error(error.message);
    if (form.descricao) {
      await (supabase as any).from("ordens_compra_itens").insert({
        ordem_id: oc.id, descricao: form.descricao,
        quantidade: Number(form.quantidade), preco_unitario: Number(form.preco), total,
      });
    }
    toast.success("Ordem de compra criada");
    setForm({ fornecedor_id: "", descricao: "", quantidade: "1", preco: "", data_prevista: "", observacoes: "" });
    setOpen(false); load();
  };

  const receber = async (o: OC) => {
    await (supabase as any).from("ordens_compra").update({ status: "recebida" }).eq("id", o.id);
    toast.success("Marcada como recebida");
    load();
  };

  const filtrados = ordens.filter(o => o.status === aba);
  const totalAberto = ordens.filter(o => o.status === "aberta").reduce((a, o) => a + Number(o.valor_total), 0);
  const fMap = Object.fromEntries(fornecedores.map(f => [f.id, f.nome]));

  return (
    <div className="space-y-5 pb-24">
      <PageHeader title="Compras" subtitle="Ordens de compra e recebimento" icon={ShoppingBag}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova ordem de compra</DialogTitle></DialogHeader>
              <form onSubmit={salvar} className="space-y-3">
                <div>
                  <Label>Fornecedor</Label>
                  <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.fornecedor_id} onChange={e => setForm({ ...form, fornecedor_id: e.target.value })}>
                    <option value="">Sem fornecedor</option>
                    {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                </div>
                <div><Label>Descrição do item</Label><Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Quantidade</Label><Input type="number" step="0.001" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} /></div>
                  <div><Label>Preço unitário</Label><Input type="number" step="0.01" value={form.preco} onChange={e => setForm({ ...form, preco: e.target.value })} /></div>
                </div>
                <div><Label>Data prevista</Label><Input type="date" value={form.data_prevista} onChange={e => setForm({ ...form, data_prevista: e.target.value })} /></div>
                <div><Label>Observações</Label><Textarea rows={2} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
                <DialogFooter><Button type="submit">Criar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        } />

      <div className="grid grid-cols-2 gap-2">
        <KpiCard label="Em aberto" value={String(ordens.filter(o => o.status === "aberta").length)} tone="primary" />
        <KpiCard label="Total em aberto" value={BRL(totalAberto)} />
      </div>

      <FilterChips options={[{ value: "aberta", label: "Abertas" }, { value: "recebida", label: "Recebidas" }] as const} value={aba} onChange={setAba as any} />

      {filtrados.length === 0 ? <EmptyState icon={ShoppingBag} title="Sem ordens" description="Crie sua primeira ordem de compra" /> : (
        <div className="space-y-2">
          {filtrados.map(o => (
            <Card key={o.id} className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><ShoppingBag className="h-4 w-4 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">#{o.numero} — {fMap[o.fornecedor_id ?? ""] ?? "Sem fornecedor"}</div>
                <div className="text-[11px] text-muted-foreground">
                  {new Date(o.data_emissao).toLocaleDateString("pt-BR")}
                  {o.data_prevista && ` · previsto ${new Date(o.data_prevista).toLocaleDateString("pt-BR")}`}
                </div>
              </div>
              <div className="text-sm font-semibold">{BRL(Number(o.valor_total))}</div>
              {o.status === "aberta" && <Button variant="ghost" size="icon" onClick={() => receber(o)}><CheckCircle2 className="h-4 w-4" /></Button>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
