/* Análises: para onde vai o dinheiro, evolução de 6 meses, maiores gastos, comparativo e fixos x variáveis. */
import { useMemo, useState } from "react";
import { PieChart as PieIcon, BarChart3, Flame, ArrowUp, ArrowDown, Minus, Repeat, X } from "lucide-react";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import {
  brl, compact, useMes, useUserId, useCadastros, MonthPicker, PageHeader, Panel, PanelTitle, EmptyState, shiftAnoMes,
  labelAnoMesCurto, labelAnoMes, fmtDate, type Categoria, type Lancamento,
} from "./_shared";
import { CatIcon } from "./_icons";
import { useLancamentos, doMes, soma, raizDe, pct, ddmm } from "./_extrato-utils";

const COR = { azul: "hsl(221 62% 24%)", dourado: "hsl(41 72% 47%)", verde: "hsl(152 55% 33%)", vermelho: "hsl(0 68% 48%)", grade: "hsl(220 20% 89%)" };
const SEM_CAT = "__sem__";

type Grupo = { id: string; cat: Categoria | null; total: number };

/** Soma despesas por categoria raiz. */
function porRaiz(despesas: Lancamento[], catById: Map<string, Categoria>): Grupo[] {
  const m = new Map<string, Grupo>();
  for (const l of despesas) {
    const r = raizDe(l.categoria_id, catById);
    const id = r?.id ?? SEM_CAT;
    const g = m.get(id) ?? { id, cat: r, total: 0 };
    g.total += l.valor;
    m.set(id, g);
  }
  return [...m.values()].sort((a, b) => b.total - a.total);
}

