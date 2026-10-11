import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, CheckCircle2, Circle, Clock, Trash2, Flag, CheckSquare, ListChecks } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { PageHeader, FilterChips, EmptyState } from "./_ui";

type Tarefa = {
  id: string;
  titulo: string;
  descricao: string | null;
  status: "pendente" | "em_andamento" | "concluida";
  prioridade: "baixa" | "media" | "alta";
  prazo: string | null;
  cliente_id: string | null;
};

type ClienteOption = { id: string; nome: string };

const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};
const prioridadeCor: Record<string, string> = {
  baixa: "text-muted-foreground",
  media: "text-amber-500",
  alta: "text-destructive",
};

export default function Tarefas() {
  const [items, setItems] = useState<Tarefa[]>([]);
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "", prioridade: "media", prazo: "", cliente_id: "sem-cliente" });
  const [filtro, setFiltro] = useState<"todas" | "pendente" | "em_andamento" | "concluida">("todas");

  const load = async () => {
    const [tarefasResult, clientesResult] = await Promise.all([
      (supabase as any).from("tarefas").select("*").order("created_at", { ascending: false }),
      supabase.from("clientes").select("id,nome").eq("arquivado", false).order("nome"),
    ]);
    setItems((tarefasResult.data ?? []) as Tarefa[]);
    setClientes((clientesResult.data ?? []) as ClienteOption[]);
  };
  useEffect(() => { load(); }, []);

  const salvar = async () => {
    if (!form.titulo.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await (supabase as any).from("tarefas").insert({
      user_id: u.user.id,
      titulo: form.titulo.trim(),
      descricao: form.descricao || null,
      prioridade: form.prioridade,
      prazo: form.prazo || null,
      cliente_id: form.cliente_id === "sem-cliente" ? null : form.cliente_id,
    });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: "Tarefa criada" });
    if (form.cliente_id !== "sem-cliente") {
      await (supabase as any).from("cliente_eventos").insert({ user_id: u.user.id, cliente_id: form.cliente_id, tipo: "tarefa", titulo: "Nova tarefa definida", descricao: form.titulo.trim() });
    }
    setForm({ titulo: "", descricao: "", prioridade: "media", prazo: "", cliente_id: "sem-cliente" });
    setOpen(false);
    load();
  };

  const mudarStatus = async (t: Tarefa) => {
    const next = t.status === "pendente" ? "em_andamento" : t.status === "em_andamento" ? "concluida" : "pendente";
    await (supabase as any).from("tarefas").update({
      status: next,
      concluida_em: next === "concluida" ? new Date().toISOString() : null,
    }).eq("id", t.id);
    load();
  };

  const excluir = async (id: string) => {
    await (supabase as any).from("tarefas").delete().eq("id", id);
    load();
  };

  const counts = {
    todas: items.length,
    pendente: items.filter((i) => i.status === "pendente").length,
    em_andamento: items.filter((i) => i.status === "em_andamento").length,
    concluida: items.filter((i) => i.status === "concluida").length,
  };
  const filtered = filtro === "todas" ? items : items.filter((i) => i.status === filtro);

  return (
    <div className="space-y-5">
      <PageHeader
        icon={CheckSquare}
        title="Tarefas"
        subtitle={`${counts.pendente + counts.em_andamento} abertas · ${counts.concluida} concluídas`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova tarefa</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Título</Label><Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></div>
                <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
                <div>
                  <Label>Cliente</Label>
                  <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sem-cliente">Sem cliente vinculado</SelectItem>
                      {clientes.map((cliente) => <SelectItem key={cliente.id} value={cliente.id}>{cliente.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Prioridade</Label>
                    <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Prazo</Label><Input type="date" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} /></div>
                </div>
                <Button onClick={salvar} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <FilterChips<"todas" | "pendente" | "em_andamento" | "concluida">
        value={filtro}
        onChange={setFiltro}
        options={[
          { value: "todas", label: "Todas", count: counts.todas },
          { value: "pendente", label: "Pendentes", count: counts.pendente },
          { value: "em_andamento", label: "Em andamento", count: counts.em_andamento },
          { value: "concluida", label: "Concluídas", count: counts.concluida },
        ]}
      />

      {filtered.length === 0 ? (
        items.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="Nenhuma tarefa"
            description="Crie sua primeira tarefa para organizar prazos e pendências."
            action={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Nova tarefa</Button>}
          />
        ) : (
          <EmptyState
            icon={ListChecks}
            title="Nada neste filtro"
            description={`Nenhuma tarefa ${filtro === "concluida" ? "concluída" : filtro === "em_andamento" ? "em andamento" : "pendente"} no momento.`}
          />
        )
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const Icon = t.status === "concluida" ? CheckCircle2 : t.status === "em_andamento" ? Clock : Circle;
            return (
              <Card key={t.id} className="p-3 flex items-start gap-3 hover:border-primary/40 transition">
                <button onClick={() => mudarStatus(t)} className="mt-0.5 shrink-0">
                  <Icon className={`h-5 w-5 ${t.status === "concluida" ? "text-[hsl(var(--success))]" : "text-muted-foreground"}`} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm ${t.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>
                    {t.titulo}
                  </div>
                  {t.descricao && <div className="text-xs text-muted-foreground line-clamp-2">{t.descricao}</div>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className={`flex items-center gap-1 ${prioridadeCor[t.prioridade]}`}>
                      <Flag className="h-3 w-3" />{t.prioridade}
                    </span>
                    {t.prazo && <span>Prazo: {new Date(t.prazo).toLocaleDateString("pt-BR")}</span>}
                    <span>{statusLabel[t.status]}</span>
                  </div>
                </div>
                <button onClick={() => excluir(t.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
