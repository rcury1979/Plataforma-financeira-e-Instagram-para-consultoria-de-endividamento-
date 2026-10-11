/* Tarefas combinadas com a educadora: status, prazos e comentários. */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, Circle, MessageCircle, MoreHorizontal, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { db, EmptyState, Field, fmtDate, inputCls, PageHeader, Pill, todayISO, useEducadorView, useUserId } from "./_shared";

type Tarefa = {
  id: string; titulo: string; descricao: string | null; prazo: string | null;
  status: "pendente" | "concluida"; concluida_em: string | null; created_at: string; criado_por: string | null;
};
type Comentario = { id: string; tarefa_id: string; autor_nome: string | null; texto: string; created_at: string };
type Aba = "pendentes" | "concluidas" | "todas";

const fmtDataHora = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${fmtDate(iso)} às ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function Tarefas() {
  const userId = useUserId();
  const educadora = useEducadorView();
  // id de quem está usando a tela (a educadora, no modo educadora; senão o próprio cliente)
  const [autorId, setAutorId] = useState<string | null>(null);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nome, setNome] = useState("Você");
  const [aba, setAba] = useState<Aba>("pendentes");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ open: boolean; editing: Tarefa | null }>({ open: false, editing: null });
  const [excluindo, setExcluindo] = useState<Tarefa | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data: auth } = await supabase.auth.getUser();
    const autor = educadora ? auth.user?.id ?? null : userId;
    const [t, c, p] = await Promise.all([
      db.from("cli_tarefas").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      db.from("cli_tarefa_comentarios").select("*").eq("user_id", userId).order("created_at"),
      db.from("profiles").select("full_name").eq("user_id", autor ?? userId).maybeSingle(),
    ]);
    setAutorId(autor);
    setTarefas(t.data ?? []);
    setComentarios(c.data ?? []);
    // comentários da educadora saem como "Nome (educadora)"
    if (educadora) setNome(`${p.data?.full_name || "Educadora"} (educadora)`);
    else if (p.data?.full_name) setNome(p.data.full_name);
    setLoading(false);
  }, [userId, educadora]);
  useEffect(() => { load(); }, [load]);

  const pendentes = tarefas.filter((t) => t.status !== "concluida");
  const concluidas = tarefas.filter((t) => t.status === "concluida");
  const lista = useMemo(() => {
    const base = aba === "pendentes" ? pendentes : aba === "concluidas" ? concluidas : tarefas;
    // pendentes primeiro, por prazo (sem prazo no fim)
    return [...base].sort((a, b) => {
      if (a.status !== b.status) return a.status === "concluida" ? 1 : -1;
      return (a.prazo || "9999").localeCompare(b.prazo || "9999");
    });
  }, [aba, tarefas]); // eslint-disable-line react-hooks/exhaustive-deps

  async function alternar(t: Tarefa) {
    const concluir = t.status !== "concluida";
    const patch = { status: concluir ? "concluida" : "pendente", concluida_em: concluir ? new Date().toISOString() : null };
    setTarefas((xs) => xs.map((x) => (x.id === t.id ? { ...x, ...patch } as Tarefa : x)));
    const { error } = await db.from("cli_tarefas").update(patch).eq("id", t.id).eq("user_id", userId);
    if (error) { toast.error("Não foi possível atualizar a tarefa."); load(); return; }
    toast.success(concluir ? "Tarefa concluída. Muito bem!" : "Tarefa reaberta.");
  }

  async function excluir() {
    if (!excluindo) return;
    await db.from("cli_tarefa_comentarios").delete().eq("tarefa_id", excluindo.id).eq("user_id", userId);
    const { error } = await db.from("cli_tarefas").delete().eq("id", excluindo.id).eq("user_id", userId);
    setExcluindo(null);
    if (error) return toast.error("Não foi possível excluir.");
    toast.success("Tarefa excluída.");
    load();
  }

  const abas: { k: Aba; label: string; n: number }[] = [
    { k: "pendentes", label: "Pendentes", n: pendentes.length },
    { k: "concluidas", label: "Concluídas", n: concluidas.length },
    { k: "todas", label: "Todas", n: tarefas.length },
  ];

  return (
    <div>
      <PageHeader
        title="Tarefas"
        desc={educadora
          ? "Atividades combinadas com o cliente no planejamento financeiro. Crie tarefas e acompanhe pelos comentários."
          : "Atividades combinadas com sua educadora no planejamento financeiro, com status, prazos e comentários."}
        right={<Pill variant="solid" onClick={() => setForm({ open: true, editing: null })}><Plus className="h-4 w-4" /> Nova tarefa</Pill>}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {abas.map((a) => {
          const ativa = aba === a.k;
          return (
            <button
              key={a.k}
              type="button"
              onClick={() => setAba(a.k)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm transition sm:gap-2 sm:px-4 ${ativa ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground hover:bg-secondary"}`}
            >
              {a.label}
              <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold ${ativa ? "bg-primary-foreground/20" : "bg-secondary text-muted-foreground"}`}>{a.n}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : lista.length === 0 ? (
        <EmptyState
          title={aba === "concluidas" ? "Nenhuma tarefa concluída ainda" : aba === "pendentes" ? "Nenhuma tarefa pendente" : "Nenhuma tarefa por aqui"}
          desc={aba === "pendentes" ? "Tudo em dia! Quando sua educadora combinar uma nova atividade, ela aparece aqui." : "Crie uma tarefa para acompanhar o que foi combinado."}
          action={aba !== "concluidas" ? <Pill variant="solid" onClick={() => setForm({ open: true, editing: null })}><Plus className="h-4 w-4" /> Nova tarefa</Pill> : undefined}
        />
      ) : (
        <div className="space-y-3">
          {lista.map((t) => (
            <TarefaCard
              key={t.id}
              t={t}
              comentarios={comentarios.filter((c) => c.tarefa_id === t.id)}
              userId={userId!}
              nome={nome}
              daEducadora={!!t.criado_por && t.criado_por !== userId}
              onToggle={() => alternar(t)}
              onEdit={() => setForm({ open: true, editing: t })}
              onDelete={() => setExcluindo(t)}
              onComentou={(c) => setComentarios((xs) => [...xs, c])}
            />
          ))}
        </div>
      )}

      {userId && (
        <TarefaDialog
          criadoPor={autorId ?? userId}
          open={form.open}
          editing={form.editing}
          userId={userId}
          onOpenChange={(v) => setForm((f) => ({ ...f, open: v }))}
          onSaved={load}
        />
      )}

      <AlertDialog open={!!excluindo} onOpenChange={(v) => !v && setExcluindo(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>"{excluindo?.titulo}" e os comentários dela serão apagados. Isso não pode ser desfeito.</AlertDialogDescription>
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
  t, comentarios, userId, nome, daEducadora, onToggle, onEdit, onDelete, onComentou,
}: {
  t: Tarefa; comentarios: Comentario[]; userId: string; nome: string; daEducadora: boolean;
  onToggle: () => void; onEdit: () => void; onDelete: () => void; onComentou: (c: Comentario) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const feita = t.status === "concluida";
  const atrasada = !feita && !!t.prazo && t.prazo < todayISO();

  async function comentar() {
    const txt = texto.trim();
    if (!txt) return;
    setEnviando(true);
    const { data, error } = await db.from("cli_tarefa_comentarios")
      .insert({ user_id: userId, tarefa_id: t.id, autor_nome: nome, texto: txt }).select().single();
    setEnviando(false);
    if (error) return toast.error("Não foi possível enviar o comentário.");
    onComentou(data);
    setTexto("");
  }

  return (
    <div className={`rounded-2xl border bg-card p-4 shadow-[0_1px_3px_hsl(222_47%_14%/0.06)] sm:p-5 ${feita ? "border-gold/50" : atrasada ? "border-destructive/40" : "border-border"}`}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-label={feita ? "Reabrir tarefa" : "Concluir tarefa"}
          title={feita ? "Reabrir tarefa" : "Marcar como concluída"}
          className="mt-0.5 shrink-0 rounded-full text-muted-foreground transition hover:text-gold"
        >
          {feita ? <CheckCircle2 className="h-6 w-6 text-gold" /> : <Circle className="h-6 w-6" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={`break-words font-medium ${feita ? "text-muted-foreground line-through" : "text-foreground"}`}>{t.titulo}</p>
            <div className="flex shrink-0 items-center gap-1">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${feita ? "bg-gold text-primary" : atrasada ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"}`}>
                {feita ? "Concluída" : "Pendente"}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label="Mais opções" className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary"><MoreHorizontal className="h-4 w-4" /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem onClick={onEdit}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                  <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {daEducadora && (
            <span className="mt-1 inline-flex rounded-full bg-gold-soft px-2.5 py-0.5 text-[11px] font-semibold text-gold">Criada pela educadora</span>
          )}
          {t.descricao && <p className="mt-1 whitespace-pre-line break-words text-sm text-muted-foreground">{t.descricao}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {feita && t.concluida_em && (
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Concluída em {fmtDate(t.concluida_em)}</span>
            )}
            {!feita && t.prazo && (
              <span className={`inline-flex items-center gap-1 ${atrasada ? "font-medium text-destructive" : ""}`}>
                <CalendarDays className="h-3.5 w-3.5" /> Prazo {fmtDate(t.prazo)}{atrasada && " · Atrasada"}
              </span>
            )}
            <button type="button" onClick={() => setAberto((v) => !v)} className="inline-flex items-center gap-1 rounded-full hover:text-foreground" aria-expanded={aberto}>
              <MessageCircle className="h-3.5 w-3.5" />
              {comentarios.length === 0 ? "Comentar" : `${comentarios.length} comentário${comentarios.length > 1 ? "s" : ""}`}
            </button>
          </div>

          {aberto && (
            <div className="mt-3 space-y-2 border-t border-border pt-3">
              {comentarios.length === 0 && <p className="text-xs text-muted-foreground">Nenhum comentário ainda. Conte como está indo ou tire uma dúvida.</p>}
              {comentarios.map((c) => {
                const meu = c.autor_nome === nome;
                return (
                  <div key={c.id} className={`max-w-[92%] rounded-2xl px-3.5 py-2 text-sm ${meu ? "ml-auto bg-primary/5" : "bg-gold-soft"}`}>
                    <p className="text-[11px] font-semibold text-foreground">{c.autor_nome || "Sem nome"} <span className="font-normal text-muted-foreground">· {fmtDataHora(c.created_at)}</span></p>
                    <p className="whitespace-pre-line break-words text-foreground">{c.texto}</p>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 pt-1">
                <input
                  className={inputCls}
                  placeholder="Escreva um comentário…"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") comentar(); }}
                  aria-label="Novo comentário"
                />
                <button type="button" onClick={comentar} disabled={enviando || !texto.trim()} aria-label="Enviar comentário"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TarefaDialog({
  open, editing, userId, criadoPor, onOpenChange, onSaved,
}: { open: boolean; editing: Tarefa | null; userId: string; criadoPor: string; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prazo, setPrazo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitulo(editing?.titulo ?? "");
    setDescricao(editing?.descricao ?? "");
    setPrazo(editing?.prazo ?? "");
  }, [open, editing]);

  async function salvar() {
    if (!titulo.trim()) return toast.error("Dê um título para a tarefa.");
    setSaving(true);
    const row = { titulo: titulo.trim(), descricao: descricao.trim() || null, prazo: prazo || null };
    const { error } = editing
      ? await db.from("cli_tarefas").update(row).eq("id", editing.id).eq("user_id", userId)
      : await db.from("cli_tarefas").insert({ ...row, user_id: userId, status: "pendente", criado_por: criadoPor });
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar a tarefa.");
    toast.success(editing ? "Tarefa atualizada." : "Tarefa criada.");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader><DialogTitle>{editing ? "Editar tarefa" : "Nova tarefa"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Título"><input className={inputCls} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Separar a reserva de emergência" autoFocus /></Field>
          <Field label="Descrição (opcional)">
            <textarea className={inputCls + " h-24 rounded-2xl py-2"} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes do que foi combinado" />
          </Field>
          <Field label="Prazo (opcional)"><input type="date" className={inputCls} value={prazo} onChange={(e) => setPrazo(e.target.value)} /></Field>
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Pill onClick={() => onOpenChange(false)}>Cancelar</Pill>
          <Pill variant="solid" onClick={salvar} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Pill>
        </div>
      </DialogContent>
    </Dialog>
  );
}
