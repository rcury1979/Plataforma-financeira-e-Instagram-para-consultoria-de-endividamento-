/* Configurações da educadora → aba "Categorias padrão" (edu_categorias_padrao). */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Sparkles, Tags, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { db, EmptyState, Field, inputCls, Pill } from "../cliente/_shared";
import { CatIcon, CAT_ICONS, CATEGORIAS_PADRAO } from "../cliente/_icons";

type CatPadrao = { id: string; nome: string; tipo: "despesa" | "receita"; icone: string | null; ordem: number };

export function CategoriasPadrao({ eduId }: { eduId: string }) {
  const [cats, setCats] = useState<CatPadrao[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState<"despesa" | "receita">("despesa");
  const [form, setForm] = useState<{ open: boolean; cat: CatPadrao | null }>({ open: false, cat: null });
  const [nome, setNome] = useState("");
  const [icone, setIcone] = useState("outros");
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<CatPadrao | null>(null);

  const load = useCallback(async () => {
    const { data } = await db.from("edu_categorias_padrao").select("*").eq("user_id", eduId).order("ordem");
    setCats(data ?? []);
    setLoading(false);
  }, [eduId]);
  useEffect(() => { load(); }, [load]);

  const lista = cats.filter((c) => c.tipo === tipo);

  const abrir = (cat: CatPadrao | null) => {
    setNome(cat?.nome ?? "");
    setIcone(cat?.icone ?? "outros");
    setForm({ open: true, cat });
  };

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return toast.error("Informe o nome da categoria.");
    if (cats.some((c) => c.tipo === tipo && c.id !== form.cat?.id && c.nome.trim().toLowerCase() === nome.trim().toLowerCase()))
      return toast.error("Já existe uma categoria com esse nome.");
    setSaving(true);
    const { error } = form.cat
      ? await db.from("edu_categorias_padrao").update({ nome: nome.trim(), icone }).eq("id", form.cat.id).eq("user_id", eduId)
      : await db.from("edu_categorias_padrao").insert({
          user_id: eduId, nome: nome.trim(), icone, tipo, ordem: Math.max(0, ...cats.map((c) => c.ordem ?? 0)) + 1,
        });
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar a categoria.");
    toast.success("Categoria salva.");
    setForm({ open: false, cat: null });
    load();
  }

  async function excluir() {
    if (!del) return;
    const { error } = await db.from("edu_categorias_padrao").delete().eq("id", del.id).eq("user_id", eduId);
    setDel(null);
    if (error) return toast.error("Não foi possível excluir.");
    toast.success("Categoria excluída.");
    load();
  }

  async function comecarPadrao() {
    if (cats.length) return;
    const linhas = CATEGORIAS_PADRAO.map((c, i) => ({ user_id: eduId, nome: c.nome, tipo: c.tipo, icone: c.icone, ordem: i + 1 }));
    const { error } = await db.from("edu_categorias_padrao").insert(linhas);
    if (error) return toast.error("Não foi possível criar as categorias.");
    toast.success("Pronto! Categorias padrão R&M adicionadas.");
    load();
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_hsl(222_47%_14%/0.06)] sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground"><Tags className="h-4 w-4 text-gold" /> Categorias padrão</h2>
          <p className="mt-1 text-sm text-muted-foreground">Clientes novos começam com estas categorias.</p>
        </div>
        <Pill variant="solid" onClick={() => abrir(null)}><Plus className="h-4 w-4" /> Adicionar</Pill>
      </div>

      <div className="mb-4 grid grid-cols-2 rounded-full border border-border bg-secondary p-1 text-sm">
        {(["despesa", "receita"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTipo(t)}
            className={`rounded-full py-1.5 transition ${tipo === t ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "despesa" ? "Despesas" : "Receitas"} <span className="text-xs text-muted-foreground">({cats.filter((c) => c.tipo === t).length})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : cats.length === 0 ? (
        <EmptyState
          title="Você ainda não definiu categorias padrão"
          desc="Comece com a lista do Método GCPM e ajuste do seu jeito, ou crie as suas do zero."
          action={<Pill variant="solid" onClick={comecarPadrao}><Sparkles className="h-4 w-4" /> Começar com o padrão R&amp;M</Pill>}
        />
      ) : lista.length === 0 ? (
        <EmptyState title={`Nenhuma categoria de ${tipo}`} desc="Adicione uma categoria para este tipo." />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((c) => (
            <div key={c.id} className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-soft text-primary"><CatIcon name={c.icone} /></span>
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{c.nome}</span>
              <button type="button" onClick={() => abrir(c)} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={`Editar ${c.nome}`}><Pencil className="h-4 w-4" /></button>
              <button type="button" onClick={() => setDel(c)} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Excluir ${c.nome}`}><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={form.open} onOpenChange={(v) => setForm((f) => ({ ...f, open: v }))}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{form.cat ? "Editar categoria" : `Nova categoria de ${tipo}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-4">
            <Field label="Nome"><input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Farmácia" name="nome-categoria" autoFocus /></Field>
            <div>
              <span className="text-[13px] text-muted-foreground">Ícone</span>
              <div className="mt-1.5 grid grid-cols-8 gap-1.5">
                {Object.keys(CAT_ICONS).map((k) => (
                  <button key={k} type="button" onClick={() => setIcone(k)} aria-label={k} title={k}
                    className={`grid aspect-square place-items-center rounded-xl border transition ${icone === k ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                    <CatIcon name={k} />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Pill variant="ghost" onClick={() => setForm({ open: false, cat: null })}>Cancelar</Pill>
              <Pill variant="solid" type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Pill>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!del} onOpenChange={(v) => !v && setDel(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{del?.nome}”?</AlertDialogTitle>
            <AlertDialogDescription>Ela deixa de ser criada para clientes novos. Clientes que já têm essa categoria não são afetados.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={excluir}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
