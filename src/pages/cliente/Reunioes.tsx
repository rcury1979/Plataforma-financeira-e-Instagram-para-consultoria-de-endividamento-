/* Diário de reuniões: linha do tempo das reuniões registradas pela educadora.
 * O cliente só lê; a educadora (modo educadora) registra, edita e exclui. */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { db, fmtDate, useUserId, useEducadorView, PageHeader, Panel, EmptyState, DIAS_SEMANA, Field, inputCls, Pill, todayISO } from "./_shared";

type Reuniao = { id: string; data: string; titulo: string; resumo: string | null; material_url: string | null };

const diaSemana = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return DIAS_SEMANA[new Date(y, m - 1, d).getDay()];
};

export default function Reunioes() {
  const userId = useUserId();
  const educadora = useEducadorView();
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ open: boolean; editing: Reuniao | null }>({ open: false, editing: null });
  const [excluindo, setExcluindo] = useState<Reuniao | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data } = await db.from("cli_reunioes").select("*").eq("user_id", userId).order("data", { ascending: false });
    setReunioes(data ?? []);
    setLoading(false);
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  async function excluir() {
    if (!excluindo) return;
    const { error } = await db.from("cli_reunioes").delete().eq("id", excluindo.id).eq("user_id", userId);
    setExcluindo(null);
    if (error) return toast.error("Não foi possível excluir a reunião.");
    toast.success("Reunião excluída.");
    load();
  }

  const novo = () => setForm({ open: true, editing: null });

  return (
    <div>
      <PageHeader
        title="Diário de reuniões"
        desc={educadora
          ? "Registre o que foi conversado em cada reunião e compartilhe o material com o cliente."
          : "Acompanhe a evolução das suas reuniões e baixe os materiais compartilhados."}
        right={educadora ? <Pill variant="solid" onClick={novo}><Plus className="h-4 w-4" /> Registrar reunião</Pill> : undefined}
      />
      {loading ? null : reunioes.length === 0 ? (
        educadora ? (
          <EmptyState title="Nenhuma reunião registrada" desc="Registre a primeira reunião para o cliente acompanhar por aqui."
            action={<Pill variant="solid" onClick={novo}><Plus className="h-4 w-4" /> Registrar reunião</Pill>} />
        ) : (
          <EmptyState title="Nenhuma reunião registrada" desc="Quando sua educadora compartilhar uma reunião, ela aparece aqui." />
        )
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-6 sm:ml-2">
          {reunioes.map((r, i) => (
            <li key={r.id} className="relative">
              <span className={`absolute -left-[31px] top-5 h-3 w-3 rounded-full ring-4 ring-background ${i === 0 ? "bg-gold" : "bg-primary/40"}`} />
              <Panel>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" /> {fmtDate(r.data)} · {diaSemana(r.data)}
                    </p>
                    <h2 className="mt-1 break-words font-display text-lg text-foreground">{r.titulo}</h2>
                    {r.resumo && <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">{r.resumo}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1 self-start">
                    {r.material_url && (
                      <a href={r.material_url} target="_blank" rel="noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary">
                        <Download className="h-4 w-4" /> Baixar material
                      </a>
                    )}
                    {educadora && (
                      <>
                        <button type="button" onClick={() => setForm({ open: true, editing: r })} aria-label="Editar reunião" title="Editar"
                          className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => setExcluindo(r)} aria-label="Excluir reunião" title="Excluir"
                          className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Panel>
            </li>
          ))}
        </ol>
      )}

      {educadora && userId && (
        <ReuniaoDialog
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
            <AlertDialogTitle>Excluir reunião?</AlertDialogTitle>
            <AlertDialogDescription>"{excluindo?.titulo}" sai do diário do cliente. Isso não pode ser desfeito.</AlertDialogDescription>
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

function ReuniaoDialog({
  open, editing, userId, onOpenChange, onSaved,
}: { open: boolean; editing: Reuniao | null; userId: string; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [data, setData] = useState(todayISO());
  const [titulo, setTitulo] = useState("");
  const [resumo, setResumo] = useState("");
  const [material, setMaterial] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setData(editing?.data?.slice(0, 10) ?? todayISO());
    setTitulo(editing?.titulo ?? "");
    setResumo(editing?.resumo ?? "");
    setMaterial(editing?.material_url ?? "");
  }, [open, editing]);

  async function salvar() {
    if (!titulo.trim()) return toast.error("Dê um título para a reunião.");
    if (!data) return toast.error("Informe a data da reunião.");
    let url = material.trim();
    if (url && !/^https?:\/\//i.test(url)) url = "https://" + url;
    setSaving(true);
    const row = { data, titulo: titulo.trim(), resumo: resumo.trim() || null, material_url: url || null };
    let error;
    if (editing) {
      ({ error } = await db.from("cli_reunioes").update(row).eq("id", editing.id).eq("user_id", userId));
    } else {
      const { data: auth } = await supabase.auth.getUser();
      ({ error } = await db.from("cli_reunioes").insert({ ...row, user_id: userId, created_by: auth.user?.id ?? null }));
    }
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar a reunião.");
    toast.success(editing ? "Reunião atualizada." : "Reunião registrada.");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader><DialogTitle>{editing ? "Editar reunião" : "Registrar reunião"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Data"><input type="date" className={inputCls} value={data} onChange={(e) => setData(e.target.value)} /></Field>
          <Field label="Título"><input className={inputCls} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Reunião 2: orçamento do mês" /></Field>
          <Field label="Resumo (opcional)">
            <textarea className={inputCls.replace("rounded-full", "rounded-2xl") + " h-28 py-2"} value={resumo} onChange={(e) => setResumo(e.target.value)} placeholder="O que conversamos e os próximos passos" />
          </Field>
          <Field label="Link do material (opcional)" hint="Ex.: link do Google Drive com a planilha ou a apresentação.">
            <input type="url" className={inputCls} value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="https://" />
          </Field>
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Pill onClick={() => onOpenChange(false)}>Cancelar</Pill>
          <Pill variant="solid" onClick={salvar} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Pill>
        </div>
      </DialogContent>
    </Dialog>
  );
}
