/* Limites por categoria: teto de gasto mensal por categoria (vale para todos os meses). */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Target } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  db, brl, useMes, useUserId, useCadastros, MonthPicker, PageHeader, Panel, EmptyState, Pill, Field, inputCls, parseValor,
  labelAnoMes, type Categoria,
} from "./_shared";
import { CatIcon } from "./_icons";
import { useLancamentos, doMes, gastoCategoria, pct, type Limite } from "./_extrato-utils";

/** Cor da barra conforme o uso: azul até 80%, dourado até 100%, vermelho acima. */
const corUso = (p: number) => (p > 100 ? "bg-destructive" : p >= 80 ? "bg-gold" : "bg-primary");
const corTexto = (p: number) => (p > 100 ? "text-destructive" : p >= 80 ? "text-warning" : "text-primary");

export default function Limites() {
  const userId = useUserId();
  const { mes } = useMes();
  const { categorias } = useCadastros(userId);
  const { lancs } = useLancamentos(userId);
  const [limites, setLimites] = useState<Limite[]>([]);
  const [editCat, setEditCat] = useState<Categoria | null>(null);
  const [valor, setValor] = useState("");
  const [remover, setRemover] = useState<Categoria | null>(null);
  const [saving, setSaving] = useState(false);

  const carregar = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await db.from("cli_limites").select("*").eq("user_id", userId);
    if (error) toast.error("Não foi possível carregar os limites.");
    setLimites((data ?? []).map((l: Limite) => ({ ...l, valor: Number(l.valor) })));
  }, [userId]);
  useEffect(() => { carregar(); }, [carregar]);

  const limPorCat = useMemo(() => new Map(limites.map((l) => [l.categoria_id, l])), [limites]);
  const despesasMes = useMemo(() => doMes(lancs, mes).filter((l) => l.tipo === "despesa"), [lancs, mes]);
  const catsDesp = categorias.filter((c) => c.tipo === "despesa");
  const raizes = catsDesp.filter((c) => !c.parent_id);
  const gasto = (c: Categoria) => gastoCategoria(c, despesasMes, catsDesp);

  // resumo: soma dos limites das categorias mãe + subcategorias cuja mãe não tem limite
  const resumo = useMemo(() => {
    let lim = 0, g = 0;
    for (const c of catsDesp) {
      const l = limPorCat.get(c.id);
      if (!l) continue;
      if (c.parent_id && limPorCat.has(c.parent_id)) continue; // já contado no teto da mãe
      lim += l.valor; g += gastoCategoria(c, despesasMes, catsDesp);
    }
    return { lim, g, p: lim > 0 ? (g / lim) * 100 : 0 };
  }, [catsDesp, limPorCat, despesasMes]);

  const abrir = (c: Categoria) => {
    setEditCat(c);
    const l = limPorCat.get(c.id);
    setValor(l ? String(l.valor).replace(".", ",") : "");
  };

  const salvar = async () => {
    if (!editCat || !userId) return;
    const v = parseValor(valor);
    if (v <= 0) return toast.error("Informe um valor maior que zero.");
    setSaving(true);
    // upsert manual: atualiza se já existe, senão insere
    const existente = limPorCat.get(editCat.id);
    const res = existente
      ? await db.from("cli_limites").update({ valor: v }).eq("id", existente.id)
      : await db.from("cli_limites").insert({ user_id: userId, categoria_id: editCat.id, valor: v });
    setSaving(false);
    if (res.error) return toast.error("Não foi possível salvar: " + res.error.message);
    toast.success(`Limite de ${editCat.nome} salvo`);
    setEditCat(null);
    carregar();
  };

  const confirmarRemocao = async () => {
    if (!remover) return;
    const l = limPorCat.get(remover.id);
    setRemover(null);
    if (!l) return;
    const { error } = await db.from("cli_limites").delete().eq("id", l.id);
    if (error) return toast.error("Não foi possível remover.");
    toast.success("Limite removido");
    carregar();
  };

  // soma dos limites das subcategorias de uma mãe (aviso se passar do teto)
  const somaSubs = (c: Categoria) => catsDesp.filter((s) => s.parent_id === c.id).reduce((s, x) => s + (limPorCat.get(x.id)?.valor ?? 0), 0);

  const linha = (c: Categoria, sub = false) => {
    const l = limPorCat.get(c.id);
    const g = gasto(c);
    const p = l && l.valor > 0 ? (g / l.valor) * 100 : 0;
    const resta = l ? l.valor - g : 0;
    return (
      <div key={c.id} className={sub ? "border-t border-border py-3 pl-6 sm:pl-9" : ""}>
        <div className="flex items-center gap-3">
          <span className={`grid shrink-0 place-items-center rounded-full ${sub ? "h-7 w-7 bg-secondary" : "h-9 w-9 bg-gold-soft"} text-primary`}>
            <CatIcon name={c.icone} className={sub ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </span>
          <span className={`min-w-0 flex-1 truncate ${sub ? "text-sm" : "text-[15px] font-medium"} text-foreground`}>{c.nome}</span>
          {l ? (
            <div className="flex shrink-0 items-center">
              <button type="button" onClick={() => abrir(c)} aria-label={`Editar limite de ${c.nome}`} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"><Pencil className="h-4 w-4" /></button>
              <button type="button" onClick={() => setRemover(c)} aria-label={`Remover limite de ${c.nome}`} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          ) : (
            <Pill className="h-8 shrink-0 px-3 text-xs" onClick={() => abrir(c)}>Definir limite</Pill>
          )}
        </div>
        {l ? (
          <div className={sub ? "mt-2 pl-10" : "mt-3 pl-12"}>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div className={`h-full rounded-full transition-all ${corUso(p)}`} style={{ width: `${Math.min(100, p)}%` }} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-xs">
              <span className="text-muted-foreground"><span className="font-semibold tabular-nums text-foreground">{brl(g)}</span> de {brl(l.valor)} <span className={`font-semibold ${corTexto(p)}`}>({pct(p)})</span></span>
              <span className={resta < 0 ? "font-semibold text-destructive" : "text-muted-foreground"}>
                {resta >= 0 ? `Restam ${brl(resta)}` : `Passou ${brl(-resta)}`}
              </span>
            </div>
          </div>
        ) : g > 0 ? (
          <p className={`mt-1 text-xs text-muted-foreground ${sub ? "pl-10" : "pl-12"}`}>Gasto no mês: {brl(g)}</p>
        ) : null}
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="Limites por Categoria"
        desc="Defina um teto de gasto por categoria e acompanhe quanto já foi usado no mês. O limite da categoria mãe funciona como teto total; as subcategorias dividem esse teto entre si."
        right={<MonthPicker />}
      />

      {resumo.lim > 0 && (
        <Panel className="mb-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Target className="h-3.5 w-3.5 text-gold" /> Total com limite em {labelAnoMes(mes)}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-primary">{brl(resumo.g)} <span className="text-base font-normal text-muted-foreground">de {brl(resumo.lim)}</span></p>
            </div>
            <p className={`text-sm font-semibold ${corTexto(resumo.p)}`}>
              {resumo.lim - resumo.g >= 0 ? `Ainda cabem ${brl(resumo.lim - resumo.g)}` : `${brl(resumo.g - resumo.lim)} acima do planejado`}
            </p>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary">
            <div className={`h-full rounded-full ${corUso(resumo.p)}`} style={{ width: `${Math.min(100, resumo.p)}%` }} />
          </div>
        </Panel>
      )}

      {raizes.length === 0 ? (
        <EmptyState title="Nenhuma categoria de despesa" desc="Cadastre categorias em Configurações para definir limites." />
      ) : (
        <div className="space-y-3">
          {raizes.map((c) => {
            const subs = catsDesp.filter((s) => s.parent_id === c.id);
            const lim = limPorCat.get(c.id);
            const excede = lim && somaSubs(c) > lim.valor;
            return (
              <div key={c.id} className="rounded-2xl border border-border bg-card px-4 pt-4 pb-4 shadow-[0_1px_3px_hsl(222_47%_14%/0.06)] sm:px-5">
                {linha(c)}
                {subs.length > 0 && <div className="mt-3 -mb-3">{subs.map((s) => linha(s, true))}</div>}
                {excede && <p className="mt-4 pl-12 text-xs text-warning">A soma dos limites das subcategorias passa do teto de {c.nome}.</p>}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!editCat} onOpenChange={(v) => !v && setEditCat(null)}>
        <DialogContent className="rounded-3xl border-border bg-card sm:max-w-[400px]">
          <DialogHeader><DialogTitle className="font-display text-xl">Limite de {editCat?.nome}</DialogTitle></DialogHeader>
          <Field label="Teto mensal (R$)" hint="Vale para todos os meses. Inclui as subcategorias.">
            <input className={inputCls} inputMode="decimal" autoFocus value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00"
              onKeyDown={(e) => e.key === "Enter" && salvar()} />
          </Field>
          <div className="mt-2 flex justify-end gap-2">
            <Pill onClick={() => setEditCat(null)}>Cancelar</Pill>
            <Pill variant="solid" onClick={salvar} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Pill>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!remover} onOpenChange={(v) => !v && setRemover(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Remover limite de {remover?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>Os lançamentos não são afetados; só deixa de existir o teto para essa categoria.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmarRemocao}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
