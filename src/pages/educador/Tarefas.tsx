/* Tarefas da educadora: as dos clientes vinculados ("Do cliente") e as dela ("Minhas"). */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, CalendarDays, CheckCircle2, Circle, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { db, EmptyState, fmtDate, PageHeader, Pill, todayISO, useUserId } from "../cliente/_shared";
import { PARA_MIM, TarefaDialog, type ClienteVinculado, type EduTarefa } from "./_tarefas-dialog";

type Aba = "cliente" | "minhas";
type Sub = "pendentes" | "concluidas" | "todas";

const iniciais = (nome: string) =>
  nome.replace(/\(.*?\)/g, "").trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";

export default function EduTarefas() {
  const eduId = useUserId();
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<ClienteVinculado[]>([]);
  const [tarefas, setTarefas] = useState<EduTarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<Aba>("cliente");
  const [sub, setSub] = useState<Sub>("pendentes");
  const [soVencidas, setSoVencidas] = useState(false);
  const [form, setForm] = useState<{ open: boolean; editing: EduTarefa | null }>({ open: false, editing: null });
  const [excluindo, setExcluindo] = useState<EduTarefa | null>(null);
  const hoje = todayISO();

  const load = useCallback(async () => {
    if (!eduId) return;
    // clientes vinculados à educadora (com conta no app e não arquivados)
    const { data: cs } = await db.from("clientes").select("id, nome, cliente_user_id, arquivado").eq("user_id", eduId);
    const vinc: ClienteVinculado[] = (cs ?? [])
      .filter((c: any) => c.cliente_user_id && !c.arquivado)
      .map((c: any) => ({ id: c.id, nome: c.nome, cliente_user_id: c.cliente_user_id }))
      .sort((a: ClienteVinculado, b: ClienteVinculado) => a.nome.localeCompare(b.nome, "pt-BR"));
    const ids = [eduId, ...vinc.map((c) => c.cliente_user_id)];
    const { data: ts, error } = await db.from("cli_tarefas").select("*").in("user_id", ids).order("created_at", { ascending: false });
    if (error) toast.error("Não foi possível carregar as tarefas.");
    setClientes(vinc);
    setTarefas(ts ?? []);
    setLoading(false);
  }, [eduId]);
  useEffect(() => { load(); }, [load]);

  const clientePorUser = useMemo(() => new Map(clientes.map((c) => [c.cliente_user_id, c])), [clientes]);
  const vencida = useCallback((t: EduTarefa) => t.status !== "concluida" && !!t.prazo && t.prazo.slice(0, 10) < hoje, [hoje]);

  // tarefas da aba atual (antes dos filtros de status)
  const daAba = useMemo(
    () => tarefas.filter((t) => (aba === "minhas" ? t.user_id === eduId : t.user_id !== eduId && clientePorUser.has(t.user_id))),
    [tarefas, aba, eduId, clientePorUser],
  );
  const pendentes = daAba.filter((t) => t.status !== "concluida");
  const concluidas = daAba.filter((t) => t.status === "concluida");
  const nVencidas = daAba.filter(vencida).length;

  const lista = useMemo(() => {
    let base = sub === "pendentes" ? pendentes : sub === "concluidas" ? concluidas : daAba;
    if (soVencidas) base = base.filter(vencida);
    return [...base].sort((a, b) => {
      if (a.status !== b.status) return a.status === "concluida" ? 1 : -1;
      return (a.prazo || "9999").localeCompare(b.prazo || "9999");
    });
  }, [sub, soVencidas, daAba]); // eslint-disable-line react-hooks/exhaustive-deps

  async function alternar(t: EduTarefa) {
    const concluir = t.status !== "concluida";
    const patch = { status: concluir ? "concluida" : "pendente", concluida_em: concluir ? new Date().toISOString() : null };
    setTarefas((xs) => xs.map((x) => (x.id === t.id ? ({ ...x, ...patch } as EduTarefa) : x)));
    const { error } = await db.from("cli_tarefas").update(patch).eq("id", t.id).eq("user_id", t.user_id);
    if (error) { toast.error("Não foi possível atualizar a tarefa."); load(); return; }
    toast.success(concluir ? "Tarefa concluída." : "Tarefa reaberta.");
  }

  async function excluir() {
    if (!excluindo) return;
    const t = excluindo;
    setExcluindo(null);
    await db.from("cli_tarefa_comentarios").delete().eq("tarefa_id", t.id).eq("user_id", t.user_id);
    const { error } = await db.from("cli_tarefas").delete().eq("id", t.id).eq("user_id", t.user_id);
    if (error) return toast.error("Não foi possível excluir.");
    toast.success("Tarefa excluída.");
    load();
  }

  const subs: { k: Sub; label: string; n: number }[] = [
    { k: "pendentes", label: "Pendentes", n: pendentes.length },
    { k: "concluidas", label: "Concluídas", n: concluidas.length },
    { k: "todas", label: "Todas", n: daAba.length },
  ];
  const novaTarefa = () => setForm({ open: true, editing: null });

  return (
    <div>
      <PageHeader
        title="Tarefas"
        desc="O que seus clientes têm para fazer, e o que você tem para fazer."
        right={<Pill variant="solid" onClick={novaTarefa}><Plus className="h-4 w-4" /> Nova tarefa</Pill>}
      />

      {/* abas largas */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-full bg-secondary p-1">
        {([["cliente", "Do cliente"], ["minhas", "Minhas"]] as [Aba, string][]).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setAba(k)}
            className={`h-10 rounded-full text-sm transition ${aba === k ? "bg-card font-semibold text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* sub-abas + filtro de vencidas */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {subs.map((s) => {
            const ativa = sub === s.k;
            return (
              <button
                key={s.k}
                type="button"
                onClick={() => setSub(s.k)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm transition sm:gap-2 sm:px-4 ${ativa ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground hover:bg-secondary"}`}
              >
                {s.label}
                <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold ${ativa ? "bg-primary-foreground/20" : "bg-secondary text-muted-foreground"}`}>{s.n}</span>
              </button>
            );
          })}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <Switch checked={soVencidas} onCheckedChange={setSoVencidas} aria-label="Apenas vencidas" />
          <AlertTriangle className={`h-4 w-4 ${nVencidas ? "text-destructive" : "text-muted-foreground"}`} />
          Apenas vencidas ({nVencidas})
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : lista.length === 0 ? (
        <EmptyState
          title={soVencidas ? "Nenhuma tarefa vencida" : sub === "concluidas" ? "Nenhuma tarefa concluída ainda" : "Nenhuma tarefa por aqui"}
          desc={
            aba === "cliente"
              ? clientes.length === 0
                ? "Quando um cliente aceitar o convite e entrar no app, as tarefas dele aparecem aqui."
                : "Crie uma tarefa para um cliente e acompanhe o andamento por aqui."
              : "Anote aqui o que você precisa fazer: preparar material, retornar contatos, revisar planilhas."
          }
          action={!soVencidas && sub !== "concluidas" ? <Pill variant="solid" onClick={novaTarefa}><Plus className="h-4 w-4" /> Nova tarefa</Pill> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {lista.map((t) => (
            <TarefaCard
              key={t.id}
              t={t}
              vencida={vencida(t)}
              cliente={aba === "cliente" ? clientePorUser.get(t.user_id) : undefined}
              onAbrirCliente={(c) => navigate(`/educador/clientes/${c.cliente_user_id}/tarefas`)}
              onToggle={() => alternar(t)}
              onEdit={() => setForm({ open: true, editing: t })}
              onDelete={() => setExcluindo(t)}
            />
          ))}
        </div>
      )}

      {eduId && (
        <TarefaDialog
          open={form.open}
          onOpenChange={(v) => setForm((f) => ({ ...f, open: v }))}
          editing={form.editing}
          eduId={eduId}
          clientes={clientes}
          destinoInicial={aba === "cliente" && clientes[0] ? clientes[0].cliente_user_id : PARA_MIM}
          onSaved={load}
        />
      )}

      <AlertDialog open={!!excluindo} onOpenChange={(v) => !v && setExcluindo(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              “{excluindo?.titulo}” será removida{excluindo && excluindo.user_id !== eduId ? " também da área do cliente" : ""}. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={excluir}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TarefaCard({
  t, vencida, cliente, onAbrirCliente, onToggle, onEdit, onDelete,
}: {
  t: EduTarefa; vencida: boolean; cliente?: ClienteVinculado;
  onAbrirCliente: (c: ClienteVinculado) => void; onToggle: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const feita = t.status === "concluida";
  const selo = feita
    ? { txt: "Concluída", cls: "bg-success/10 text-success" }
    : vencida
      ? { txt: "Vencida", cls: "bg-destructive/10 text-destructive" }
      : { txt: "Pendente", cls: "bg-gold-soft text-primary" };

  return (
    <div className="relative flex gap-3 overflow-hidden rounded-2xl border border-border bg-card p-4 pl-5 shadow-[0_1px_3px_hsl(222_47%_14%/0.06)] sm:p-5 sm:pl-6">
      {vencida && <span className="absolute inset-y-0 left-0 w-1.5 bg-destructive" aria-hidden />}
      <button type="button" onClick={onToggle} className="mt-0.5 shrink-0 self-start text-muted-foreground transition hover:text-success" aria-label={feita ? "Reabrir tarefa" : "Concluir tarefa"}>
        {feita ? <CheckCircle2 className="h-6 w-6 text-success" /> : <Circle className="h-6 w-6" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`font-medium leading-snug ${feita ? "text-muted-foreground line-through" : "text-foreground"}`}>{t.titulo}</p>
          <div className="flex shrink-0 items-center gap-1">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${selo.cls}`}>{selo.txt}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary" aria-label="Ações da tarefa">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem onClick={onEdit}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {t.descricao && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.descricao}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
          {cliente && (
            <button type="button" onClick={() => onAbrirCliente(cliente)} className="inline-flex min-w-0 items-center gap-2 rounded-full text-foreground hover:text-primary hover:underline">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold-soft text-[10px] font-semibold text-primary">{iniciais(cliente.nome)}</span>
              <span className="truncate">{cliente.nome}</span>
            </button>
          )}
          {t.prazo && (
            <span className={`inline-flex items-center gap-1.5 ${vencida ? "font-medium text-destructive" : "text-muted-foreground"}`}>
              <CalendarDays className="h-3.5 w-3.5" />
              {vencida ? `Venceu em ${fmtDate(t.prazo)}` : `Prazo ${fmtDate(t.prazo).slice(0, 5)}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
