/* Formulário de tarefa da educadora: para ela mesma ou para um cliente vinculado. */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { db, Field, inputCls, Pill, selectCls } from "../cliente/_shared";

export type EduTarefa = {
  id: string; user_id: string; titulo: string; descricao: string | null; prazo: string | null;
  status: "pendente" | "concluida"; concluida_em: string | null; criado_por: string | null; created_at: string;
};
export type ClienteVinculado = { id: string; nome: string; cliente_user_id: string };

export const PARA_MIM = "__eu__";

export function TarefaDialog({
  open, onOpenChange, editing, eduId, clientes, destinoInicial, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: EduTarefa | null;
  eduId: string;
  clientes: ClienteVinculado[];
  destinoInicial: string;
  onSaved: () => void;
}) {
  const [destino, setDestino] = useState(PARA_MIM);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prazo, setPrazo] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDestino(editing ? (editing.user_id === eduId ? PARA_MIM : editing.user_id) : destinoInicial);
    setTitulo(editing?.titulo ?? "");
    setDescricao(editing?.descricao ?? "");
    setPrazo(editing?.prazo?.slice(0, 10) ?? "");
  }, [open, editing, eduId, destinoInicial]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return toast.error("Dê um título para a tarefa.");
    const userId = destino === PARA_MIM ? eduId : destino;
    // segurança: só grava para a própria educadora ou para cliente vinculado a ela
    if (userId !== eduId && !clientes.some((c) => c.cliente_user_id === userId)) return toast.error("Escolha um cliente válido.");
    setSalvando(true);
    const dados = { titulo: titulo.trim(), descricao: descricao.trim() || null, prazo: prazo || null };
    const { error } = editing
      ? await db.from("cli_tarefas").update(dados).eq("id", editing.id).eq("user_id", editing.user_id)
      : await db.from("cli_tarefas").insert({ ...dados, user_id: userId, status: "pendente", criado_por: eduId });
    setSalvando(false);
    if (error) return toast.error("Não foi possível salvar a tarefa.");
    toast.success(editing ? "Tarefa atualizada." : "Tarefa criada.");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={salvar} className="space-y-4">
          <Field label="Para quem" hint={editing ? "O responsável não muda depois de criada." : undefined}>
            <select className={selectCls} value={destino} onChange={(e) => setDestino(e.target.value)} disabled={!!editing} name="destino">
              <option value={PARA_MIM}>Para mim</option>
              {clientes.map((c) => (
                <option key={c.cliente_user_id} value={c.cliente_user_id}>{c.nome}</option>
              ))}
            </select>
          </Field>
          <Field label="Título">
            <input className={inputCls} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Enviar extrato do cartão" name="titulo" autoFocus />
          </Field>
          <Field label="Descrição (opcional)">
            <textarea
              className="min-h-[90px] w-full rounded-2xl border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/60"
              value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes, combinados, links…" name="descricao"
            />
          </Field>
          <Field label="Prazo (opcional)">
            <input type="date" className={inputCls} value={prazo} onChange={(e) => setPrazo(e.target.value)} name="prazo" />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Pill variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Pill>
            <Pill variant="solid" type="submit" disabled={salvando}>{salvando ? "Salvando…" : "Salvar"}</Pill>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
