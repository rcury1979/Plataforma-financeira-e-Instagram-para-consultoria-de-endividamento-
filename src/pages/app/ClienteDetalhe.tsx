import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  AlertTriangle, BadgeCheck, Banknote, CalendarDays, CheckCircle2, CircleDollarSign,
  Clock, Download, FileText, ListChecks, MessageSquarePlus, TrendingDown, TrendingUp,
} from "lucide-react";
import ClienteAnamnese from "./ClienteAnamnese";
import { Link } from "react-router-dom";

type Cliente = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  documento: string | null;
  observacoes: string | null;
  tipo_pessoa?: "PF" | "PJ";
};

type Conta = { id: string; descricao: string | null; valor: number; vencimento: string; recebido: boolean | null; data_recebimento: string | null; forma_pagamento: string | null };
type Lancamento = { id: string; tipo: "receita" | "despesa"; descricao: string; categoria: string | null; valor: number; data: string; planejado: boolean };
type Tarefa = { id: string; titulo: string; status: string; prioridade: string; prazo: string | null };
type Agendamento = { id: string; assunto: string | null; inicio: string; status: string; duracao_min: number };
type Evento = { id: string; tipo: string; titulo: string; descricao: string | null; ocorrido_em: string };

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBr = (value: string) => new Date(value.length === 10 ? `${value}T00:00:00` : value).toLocaleDateString("pt-BR");

