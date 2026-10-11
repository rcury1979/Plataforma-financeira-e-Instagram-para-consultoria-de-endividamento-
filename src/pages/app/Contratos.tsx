import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Repeat, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, FilterChips, EmptyState, KpiCard } from "./_ui";
import { useEmpresaId } from "@/hooks/useEmpresaId";

type Contrato = { id: string; descricao: string; valor: number; periodicidade: string; dia_vencimento: number; proxima_cobranca: string; ativo: boolean; cliente_id: string | null };
type Cliente = { id: string; nome: string };

const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Contratos() {
  const { empresaId } = useEmpresaId();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [aba, setAba] = useState<"ativos" | "inativos">("ativos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ cliente_id: "", descricao: "", valor: "", periodicidade: "mensal", dia_vencimento: "5", proxima_cobranca: "" });

  const load = async () => {
    const [c, cl] = await Promise.all([
      (supabase as any).from("contratos").select("*").order("proxima_cobranca"),
      supabase.from("clientes").select("id,nome").eq("arquivado", false).order("nome"),
    ]);
    if (c.error) return toast.error(c.error.message);
    setContratos(c.data ?? []); setClientes((cl.data as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId) return toast.error("Empresa não encontrada");
    const { error } = await (supabase as any).from("contratos").insert({
      empresa_id: empresaId, cliente_id: form.cliente_id || null,
      descricao: form.descricao, valor: Number(form.valor) || 0,
      periodicidade: form.periodicidade, dia_vencimento: Number(form.dia_vencimento),
      proxima_cobranca: form.proxima_cobranca || new Date().toISOString().slice(0, 10),
    });
    if (error) return toast.error(error.message);
    toast.success("Contrato criado");
    setForm({ cliente_id: "", descricao: "", valor: "", periodicidade: "mensal", dia_vencimento: "5", proxima_cobranca: "" });
    setOpen(false); load();
  };

  const toggle = async (c: Contrato) => {
    await (supabase as any).from("contratos").update({ ativo: !c.ativo }).eq("id", c.id);
    load();
  };

  const filtrados = contratos.filter(c => (aba === "ativos" ? c.ativo : !c.ativo));
  const mrr = contratos.filter(c => c.ativo && c.periodicidade === "mensal").reduce((a, c) => a + Number(c.valor), 0);
  const cMap = Object.fromEntries(clientes.map(c => [c.id, c.nome]));

  return (
    <div className="space-y-5 pb-24">
      <PageHeader title="Contratos" subtitle="Recorrências e assinaturas" icon={Repeat}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo contrato</DialogTitle></DialogHeader>
              <form onSubmit={salvar} className="space-y-3">
                <div>
                  <Label>Cliente</Label>
                  <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })}>
                    <option value="">Sem cliente</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div><Label>Descrição *</Label><Input required value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Valor *</Label><Input required type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></div>
                  <div>
                    <Label>Periodicidade</Label>
                    <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.periodicidade} onChange={e => setForm({ ...form, periodicidade: e.target.value })}>
                      <option value="mensal">Mensal</option><option value="trimestral">Trimestral</option>
                      <option value="semestral">Semestral</option><option value="anual">Anual</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Dia venc.</Label><Input type="number" min="1" max="31" value={form.dia_vencimento} onChange={e => setForm({ ...form, dia_vencimento: e.target.value })} /></div>
                  <div><Label>Próxima cobrança</Label><Input type="date" value={form.proxima_cobranca} onChange={e => setForm({ ...form, proxima_cobranca: e.target.value })} /></div>
                </div>
                <DialogFooter><Button type="submit">Criar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        } />

      <div className="grid grid-cols-2 gap-2">
        <KpiCard icon={Repeat} label="Ativos" value={String(contratos.filter(c => c.ativo).length)} tone="primary" />
        <KpiCard label="MRR (mensal)" value={BRL(mrr)} tone="success" />
      </div>

      <FilterChips options={[{ value: "ativos", label: "Ativos" }, { value: "inativos", label: "Inativos" }] as const} value={aba} onChange={setAba as any} />

      {filtrados.length === 0 ? <EmptyState icon={Repeat} title="Sem contratos" description="Cadastre suas recorrências" /> : (
        <div className="space-y-2">
          {filtrados.map(c => (
            <Card key={c.id} className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Repeat className="h-4 w-4 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{c.descricao}</div>
                <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                  {cMap[c.cliente_id ?? ""] ?? "sem cliente"} · {c.periodicidade}
                  <Calendar className="h-3 w-3 ml-1" /> {new Date(c.proxima_cobranca).toLocaleDateString("pt-BR")}
                </div>
              </div>
              <div className="text-sm font-semibold">{BRL(Number(c.valor))}</div>
              <Button variant="ghost" size="sm" onClick={() => toggle(c)}>{c.ativo ? "Pausar" : "Ativar"}</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