export default function Analises() {
  const userId = useUserId();
  const { mes } = useMes();
  const { catById, contaById, cartaoById } = useCadastros(userId);
  const { lancs, loading } = useLancamentos(userId);
  const [catSel, setCatSel] = useState<string | null>(null);

  const despMes = useMemo(() => doMes(lancs, mes).filter((l) => l.tipo === "despesa"), [lancs, mes]);
  const despAnt = useMemo(() => doMes(lancs, shiftAnoMes(mes, -1)).filter((l) => l.tipo === "despesa"), [lancs, mes]);
  const totalMes = soma(despMes);
  const grupos = useMemo(() => porRaiz(despMes, catById), [despMes, catById]);
  const gruposAnt = useMemo(() => new Map(porRaiz(despAnt, catById).map((g) => [g.id, g.total])), [despAnt, catById]);

  const serie = useMemo(() => [5, 4, 3, 2, 1, 0].map((i) => {
    const am = shiftAnoMes(mes, -i);
    const xs = doMes(lancs, am);
    const receitas = soma(xs.filter((l) => l.tipo === "receita"));
    const despesas = soma(xs.filter((l) => l.tipo === "despesa"));
    return { mes: labelAnoMesCurto(am), receitas, despesas, balanco: receitas - despesas };
  }), [lancs, mes]);

  const top5 = [...despMes].sort((a, b) => b.valor - a.valor).slice(0, 5);
  const fixos = soma(despMes.filter((l) => l.recorrente));
  const variaveis = totalMes - fixos;

  const comparativo = useMemo(() => {
    const ids = new Set([...grupos.map((g) => g.id), ...gruposAnt.keys()]);
    return [...ids].map((id) => {
      const atual = grupos.find((g) => g.id === id)?.total ?? 0;
      const ant = gruposAnt.get(id) ?? 0;
      const cat = id === SEM_CAT ? null : catById.get(id) ?? null;
      return { id, cat, atual, ant, delta: atual - ant, p: ant > 0 ? ((atual - ant) / ant) * 100 : null };
    }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }, [grupos, gruposAnt, catById]);

  const lancsCat = catSel
    ? despMes.filter((l) => (raizDe(l.categoria_id, catById)?.id ?? SEM_CAT) === catSel).sort((a, b) => b.data.localeCompare(a.data))
    : [];
  const nomeGrupo = (g: { cat: Categoria | null }) => g.cat?.nome ?? "Sem categoria";
  const origem = (l: Lancamento) => (l.cartao_id ? cartaoById.get(l.cartao_id)?.nome : contaById.get(l.conta_id ?? "")?.nome) ?? "—";

  if (!loading && lancs.length === 0) {
    return (
      <div>
        <PageHeader title="Análises" right={<MonthPicker />} />
        <EmptyState title="Ainda não há lançamentos" desc="Assim que você registrar receitas e despesas, as análises aparecem aqui." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Análises" desc="Entenda para onde vai o seu dinheiro e como o mês se compara aos anteriores." right={<MonthPicker />} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[repeat(2,minmax(0,1fr))]">
        {/* 1. Despesas por categoria */}
        <Panel>
          <PanelTitle icon={PieIcon} right={<span className="text-sm font-semibold tabular-nums text-foreground">{brl(totalMes)}</span>}>
            Despesas por categoria
          </PanelTitle>
          {grupos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma despesa em {labelAnoMes(mes)}.</p>
          ) : (
            <>
              <ul className="space-y-1">
                {grupos.map((g) => {
                  const p = totalMes > 0 ? (g.total / totalMes) * 100 : 0;
                  const ativo = catSel === g.id;
                  return (
                    <li key={g.id}>
                      <button
                        type="button"
                        onClick={() => setCatSel(ativo ? null : g.id)}
                        className={`w-full rounded-xl px-2 py-2 text-left transition ${ativo ? "bg-gold-soft" : "hover:bg-secondary"}`}
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <CatIcon name={g.cat?.icone} className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate text-foreground">{nomeGrupo(g)}</span>
                          <span className="tabular-nums font-semibold text-foreground">{brl(g.total)}</span>
                          <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{pct(p)}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                          <div className={`h-full rounded-full ${ativo ? "bg-gold" : "bg-primary"}`} style={{ width: `${p}%` }} />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">Toque em uma categoria para ver os lançamentos.</p>
            </>
          )}
        </Panel>

        {/* 2. Receitas x despesas — 6 meses */}
        <Panel>
          <PanelTitle icon={BarChart3}>Receitas x Despesas — últimos 6 meses</PanelTitle>
          <div className="h-[300px] w-full lg:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={serie} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid stroke={COR.grade} vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickFormatter={(v) => compact(Number(v))} tickLine={false} axisLine={false} fontSize={12} width={48} />
                <Tooltip formatter={(v: number, n: string) => [brl(v), n]} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="receitas" name="Receitas" fill={COR.verde} radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="despesas" name="Despesas" fill={COR.vermelho} radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Line dataKey="balanco" name="Balanço" type="monotone" stroke={COR.dourado} strokeWidth={2.5} dot={{ r: 3, fill: COR.dourado }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Lançamentos da categoria selecionada */}
        {catSel && (
          <Panel className="lg:col-span-2">
            <PanelTitle
              icon={PieIcon}
              right={
                <button type="button" onClick={() => setCatSel(null)} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs text-muted-foreground hover:bg-secondary">
                  <X className="h-3.5 w-3.5" /> Fechar
                </button>
              }
            >
              {nomeGrupo(grupos.find((g) => g.id === catSel) ?? { cat: null })} em {labelAnoMes(mes)}
            </PanelTitle>
            {lancsCat.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum lançamento.</p>
            ) : (
              <div>
                <div className="hidden grid-cols-[110px_1fr_1fr_1fr_120px] gap-3 border-b border-border pb-2 text-xs text-muted-foreground sm:grid">
                  <span>Data</span><span>Descrição</span><span>Subcategoria</span><span>Conta/cartão</span><span className="text-right">Valor</span>
                </div>
                <ul className="divide-y divide-border">
                  {lancsCat.map((l) => (
                    <li key={l.id} className="grid grid-cols-[1fr_auto] gap-x-3 py-2.5 text-sm sm:grid-cols-[110px_1fr_1fr_1fr_120px] sm:items-center">
                      <span className="hidden text-muted-foreground sm:block">{fmtDate(l.data)}</span>
                      <span className="min-w-0 truncate text-foreground">{l.descricao}</span>
                      <span className="hidden truncate text-muted-foreground sm:block">{catById.get(l.categoria_id ?? "")?.parent_id ? catById.get(l.categoria_id!)?.nome : "—"}</span>
                      <span className="hidden truncate text-muted-foreground sm:block">{origem(l)}</span>
                      <span className="text-right font-semibold tabular-nums text-destructive sm:row-auto">{brl(l.valor)}</span>
                      <span className="col-span-2 text-xs text-muted-foreground sm:hidden">{ddmm(l.data)} · {origem(l)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>
        )}

        {/* 3. Maiores gastos */}
        <Panel>
          <PanelTitle icon={Flame}>Maiores gastos do mês</PanelTitle>
          {top5.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma despesa neste mês.</p>
          ) : (
            <ol className="space-y-2">
              {top5.map((l, i) => {
                const cat = l.categoria_id ? catById.get(l.categoria_id) : null;
                return (
                  <li key={l.id} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gold-soft text-xs font-bold text-primary">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">{l.descricao}</span>
                      <span className="block truncate text-xs text-muted-foreground">{cat?.nome ?? "Sem categoria"} · {ddmm(l.data)}</span>
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-destructive">{brl(l.valor)}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>

        {/* 5. Fixos x variáveis */}
        <Panel>
          <PanelTitle icon={Repeat}>Gastos fixos x variáveis</PanelTitle>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-secondary p-4">
              <p className="text-xs text-muted-foreground">Fixos (todo mês)</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-primary">{brl(fixos)}</p>
              <p className="text-xs text-muted-foreground">{totalMes > 0 ? pct((fixos / totalMes) * 100) : "0%"} das despesas</p>
            </div>
            <div className="rounded-2xl bg-gold-soft p-4">
              <p className="text-xs text-muted-foreground">Variáveis</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-primary">{brl(variaveis)}</p>
              <p className="text-xs text-muted-foreground">{totalMes > 0 ? pct((variaveis / totalMes) * 100) : "0%"} das despesas</p>
            </div>
          </div>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-secondary">
            {totalMes > 0 && (
              <>
                <div className="h-full bg-primary" style={{ width: `${(fixos / totalMes) * 100}%` }} />
                <div className="h-full bg-gold" style={{ width: `${(variaveis / totalMes) * 100}%` }} />
              </>
            )}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Gastos fixos são os marcados como “Todo mês”. Os variáveis são onde costuma haver mais espaço para ajustes.
          </p>
        </Panel>

        {/* 4. Comparativo com o mês anterior */}
        <Panel className="lg:col-span-2">
          <PanelTitle icon={BarChart3}>Comparativo com {labelAnoMes(shiftAnoMes(mes, -1))}</PanelTitle>
          {comparativo.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem despesas nos dois meses.</p>
          ) : (
            <div>
              <div className="hidden grid-cols-[1fr_140px_140px_150px] gap-3 border-b border-border pb-2 text-xs text-muted-foreground sm:grid">
                <span>Categoria</span><span className="text-right">Mês anterior</span><span className="text-right">Este mês</span><span className="text-right">Variação</span>
              </div>
              <ul className="divide-y divide-border">
                {comparativo.map((c) => {
                  const subiu = c.delta > 0.005, caiu = c.delta < -0.005;
                  const Icon = subiu ? ArrowUp : caiu ? ArrowDown : Minus;
                  const cor = subiu ? "text-destructive" : caiu ? "text-success" : "text-muted-foreground";
                  return (
                    <li key={c.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 py-2.5 text-sm sm:grid-cols-[1fr_140px_140px_150px]">
                      <span className="flex min-w-0 items-center gap-2">
                        <CatIcon name={c.cat?.icone} className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-foreground">{c.cat?.nome ?? "Sem categoria"}</span>
                      </span>
                      <span className="hidden text-right tabular-nums text-muted-foreground sm:block">{brl(c.ant)}</span>
                      <span className="hidden text-right font-semibold tabular-nums text-foreground sm:block">{brl(c.atual)}</span>
                      <span className={`flex items-center justify-end gap-1 text-right tabular-nums ${cor}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {c.p === null ? (c.atual > 0 ? "novo" : "—") : pct(Math.abs(c.p))}
                      </span>
                      <span className="col-span-2 text-xs text-muted-foreground sm:hidden">{brl(c.ant)} → <span className="font-semibold text-foreground">{brl(c.atual)}</span></span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
