/* Planejamento de futuro: premissas, projeção do patrimônio e objetivos (pilar "Multiplicar" do Método GCPM). */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle, CheckCircle2, Home, Link2, Pencil, Plus, Sprout, Target, Trash2, Unlink,
} from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import {
  anoMesOf, brl, db, EmptyState, Field, inputCls, PageHeader, Panel, Pill, parseValor, selectCls, snapshotVigente, useUserId,
} from "./_shared";
import { calcular, type Saida } from "./_objetivos-calc";

type Prioridade = "essencial" | "sonho" | "desejo";
type Objetivo = { id: string; titulo: string; prioridade: Prioridade; valor: number; idade_alvo: number | null; ativo_venda_id: string | null; concluido: boolean };
type Bem = { id: string; nome: string; tipo: string; liquido: boolean; vendido: boolean; valor: number };
type Snap = { item_id: string; item_tipo: string; ano_mes: string; valor: number };

const COR = { azul: "hsl(221 62% 24%)", dourado: "hsl(41 72% 47%)", verde: "hsl(152 55% 33%)", vermelho: "hsl(0 68% 48%)", grade: "hsl(220 20% 89%)" };
const PRIOR: Record<Prioridade, { label: string; cor: string; dot: string }> = {
  essencial: { label: "Essencial", cor: COR.verde, dot: "bg-success" },
  sonho: { label: "Sonho", cor: COR.azul, dot: "bg-primary" },
  desejo: { label: "Desejo", cor: COR.dourado, dot: "bg-gold" },
};
const TIPO_BEM: Record<string, string> = { imovel: "Imóvel", veiculo: "Veículo", investimento: "Investimento", conta: "Conta", outro: "Outro bem" };