function Kpi({ icon: Icon, label, value, tone = "info" }: { icon: typeof TrendingUp; label: string; value: string; tone?: "success" | "danger" | "warning" | "info" }) {
  const toneMap = {
    success: "text-[hsl(var(--success))] bg-[hsl(var(--success))]/10",
    danger: "text-destructive bg-destructive/10",
    warning: "text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10",
    info: "text-primary bg-primary/10",
  } as const;
  return (
    <Card className="p-3">
      <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${toneMap[tone]}`}><Icon className="h-4 w-4" /></div>
      <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
    </Card>
  );
}

export function ClienteDetalhe({ cliente, open, onOpenChange }: { cliente: Cliente | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [contas, setContas] = useState<Conta[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [nota, setNota] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!cliente) return;
    setLoading(true);
    const [co, la, ta, ag, ev] = await Promise.all([
      (supabase as any).from("contas_receber").select("id,descricao,valor,vencimento,recebido,data_recebimento,forma_pagamento").eq("cliente", cliente.nome).order("vencimento", { ascending: false }),
      (supabase as any).from("lancamentos").select("id,tipo,descricao,categoria,valor,data,planejado").eq("cliente_id", cliente.id).order("data", { ascending: false }),
      (supabase as any).from("tarefas").select("id,titulo,status,prioridade,prazo").eq("cliente_id", cliente.id).order("created_at", { ascending: false }),
      (supabase as any).from("agendamentos").select("id,assunto,inicio,status,duracao_min").eq("cliente_id", cliente.id).order("inicio", { ascending: false }),
      (supabase as any).from("cliente_eventos").select("id,tipo,titulo,descricao,ocorrido_em").eq("cliente_id", cliente.id).order("ocorrido_em", { ascending: false }),
    ]);
    setContas((co.data ?? []) as Conta[]);
    setLancamentos((la.data ?? []) as Lancamento[]);
    setTarefas((ta.data ?? []) as Tarefa[]);
    setAgendamentos((ag.data ?? []) as Agendamento[]);
    setEventos((ev.data ?? []) as Evento[]);
    setLoading(false);
  };

  useEffect(() => { if (cliente && open) void load(); }, [cliente, open]);

  const stats = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10);
    const receitas = lancamentos.filter((l) => l.tipo === "receita").reduce((s, l) => s + Number(l.valor), 0);
    const despesas = lancamentos.filter((l) => l.tipo === "despesa").reduce((s, l) => s + Number(l.valor), 0);
    const recebido = contas.filter((c) => c.recebido).reduce((s, c) => s + Number(c.valor), 0);
    const vencido = contas.filter((c) => !c.recebido && c.vencimento < hoje).reduce((s, c) => s + Number(c.valor), 0);
    const pendencias = tarefas.filter((t) => t.status !== "concluida").length;
    return { receitas, despesas, saldo: receitas - despesas, recebido, vencido, pendencias };
  }, [contas, lancamentos, tarefas]);

  const adicionarNota = async () => {
    if (!cliente || !nota.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await (supabase as any).from("cliente_eventos").insert({ cliente_id: cliente.id, user_id: user.id, tipo: "nota", titulo: "Nota de acompanhamento", descricao: nota.trim() });
    if (error) return toast.error(error.message);
    setNota("");
    toast.success("Nota adicionada à jornada");
    void load();
  };

  const exportarCsv = () => {
    if (!cliente) return;
    const rows = lancamentos.map((l) => [l.data, l.tipo, l.descricao, l.categoria ?? "", Number(l.valor).toFixed(2).replace(".", ","), l.planejado ? "Planejado" : "Realizado"]);
    const csv = [["Data", "Tipo", "Descrição", "Categoria", "Valor", "Situação"], ...rows].map((r) => r.map((v) => `"${String(v).replace(/[";\n]/g, " ")}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = `jornada_${cliente.nome.replace(/\s+/g, "_")}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  if (!cliente) return null;
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {cliente.nome}
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-normal text-primary">{cliente.tipo_pessoa ?? "PF"}</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Jornada financeira completa e compartilhada com segurança.</p>
        </DialogHeader>

        <Tabs defaultValue="resumo">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 md:grid-cols-6">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="anamnese">Anamnese</TabsTrigger>
            <TabsTrigger value="jornada">Jornada</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="space-y-4 pt-3">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Kpi icon={TrendingUp} label="Receitas" value={brl(stats.receitas)} tone="success" />
              <Kpi icon={TrendingDown} label="Despesas" value={brl(stats.despesas)} tone="danger" />
              <Kpi icon={CircleDollarSign} label="Saldo" value={brl(stats.saldo)} tone={stats.saldo >= 0 ? "info" : "danger"} />
              <Kpi icon={ListChecks} label="Pendências" value={String(stats.pendencias)} tone={stats.pendencias ? "warning" : "success"} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-sm">
                <h3 className="font-medium">Dados de contato</h3>
                <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3">
                  <div><div className="text-xs text-muted-foreground">E-mail</div><div className="break-all">{cliente.email || "—"}</div></div>
                  <div><div className="text-xs text-muted-foreground">Telefone</div><div>{cliente.telefone || "—"}</div></div>
                  <div><div className="text-xs text-muted-foreground">CPF / CNPJ</div><div>{cliente.documento || "—"}</div></div>
                  <div><div className="text-xs text-muted-foreground">Cobranças recebidas</div><div>{brl(stats.recebido)}</div></div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Atenção agora</h3>
                <div className="rounded-md border border-border p-3 text-sm">
                  {stats.vencido > 0 && <p className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-4 w-4" />{brl(stats.vencido)} em cobranças vencidas</p>}
                  {stats.pendencias > 0 && <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-[hsl(var(--warning))]" />{stats.pendencias} {stats.pendencias === 1 ? "tarefa aberta" : "tarefas abertas"}</p>}
                  {!stats.vencido && !stats.pendencias && <p className="flex items-center gap-2 text-[hsl(var(--success))]"><CheckCircle2 className="h-4 w-4" />Acompanhamento em dia</p>}
                </div>
              </div>
            </div>
            {cliente.observacoes && <div><div className="mb-1 text-xs text-muted-foreground">Observações</div><div className="whitespace-pre-wrap text-sm">{cliente.observacoes}</div></div>}
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-4 pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-medium">Extrato vinculado ({lancamentos.length})</h3><div className="flex flex-wrap gap-2"><Button asChild size="sm"><Link to={`/app/importar-pdf?cliente_id=${cliente.id}`}><FileText className="mr-1 h-3.5 w-3.5" />Ler extrato com IA</Link></Button><Button size="sm" variant="outline" onClick={exportarCsv} disabled={!lancamentos.length}><Download className="mr-1 h-3.5 w-3.5" />Exportar CSV</Button></div></div>
            {loading ? <p className="py-6 text-center text-sm text-muted-foreground">Carregando…</p> : lancamentos.length === 0 ? <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">Nenhum lançamento vinculado a este cliente.</p> : (
              <div className="divide-y rounded-md border border-border">{lancamentos.map((l) => <div key={l.id} className="flex items-center gap-3 p-3"><div className={`flex h-8 w-8 items-center justify-center rounded-full ${l.tipo === "receita" ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" : "bg-destructive/10 text-destructive"}`}>{l.tipo === "receita" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{l.descricao}</p><p className="text-xs text-muted-foreground">{l.categoria || "Sem categoria"} · {dataBr(l.data)} · {l.planejado ? "Planejado" : "Realizado"}</p></div><strong className="text-sm tabular-nums">{brl(Number(l.valor))}</strong></div>)}</div>
            )}
          </TabsContent>

          <TabsContent value="tarefas" className="space-y-3 pt-3">
            <h3 className="text-sm font-medium">Plano de ação ({tarefas.length})</h3>
            {tarefas.length === 0 ? <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">Nenhuma tarefa vinculada.</p> : <div className="divide-y rounded-md border border-border">{tarefas.map((t) => <div key={t.id} className="flex items-start gap-3 p-3"><BadgeCheck className={`mt-0.5 h-4 w-4 ${t.status === "concluida" ? "text-[hsl(var(--success))]" : "text-muted-foreground"}`} /><div className="flex-1"><p className="text-sm font-medium">{t.titulo}</p><p className="text-xs text-muted-foreground">{t.status.replace("_", " ")} · prioridade {t.prioridade}{t.prazo ? ` · prazo ${dataBr(t.prazo)}` : ""}</p></div></div>)}</div>}
          </TabsContent>

          <TabsContent value="agenda" className="space-y-3 pt-3">
            <h3 className="text-sm font-medium">Atendimentos ({agendamentos.length})</h3>
            {agendamentos.length === 0 ? <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">Nenhum atendimento vinculado.</p> : <div className="divide-y rounded-md border border-border">{agendamentos.map((a) => <div key={a.id} className="flex items-start gap-3 p-3"><CalendarDays className="mt-0.5 h-4 w-4 text-primary" /><div><p className="text-sm font-medium">{a.assunto || "Atendimento financeiro"}</p><p className="text-xs text-muted-foreground">{new Date(a.inicio).toLocaleString("pt-BR")} · {a.duracao_min} min · {a.status}</p></div></div>)}</div>}
          </TabsContent>

          <TabsContent value="anamnese"><ClienteAnamnese clienteId={cliente.id} clienteNome={cliente.nome} /></TabsContent>

          <TabsContent value="jornada" className="space-y-4 pt-3">
            <div className="space-y-2"><Textarea value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Registre uma orientação, decisão ou avanço deste atendimento…" rows={2} /><Button size="sm" onClick={adicionarNota} disabled={!nota.trim()}><MessageSquarePlus className="mr-1 h-4 w-4" />Adicionar nota</Button></div>
            {eventos.length === 0 ? <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">A jornada começará com o primeiro registro.</p> : <div className="relative space-y-0 border-l border-border pl-5">{eventos.map((e) => <div key={e.id} className="relative pb-5"><span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-primary" /><p className="text-sm font-medium">{e.titulo}</p>{e.descricao && <p className="whitespace-pre-wrap text-xs text-muted-foreground">{e.descricao}</p>}<p className="mt-1 text-[11px] text-muted-foreground">{new Date(e.ocorrido_em).toLocaleString("pt-BR")}</p></div>)}</div>}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}