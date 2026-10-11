/* Despesas não recorrentes (anuais/esporádicas) e entradas sazonais. */
import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, PiggyBank, Gift } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  db, brl, compact, useUserId, useCadastros, PageHeader, Panel, EmptyState, Pill, Field,
  inputCls, selectCls, parseValor, MESES, MESES_CURTOS,
} from "./_shared";
import { CatIcon } from "./_icons";

type DespesaNR = { id: string; descricao: string; valor: number; mes: number; categoria_id: string | null };
type Sazonal = { id: string; descricao: string; valor: number; mes: number };
type Item = { id?: string; descricao: string; valor: number; mes: number; categoria_id?: string | null };

export default function NaoRecorrentes() {
  const userId = useUserId();
  const { categorias, catById } = useCadastros(userId);
  const [despesas, setDespesas] = useState<DespesaNR[]>([]);
  const [sazonais, setSazonais] = useState<Sazonal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dlg, setDlg] = useState<{ kind: "despesa" | "sazonal"; item: Item | null } | null>(null);
  const [del, setDel] = useState<{ kind: "despesa" | "sazonal"; id: string; nome: string } | null>(null);
  const mesAtual = new Date().getMonth() + 1;

  const load = useCallback(async () => {
    if (!userId) return;
    const [a, b] = await Promise.all([
      db.from("cli_despesas_nr").select("*").eq("user_id", userId).order("mes"),
      db.from("cli_entradas_sazonais").select("*").eq("user_id", userId).order("mes"),
    ]);
    setDespesas(a.data ?? []);
    setSazonais(b.data ?? []);
    setLoading(false);
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  const total = despesas.reduce((s, d) => s + Number(d.valor), 0);
  const porMes = Array.from({ length: 12 }, (_, i) => despesas.filter((d) => d.mes === i + 1).reduce((s, d) => s + Number(d.valor), 0));
  const maxMes = Math.max(...porMes, 1);
  const totalSaz = sazonais.reduce((s, d) => s + Number(d.valor), 0);

  const excluir = async () => {
    if (!del) return;
    const t = del.kind === "despesa" ? "cli_despesas_nr" : "cli_entradas_sazonais";
    const { error } = await db.from(t).delete().eq("id", del.id);
    if (error) toast.error("Não foi possível excluir.");
    else toast.success("Excluído.");
    setDel(null); load();
  };

  return (
    <div>
      <PageHeader
        title="Despesas não recorrentes"
        desc="Despesas anuais e esporádicas (IPVA, seguro, dentista, matrícula, presentes) que estouram o orçamento se não forem provisionadas ao longo do ano."
        right={<Pill variant="solid" onClick={() => setDlg({ kind: "despesa", item: null })}><Plus className="h-4 w-4" /> Nova despesa</Pill>}
      />

      {loading ? null : despesas.length === 0 ? (
        <EmptyState title="Nenhuma despesa mapeada" desc="Nenhuma despesa não recorrente foi mapeada ainda."
          action={<Pill variant="solid" onClick={() => setDlg({ kind: "despesa", item: null })}><Plus className="h-4 w-4" /> Mapear despesa</Pill>} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Panel className="text-center">
              <p className="text-xs text-muted-foreground">Total no ano</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{brl(total)}</p>
            </Panel>
            <Panel className="border-gold/40 bg-gold-soft text-center">
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><PiggyBank className="h-3.5 w-3.5 text-gold" /> Para não ser pego de surpresa</p>
              <p className="mt-1 text-xl font-semibold text-foreground">guarde <span className="tabular-nums">{brl(total / 12)}</span> por mês</p>
            </Panel>
          </div>

          {/* Visão por mês: quanto cai em cada mês do ano */}
          <Panel className="mt-3">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Quando cada despesa cai</p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
              {porMes.map((v, i) => {
                const atual = i + 1 === mesAtual;
                return (
                  <div key={i} className={`flex flex-col items-center rounded-xl border px-1 py-2 ${atual ? "border-gold bg-gold-soft" : "border-border"}`}>
                    <span className={`text-[11px] ${atual ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{MESES_CURTOS[i]}</span>
                    <div className="my-1.5 flex h-10 w-2.5 items-end overflow-hidden rounded-full bg-secondary">
                      <div className="w-full rounded-full bg-primary" style={{ height: `${(v / maxMes) * 100}%` }} />
                    </div>
                    <span className={`text-[11px] tabular-nums ${v ? "font-medium text-foreground" : "text-muted-foreground/60"}`}>{v ? compact(v) : "–"}</span>
                  </div>
                );
              })}
            </div>
          </Panel>

          <div className="mt-3 space-y-2">
            {despesas.map((d) => {
              const cat = d.categoria_id ? catById.get(d.categoria_id) : null;
              return (
                <Panel key={d.id} className="!p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-primary"><CatIcon name={cat?.icone} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{d.descricao}</p>
                      <p className="text-xs text-muted-foreground">{MESES[d.mes - 1]}{cat ? ` · ${cat.nome}` : ""}</p>
                    </div>
                    <span className="font-semibold tabular-nums text-foreground">{brl(d.valor)}</span>
                    <Acoes onEdit={() => setDlg({ kind: "despesa", item: d })} onDel={() => setDel({ kind: "despesa", id: d.id, nome: d.descricao })} />
                  </div>
                </Panel>
              );
            })}
          </div>
        </>
      )}

      {/* Entradas sazonais */}
      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-3xl">
          <h2 className="text-[15px] font-semibold text-foreground">Entradas sazonais</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">13º, férias, PLR e restituição do Imposto de Renda: o dinheiro que entra fora do mês a mês. Elas ficam à parte e não mudam o total nem o quanto guardar por mês das despesas.</p>
        </div>
        <Pill onClick={() => setDlg({ kind: "sazonal", item: null })}><Plus className="h-4 w-4" /> Nova entrada</Pill>
      </div>
      <div className="mt-3 space-y-2">
        {sazonais.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">Nenhuma entrada sazonal cadastrada ainda.</div>
        ) : (
          <>
            {sazonais.map((s) => (
              <Panel key={s.id} className="!p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-success/10 text-success"><Gift className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{s.descricao}</p>
                    <p className="text-xs text-muted-foreground">{MESES[s.mes - 1]}</p>
                  </div>
                  <span className="font-semibold tabular-nums text-success">{brl(s.valor)}</span>
                  <Acoes onEdit={() => setDlg({ kind: "sazonal", item: s })} onDel={() => setDel({ kind: "sazonal", id: s.id, nome: s.descricao })} />
                </div>
              </Panel>
            ))}
            <p className="px-1 text-xs text-muted-foreground">Total de entradas sazonais no ano: <b className="tabular-nums text-foreground">{brl(totalSaz)}</b></p>
          </>
        )}
      </div>

      {userId && dlg && (
        <ItemDialog
          kind={dlg.kind} item={dlg.item} userId={userId} onClose={() => setDlg(null)} onSaved={load}
          categorias={categorias.filter((c) => c.tipo === "despesa")}
        />
      )}

      <AlertDialog open={!!del} onOpenChange={(v) => !v && setDel(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{del?.nome}”?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
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

function Acoes({ onEdit, onDel }: { onEdit: () => void; onDel: () => void }) {
  return (
    <div className="flex shrink-0">
      <button type="button" onClick={onEdit} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Editar"><Pencil className="h-4 w-4" /></button>
      <button type="button" onClick={onDel} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive" aria-label="Excluir"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

function ItemDialog({
  kind, item, userId, categorias, onClose, onSaved,
}: {
  kind: "despesa" | "sazonal"; item: Item | null; userId: string;
  categorias: { id: string; nome: string; parent_id: string | null }[]; onClose: () => void; onSaved: () => void;
}) {
  const [descricao, setDescricao] = useState(item?.descricao ?? "");
  const [valor, setValor] = useState(item ? String(item.valor).replace(".", ",") : "");
  const [mes, setMes] = useState(item?.mes ?? new Date().getMonth() + 1);
  const [cat, setCat] = useState(item?.categoria_id ?? "");
  const [saving, setSaving] = useState(false);
  const despesa = kind === "despesa";

  const salvar = async () => {
    const v = parseValor(valor);
    if (!descricao.trim()) return toast.error("Informe uma descrição.");
    if (v <= 0) return toast.error("Informe um valor maior que zero.");
    setSaving(true);
    const t = despesa ? "cli_despesas_nr" : "cli_entradas_sazonais";
    const row: Record<string, unknown> = { descricao: descricao.trim(), valor: v, mes };
    if (despesa) row.categoria_id = cat || null;
    const { error } = item?.id
      ? await db.from(t).update(row).eq("id", item.id)
      : await db.from(t).insert({ ...row, user_id: userId });
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar.");
    toast.success("Salvo.");
    onClose(); onSaved();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item ? "Editar" : "Nova"} {despesa ? "despesa não recorrente" : "entrada sazonal"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Descrição"><input className={inputCls} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder={despesa ? "Ex.: IPVA" : "Ex.: 13º salário"} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor (R$)"><input className={inputCls} inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" /></Field>
            <Field label={despesa ? "Mês previsto" : "Mês em que entra"}>
              <select className={selectCls} value={mes} onChange={(e) => setMes(Number(e.target.value))}>
                {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </Field>
          </div>
          {despesa && (
            <Field label="Categoria">
              <select className={selectCls} value={cat} onChange={(e) => setCat(e.target.value)}>
                <option value="">Sem categoria</option>
                {categorias.filter((c) => !c.parent_id).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Field>
          )}
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Pill onClick={onClose}>Cancelar</Pill>
          <Pill variant="solid" onClick={salvar} disabled={saving}>Salvar</Pill>
        </div>
      </DialogContent>
    </Dialog>
  );
}