/** Valores compactos para o eixo: 1,2 mi · 350k */
const eixo = (v: number) => {
  const a = Math.abs(v);
  if (a >= 1e6) return `R$ ${(v / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (a >= 1e3) return `R$ ${Math.round(v / 1e3)}k`;
  return `R$ ${Math.round(v)}`;
};

/** Premissas como texto (campos de formulário). */
type Form = { idade: string; aposentar: string; renda: string; aporte: string; taxa: string; inflacao: string; viver: string; usar: boolean };
const num = (v: unknown) => (v === null || v === undefined ? "" : String(v).replace(".", ","));

export default function Objetivos() {
  const userId = useUserId();
  const [form, setForm] = useState<Form>({ idade: "", aposentar: "65", renda: "", aporte: "", taxa: "8", inflacao: "4", viver: "90", usar: true });
  const [planId, setPlanId] = useState<string | null>(null);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [bens, setBens] = useState<Bem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"" | "salvando" | "salvo">("");
  const [dlg, setDlg] = useState<{ open: boolean; editing: Objetivo | null }>({ open: false, editing: null });
  const [excluindo, setExcluindo] = useState<Objetivo | null>(null);
  const [vincular, setVincular] = useState<Bem | null>(null);
  const dirty = useRef(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const [pl, ob, pa, sn] = await Promise.all([
      db.from("cli_planejamento").select("*").eq("user_id", userId).maybeSingle(),
      db.from("cli_objetivos").select("*").eq("user_id", userId).order("idade_alvo"),
      db.from("cli_patrimonio").select("*").eq("user_id", userId),
      db.from("cli_snapshots").select("*").eq("user_id", userId).eq("item_tipo", "patrimonio"),
    ]);
    const p = pl.data;
    if (p && !dirty.current) {
      setPlanId(p.id);
      setForm({
        idade: num(p.idade_atual), aposentar: num(p.aposentar_aos ?? 65), renda: num(p.renda_mes), aporte: num(p.aporte_mes),
        taxa: num(p.taxa_aa ?? 8), inflacao: num(p.inflacao ?? 4), viver: num(p.viver_ate ?? 90), usar: p.usar_patrimonio ?? true,
      });
    }
    setObjetivos(ob.data ?? []);
    const mes = anoMesOf(new Date());
    const snaps: Snap[] = sn.data ?? [];
    setBens((pa.data ?? []).map((b: Omit<Bem, "valor">) => ({
      ...b, valor: Number(snapshotVigente(snaps.filter((s) => s.item_id === b.id), mes)?.valor ?? 0),
    })));
    setLoading(false);
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  /* ---- salvar premissas com debounce ---- */
  const salvar = useCallback(async (f: Form) => {
    if (!userId) return;
    setStatus("salvando");
    const intOu = (s: string, d: number | null) => (s.trim() ? Math.round(parseValor(s)) : d);
    const row = {
      idade_atual: intOu(f.idade, null), aposentar_aos: intOu(f.aposentar, 65), renda_mes: f.renda.trim() ? parseValor(f.renda) : null,
      aporte_mes: f.aporte.trim() ? parseValor(f.aporte) : null, taxa_aa: f.taxa.trim() ? parseValor(f.taxa) : 8,
      inflacao: f.inflacao.trim() ? parseValor(f.inflacao) : 4, viver_ate: intOu(f.viver, 90), usar_patrimonio: f.usar,
    };
    const res = planId
      ? await db.from("cli_planejamento").update(row).eq("id", planId).eq("user_id", userId)
      : await db.from("cli_planejamento").insert({ ...row, user_id: userId }).select().single();
    if (res.error) { setStatus(""); toast.error("Não foi possível salvar as premissas."); return; }
    if (!planId && res.data?.id) setPlanId(res.data.id);
    setStatus("salvo");
  }, [userId, planId]);

  useEffect(() => {
    if (!dirty.current) return;
    const t = setTimeout(() => salvar(form), 800);
    return () => clearTimeout(t);
  }, [form, salvar]);

  const set = (k: keyof Form) => (v: string | boolean) => { dirty.current = true; setStatus(""); setForm((f) => ({ ...f, [k]: v })); };

  /* ---- cálculo ---- */
  const bemById = useMemo(() => new Map(bens.map((b) => [b.id, b])), [bens]);
  const investido = useMemo(
    () => bens.filter((b) => !b.vendido && (b.liquido || b.tipo === "investimento" || b.tipo === "conta")).reduce((a, b) => a + b.valor, 0),
    [bens],
  );
  const abate = (o: Objetivo) => (o.ativo_venda_id ? bemById.get(o.ativo_venda_id)?.valor ?? 0 : 0);
  const custo = (o: Objetivo) => Math.max(0, Number(o.valor || 0) - abate(o));

  const prem = useMemo(() => {
    const idade = Math.max(0, Math.round(parseValor(form.idade))) || 30;
    const aposentar = Math.max(idade, Math.round(parseValor(form.aposentar)) || 65);
    const viverAte = Math.max(aposentar + 1, Math.round(parseValor(form.viver)) || 90);
    return {
      idade, aposentar, viverAte,
      renda: parseValor(form.renda), aporte: parseValor(form.aporte),
      taxa: form.taxa.trim() ? parseValor(form.taxa) : 8, inflacao: form.inflacao.trim() ? parseValor(form.inflacao) : 4,
      inicial: form.usar ? investido : 0,
    };
  }, [form, investido]);

  const ativos = objetivos.filter((o) => !o.concluido);
  const saidas: Saida[] = ativos.filter((o) => o.idade_alvo != null && o.idade_alvo >= prem.idade).map((o) => ({ idade: o.idade_alvo!, valor: custo(o) }));
  const res = useMemo(() => calcular(prem, saidas), [prem, JSON.stringify(saidas)]); // eslint-disable-line react-hooks/exhaustive-deps

  const bensVenda = bens.filter((b) => !b.vendido && !b.liquido && b.tipo !== "investimento" && b.tipo !== "conta" && !objetivos.some((o) => o.ativo_venda_id === b.id));

  async function excluir() {
    if (!excluindo) return;
    const { error } = await db.from("cli_objetivos").delete().eq("id", excluindo.id).eq("user_id", userId);
    setExcluindo(null);
    if (error) return toast.error("Não foi possível excluir.");
    toast.success("Objetivo excluído.");
    load();
  }
  async function desvincular(o: Objetivo) {
    const { error } = await db.from("cli_objetivos").update({ ativo_venda_id: null }).eq("id", o.id).eq("user_id", userId);
    if (error) return toast.error("Não foi possível desvincular.");
    toast.success("Venda desvinculada do objetivo.");
    load();
  }

  const pontoNa = (idade: number) => res.pontos.find((p) => p.idade === idade)?.atual ?? 0;

  return (
    <div>
      <PageHeader
        title="Planejamento de futuro"
        desc="Simule seu futuro: ajuste as premissas e veja como seus sonhos afetam a curva de patrimônio."
        right={
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {status === "salvando" ? "Salvando…" : status === "salvo" ? "Premissas salvas" : ""}
          </span>
        }
      />

      {/* Faixa do Método GCPM */}
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold-soft px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold font-display text-lg text-primary">M</span>
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-foreground">Método GCPM · Multiplicar</p>
          <p className="text-muted-foreground">
            Depois de Gerar, Cuidar e Proteger, chega a hora de fazer o dinheiro trabalhar por você. Aqui você enxerga, com calma,
            quanto guardar por mês para realizar seus sonhos e ter uma aposentadoria tranquila.
          </p>
        </div>
      </div>

      {/* Premissas */}
      <Panel className="mb-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 lg:grid-cols-4">
          <Field label="Idade atual"><input className={inputCls} inputMode="numeric" value={form.idade} onChange={(e) => set("idade")(e.target.value)} placeholder="Ex.: 35" /></Field>
          <Field label="Aposentar aos"><input className={inputCls} inputMode="numeric" value={form.aposentar} onChange={(e) => set("aposentar")(e.target.value)} placeholder="65" /></Field>
          <Field label="Renda/mês (R$)" hint="desejada, a valor de hoje"><input className={inputCls} inputMode="decimal" value={form.renda} onChange={(e) => set("renda")(e.target.value)} placeholder="0,00" /></Field>
          <Field label="Aporte/mês (R$)"><input className={inputCls} inputMode="decimal" value={form.aporte} onChange={(e) => set("aporte")(e.target.value)} placeholder="0,00" /></Field>
          <Field label="Taxa a.a. (%)"><input className={inputCls} inputMode="decimal" value={form.taxa} onChange={(e) => set("taxa")(e.target.value)} placeholder="8" /></Field>
          <Field label="Inflação (%)"><input className={inputCls} inputMode="decimal" value={form.inflacao} onChange={(e) => set("inflacao")(e.target.value)} placeholder="4" /></Field>
          <Field label="Viver até (idade)" hint="expectativa de vida"><input className={inputCls} inputMode="numeric" value={form.viver} onChange={(e) => set("viver")(e.target.value)} placeholder="90" /></Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <label className="flex items-center gap-3">
            <Switch checked={form.usar} onCheckedChange={(v) => set("usar")(v)} aria-label="Usar patrimônio atual" />
            <span className="text-sm leading-tight">
              <span className="block font-medium text-foreground">Usar patrimônio atual</span>
              <span className="text-xs text-muted-foreground">{brl(investido)} investido</span>
            </span>
          </label>
          <Pill onClick={() => { dirty.current = true; salvar(form); }} disabled={status === "salvando"}>Salvar</Pill>
        </div>
        {!form.idade.trim() && !loading && <p className="mt-3 text-xs text-warning">Preencha sua idade atual — enquanto isso, a simulação usa 30 anos.</p>}
      </Panel>

      {/* Resumo */}
      <p className="mb-2 text-sm text-muted-foreground">Patrimônio na aposentadoria (a valor de hoje)</p>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Resumo cor={COR.azul} label="Projeção atual" valor={res.patAtual} />
        <Resumo cor={COR.dourado} label="Consumir o patrimônio" valor={res.metaConsumir} />
        <Resumo cor={COR.verde} label="Viver de renda" valor={res.metaRenda} />
      </div>
      <p className="mb-2 text-sm text-muted-foreground">Quanto precisa aportar por mês</p>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Resumo cor={COR.azul} label="Aporte atual" valor={prem.aporte} />
        <Resumo cor={COR.dourado} label="Pra consumir o patrimônio" valor={res.aporteConsumir} />
        <Resumo cor={COR.verde} label="Pra viver de renda" valor={res.aporteRenda ?? Infinity} />
      </div>

      {/* Gráfico */}
      <Panel className="mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold text-foreground">Patrimônio ao longo da vida</h2>
          {prem.renda > 0 && res.acabaAos !== null ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" /> Acaba aos {res.acabaAos} anos
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Dura até os {prem.viverAte}+ anos
            </span>
          )}
        </div>
        <div className="h-[300px] sm:h-[360px]" data-testid="grafico-patrimonio">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={res.pontos} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={COR.grade} strokeDasharray="3 3" />
              <XAxis dataKey="idade" type="number" domain={[prem.idade, prem.viverAte]} allowDecimals={false} tickLine={false} fontSize={12} />
              <YAxis tickFormatter={eixo} width={72} tickLine={false} fontSize={12} />
              <Tooltip
                formatter={(v: number, n: string) => [brl(v), n]}
                labelFormatter={(l) => `${l} anos`}
                contentStyle={{ borderRadius: 12, fontSize: 12 }}
              />
              <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine x={prem.aposentar} stroke={COR.azul} strokeDasharray="4 4" label={{ value: "aposentadoria", position: "top", fontSize: 11, fill: COR.azul }} />
              <Line type="monotone" dataKey="renda" name="Viver de renda" stroke={COR.verde} strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="consumir" name="Consumir o patrimônio" stroke={COR.dourado} strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="atual" name="Projeção atual" stroke={COR.azul} strokeWidth={2.5} dot={false} isAnimationActive={false} />
              {ativos.filter((o) => o.idade_alvo != null && o.idade_alvo >= prem.idade && o.idade_alvo <= prem.viverAte).map((o) => (
                <ReferenceDot key={o.id} x={o.idade_alvo!} y={pontoNa(o.idade_alvo!)} r={6} fill={PRIOR[o.prioridade]?.cor ?? COR.azul} stroke="white" strokeWidth={2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Valores em poder de compra de hoje · rendimento real de {(res.rAno * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% ao ano. Os pontos marcam seus objetivos.
        </p>
      </Panel>

      {/* Objetivos */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {(Object.keys(PRIOR) as Prioridade[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${PRIOR[k].dot}`} /> {PRIOR[k].label}</span>
          ))}
        </div>
        <Pill variant="solid" onClick={() => setDlg({ open: true, editing: null })}><Plus className="h-4 w-4" /> Novo objetivo</Pill>
      </div>
      {objetivos.length === 0 ? (
        <div className="mb-6"><EmptyState title="Nenhum objetivo cadastrado ainda" desc="Crie objetivos pra eles entrarem na curva." /></div>
      ) : (
        <div className="mb-6 space-y-2">
          {objetivos.map((o) => {
            const bem = o.ativo_venda_id ? bemById.get(o.ativo_venda_id) : null;
            const pr = PRIOR[o.prioridade] ?? PRIOR.sonho;
            return (
              <div key={o.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${pr.dot}`} />
                <div className="min-w-0 flex-1">
                  <p className={`break-words font-medium ${o.concluido ? "text-muted-foreground line-through" : "text-foreground"}`}>{o.titulo}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {pr.label} · {o.idade_alvo != null ? `aos ${o.idade_alvo} anos` : "sem idade definida"}
                    {o.idade_alvo != null && o.idade_alvo < prem.idade && " (idade já passou — fora da curva)"}
                  </p>
                  {bem && (
                    <p className="mt-1 inline-flex flex-wrap items-center gap-1 text-xs text-success">
                      <Link2 className="h-3.5 w-3.5" /> Venda de {bem.nome} abate {brl(Math.min(bem.valor, Number(o.valor)))}
                      <button type="button" onClick={() => desvincular(o)} className="ml-1 inline-flex items-center gap-0.5 text-muted-foreground underline-offset-2 hover:underline">
                        <Unlink className="h-3 w-3" /> desvincular
                      </button>
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold tabular-nums text-foreground">{brl(o.valor)}</p>
                  {bem && <p className="text-xs tabular-nums text-muted-foreground">falta {brl(custo(o))}</p>}
                  <div className="mt-1 flex justify-end gap-0.5">
                    <button type="button" aria-label="Editar objetivo" onClick={() => setDlg({ open: true, editing: o })} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
                    <button type="button" aria-label="Excluir objetivo" onClick={() => setExcluindo(o)} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vender um bem */}
      <p className="mb-2 text-sm text-muted-foreground">Vender um bem e aportar</p>
      {bensVenda.length === 0 ? (
        <Panel><p className="text-sm text-muted-foreground">Nenhum bem disponível pra vender. Cadastre imóveis, veículos ou outros bens em Patrimônio. Bens já usados pra abater um objetivo não aparecem aqui.</p></Panel>
      ) : (
        <div className="space-y-2">
          {bensVenda.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-primary"><Home className="h-4 w-4" /></span>
              <div className="min-w-[150px] flex-1">
                <p className="break-words font-medium text-foreground">{b.nome}</p>
                <p className="text-xs text-muted-foreground">{TIPO_BEM[b.tipo] ?? "Bem"} · valor atual {brl(b.valor)}</p>
              </div>
              <Pill className="w-full sm:w-auto" onClick={() => setVincular(b)} disabled={ativos.length === 0} title={ativos.length === 0 ? "Crie um objetivo primeiro" : undefined}>
                <Target className="h-4 w-4" /> Usar num objetivo
              </Pill>
            </div>
          ))}
        </div>
      )}

      {userId && <ObjetivoDialog open={dlg.open} editing={dlg.editing} userId={userId} onOpenChange={(v) => setDlg((d) => ({ ...d, open: v }))} onSaved={load} />}
      {userId && <VincularDialog bem={vincular} objetivos={ativos} userId={userId} onClose={() => setVincular(null)} onSaved={load} />}

      <AlertDialog open={!!excluindo} onOpenChange={(v) => !v && setExcluindo(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir objetivo?</AlertDialogTitle>
            <AlertDialogDescription>"{excluindo?.titulo}" sai do seu planejamento. Isso não pode ser desfeito.</AlertDialogDescription>
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

function Resumo({ cor, label, valor }: { cor: string; label: string; valor: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full" style={{ background: cor }} /> {label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{Number.isFinite(valor) ? brl(valor) : "—"}</p>
    </div>
  );
}

function ObjetivoDialog({ open, editing, userId, onOpenChange, onSaved }: {
  open: boolean; editing: Objetivo | null; userId: string; onOpenChange: (v: boolean) => void; onSaved: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [valor, setValor] = useState("");
  const [idade, setIdade] = useState("");
  const [prioridade, setPrioridade] = useState<Prioridade>("sonho");
  const [concluido, setConcluido] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitulo(editing?.titulo ?? "");
    setValor(editing ? num(editing.valor) : "");
    setIdade(editing?.idade_alvo != null ? String(editing.idade_alvo) : "");
    setPrioridade(editing?.prioridade ?? "sonho");
    setConcluido(editing?.concluido ?? false);
  }, [open, editing]);

  async function salvar() {
    if (!titulo.trim()) return toast.error("Dê um nome ao objetivo.");
    if (parseValor(valor) <= 0) return toast.error("Informe quanto custa o objetivo.");
    setSaving(true);
    const row = { titulo: titulo.trim(), valor: parseValor(valor), idade_alvo: idade.trim() ? Math.round(parseValor(idade)) : null, prioridade, concluido };
    const { error } = editing
      ? await db.from("cli_objetivos").update(row).eq("id", editing.id).eq("user_id", userId)
      : await db.from("cli_objetivos").insert({ ...row, user_id: userId });
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar o objetivo.");
    toast.success(editing ? "Objetivo atualizado." : "Objetivo criado.");
    onOpenChange(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader><DialogTitle>{editing ? "Editar objetivo" : "Novo objetivo"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Objetivo"><input className={inputCls} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Viagem em família" autoFocus /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor (R$)" hint="a valor de hoje"><input className={inputCls} inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" /></Field>
            <Field label="Idade-alvo"><input className={inputCls} inputMode="numeric" value={idade} onChange={(e) => setIdade(e.target.value)} placeholder="Ex.: 45" /></Field>
          </div>
          <Field label="Prioridade">
            <select className={selectCls} value={prioridade} onChange={(e) => setPrioridade(e.target.value as Prioridade)}>
              <option value="essencial">Essencial</option>
              <option value="sonho">Sonho</option>
              <option value="desejo">Desejo</option>
            </select>
          </Field>
          {editing && <label className="flex items-center gap-2 text-sm"><Switch checked={concluido} onCheckedChange={setConcluido} /> Já realizei este objetivo <Sprout className="h-4 w-4 text-success" /></label>}
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Pill onClick={() => onOpenChange(false)}>Cancelar</Pill>
          <Pill variant="solid" onClick={salvar} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Pill>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VincularDialog({ bem, objetivos, userId, onClose, onSaved }: {
  bem: Bem | null; objetivos: Objetivo[]; userId: string; onClose: () => void; onSaved: () => void;
}) {
  const [objId, setObjId] = useState("");
  useEffect(() => { setObjId(objetivos.find((o) => !o.ativo_venda_id)?.id ?? objetivos[0]?.id ?? ""); }, [bem]); // eslint-disable-line react-hooks/exhaustive-deps

  async function vincular() {
    if (!bem || !objId) return;
    const { error } = await db.from("cli_objetivos").update({ ativo_venda_id: bem.id }).eq("id", objId).eq("user_id", userId);
    if (error) return toast.error("Não foi possível vincular.");
    toast.success(`A venda de ${bem.nome} vai abater o objetivo.`);
    onClose();
    onSaved();
  }

  return (
    <Dialog open={!!bem} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader><DialogTitle>Vender {bem?.nome} e aportar</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">
          O valor atual do bem ({brl(bem?.valor ?? 0)}) abate o custo do objetivo escolhido — como se você vendesse o bem na idade-alvo.
        </p>
        <Field label="Objetivo">
          <select className={selectCls} value={objId} onChange={(e) => setObjId(e.target.value)}>
            {objetivos.map((o) => <option key={o.id} value={o.id}>{o.titulo} · {brl(o.valor)}{o.ativo_venda_id ? " (troca o bem atual)" : ""}</option>)}
          </select>
        </Field>
        <div className="mt-2 flex justify-end gap-2">
          <Pill onClick={onClose}>Cancelar</Pill>
          <Pill variant="solid" onClick={vincular} disabled={!objId}>Vincular</Pill>
        </div>
      </DialogContent>
    </Dialog>
  );
}
