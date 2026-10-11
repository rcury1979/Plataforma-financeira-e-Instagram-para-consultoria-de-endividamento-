import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Wrench, Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, EmptyState } from "./_ui";
import { useEmpresaId } from "@/hooks/useEmpresaId";

type OS = { id: string; numero: number; titulo: string; status: string; prioridade: string; valor: number; prazo: string | null; cliente_id: string | null; descricao: string | null };
type Cliente = { id: string; nome: string };

const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const COLUNAS = [
  { key: "aberta", label: "Aberta", cor: "border-primary/30" },
  { key: "em_execucao", label: "Em execução", cor: "border-yellow-500/30" },
  { key: "concluida", label: "Concluída", cor: "border-green-500/30" },
] as const;
const PRIO_COR: Record<string, string> = { baixa: "bg-muted", media: "bg-primary/20 text-primary", alta: "bg-orange-500/20 text-orange-600", urgente: "bg-destructive/20 text-destructive" };

export default function OrdensServico() {
  const { empresaId } = useEmpresaId();
  const [items, setItems] = useState<OS[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ cliente_id: "", titulo: "", descricao: "", prioridade: "media", valor: "", prazo: "" });

  const load = async () => {
    const [o, c] = await Promise.all([
      (supabase as any).from("ordens_servico").select("*").order("created_at", { ascending: false }),
      supabase.from("clientes").select("id,nome").eq("arquivado", false).order("nome"),
    ]);
    if (o.error) return toast.error(o.error.message);
    setItems(o.data ?? []); setClientes((c.data as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId) return toast.error("Empresa não encontrada");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from("ordens_servico").insert({
      empresa_id: empresaId, cliente_id: form.cliente_id || null, tecnico_id: user?.id,
      titulo: form.titulo, descricao: form.descricao || null,
      prioridade: form.prioridade, valor: Number(form.valor) || 0,
      prazo: form.prazo || null,
    });
    if (error) return toast.error(error.message);
    toast.success("OS criada");
    setForm({ cliente_id: "", titulo: "", descricao: "", prioridade: "media", valor: "", prazo: "" });
    setOpen(false); load();
  };

  const avancar = async (o: OS) => {
    const next = o.status === "aberta" ? "em_execucao" : o.status === "em_execucao" ? "concluida" : o.status;
    const update: any = { status: next };
    if (next === "concluida") update.data_conclusao = new Date().toISOString().slice(0, 10);
    await (supabase as any).from("ordens_servico").update(update).eq("id", o.id);
    load();
  };

  const cMap = Object.fromEntries(clientes.map(c => [c.id, c.nome]));

  return (
    <div className="space-y-5 pb-24">
      <PageHeader title="Ordens de serviço" subtitle="Kanban de execução" icon={Wrench}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova OS</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova ordem de serviço</DialogTitle></DialogHeader>
              <form onSubmit={salvar} className="space-y-3">
                <div><Label>Título *</Label><Input required value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} /></div>
                <div>
                  <Label>Cliente</Label>
                  <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })}>
                    <option value="">Sem cliente</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div><Label>Descrição</Label><Textarea rows={3} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>Prioridade</Label>
                    <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.prioridade} onChange={e => setForm({ ...form, prioridade: e.target.value })}>
                      <option value="baixa">Baixa</option><option value="media">Média</option>
                      <option value="alta">Alta</option><option value="urgente">Urgente</option>
                    </select>
                  </div>
                  <div><Label>Valor</Label><Input type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></div>
                  <div><Label>Prazo</Label><Input type="date" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} /></div>
                </div>
                <DialogFooter><Button type="submit">Criar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        } />

      <div className="grid gap-3">
        {COLUNAS.map(col => {
          const cards = items.filter(i => i.status === col.key);
          return (
            <div key={col.key}>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                <span>{col.label}</span><span>{cards.length}</span>
              </div>
              {cards.length === 0 ? (
                <div className="text-xs text-muted-foreground italic border border-dashed rounded-md p-3 text-center">Vazio</div>
              ) : (
                <div className="space-y-2">
                  {cards.map(o => (
                    <Card key={o.id} className={`p-3 border-l-4 ${col.cor}`}>
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-muted-foreground">#{o.numero}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIO_COR[o.prioridade]}`}>{o.prioridade}</span>
                          </div>
                          <div className="text-sm font-medium">{o.titulo}</div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {cMap[o.cliente_id ?? ""] ?? "sem cliente"}
                            {o.prazo && ` · prazo ${new Date(o.prazo).toLocaleDateString("pt-BR")}`}
                            {Number(o.valor) > 0 && ` · ${BRL(Number(o.valor))}`}
                          </div>
                        </div>
                        {o.status !== "concluida" && o.status !== "cancelada" && (
                          <Button variant="ghost" size="icon" onClick={() => avancar(o)}><ArrowRight className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && <EmptyState icon={Wrench} title="Sem ordens de serviço" description="Crie a primeira OS" />}
      </div>
    </div>
  );
}
