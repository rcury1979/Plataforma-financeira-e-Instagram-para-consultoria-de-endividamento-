/* Dashboard: visão geral do mês — saldo, receitas, despesas, faturas, tarefas, contas a pagar/receber e Método GCPM. */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Wallet, Landmark, ChevronRight, TrendingUp, TrendingDown, CreditCard, ListChecks, ArrowDownCircle, ArrowUpCircle,
  Sprout, HeartHandshake, ShieldCheck, Coins,
} from "lucide-react";
import {
  db, brl, brlSigned, useMes, useUserId, useCadastros, saldoConta, faturaDaCompra, shiftAnoMes, MonthPicker,
  PageHeader, Panel, PanelTitle, MESES, todayISO, type Cartao, type Lancamento, type AnoMes, useClienteBase } from "./_shared";
import { CatIcon } from "./_icons";
import { useLancamentos, doMes, soma, gastoCategoria, ddmm, pct, TIPO_CONTA, type Limite } from "./_extrato-utils";
import { BotoesLancamento, DialogoLancamento, useLancDialog, BotaoPago } from "./_extrato-acoes";

type Tarefa = { id: string; titulo: string; prazo: string | null; status: string };

/** Data de vencimento da fatura de um mês (se vence antes/no dia do fechamento, cai no mês seguinte). */
function vencimentoFatura(mes: AnoMes, c: Cartao) {
  const am = c.dia_vencimento <= c.dia_fechamento ? shiftAnoMes(mes, 1) : mes;
  return `${String(c.dia_vencimento).padStart(2, "0")}/${am.slice(5, 7)}`;
}

export default function Dashboard() {
  const base = useClienteBase();
  const userId = useUserId();
  const { mes } = useMes();
  const navigate = useNavigate();
  const cad = useCadastros(userId);
  const { contas, cartoes, categorias, catById } = cad;
  const { lancs, reload, togglePago } = useLancamentos(userId);
  const dlg = useLancDialog();
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [limites, setLimites] = useState<Limite[]>([]);

  useEffect(() => {
    if (!userId) return;
    db.from("cli_tarefas").select("*").eq("user_id", userId).eq("status", "pendente").order("prazo").limit(5)
      .then(({ data }: { data: Tarefa[] | null }) => setTarefas(data ?? []));
    db.from("cli_limites").select("*").eq("user_id", userId)
      .then(({ data }: { data: Limite[] | null }) => setLimites(data ?? []));
  }, [userId]);

  const doMesL = useMemo(() => doMes(lancs, mes), [lancs, mes]);
  const receitas = doMesL.filter((l) => l.tipo === "receita");
  const despesas = doMesL.filter((l) => l.tipo === "despesa");
  const totalRec = soma(receitas);
  const totalDesp = soma(despesas);
  const balanco = totalRec - totalDesp;

  const saldos = contas.map((c) => ({ conta: c, saldo: saldoConta(c, lancs) }));
  const saldoTotal = saldos.reduce((s, x) => s + x.saldo, 0);

  const aPagar = despesas.filter((l) => !l.pago).sort((a, b) => a.data.localeCompare(b.data));
  const aReceber = receitas.filter((l) => !l.pago).sort((a, b) => a.data.localeCompare(b.data));

  // ----- Método GCPM -----
  const gcpm = useMemo(() => {
    const despRaiz = categorias.filter((c) => c.tipo === "despesa");
    let dentro = 0, gastoLimitado = 0, catsOk = 0;
    for (const lim of limites) {
      const cat = catById.get(lim.categoria_id);
      if (!cat || cat.parent_id) continue;
      const g = gastoCategoria(cat, despesas, categorias);
      gastoLimitado += g; dentro += Math.min(g, Number(lim.valor));
      if (g <= Number(lim.valor)) catsOk++;
    }
    const nLim = limites.filter((l) => { const c = catById.get(l.categoria_id); return c && !c.parent_id; }).length;
    const cuidar = nLim === 0 ? null : gastoLimitado === 0 ? 100 : (dentro / gastoLimitado) * 100;
    // média de despesas dos 3 meses anteriores (com movimento); se não houver, usa o mês atual
    const meses = [1, 2, 3].map((i) => soma(doMes(lancs, shiftAnoMes(mes, -i)).filter((l) => l.tipo === "despesa"))).filter((v) => v > 0);
    const media = meses.length ? meses.reduce((a, b) => a + b, 0) / meses.length : totalDesp;
    const reserva = media > 0 ? Math.max(0, saldoTotal) / media : 0;
    const invest = despRaiz.find((c) => !c.parent_id && c.nome.toLowerCase() === "investimentos");
    const multiplicar = invest ? gastoCategoria(invest, despesas, categorias) : 0;
    return { cuidar, catsOk, nLim, reserva, multiplicar };
  }, [limites, catById, categorias, despesas, lancs, mes, totalDesp, saldoTotal]);

  const faturas = cartoes.map((c) => {
    const compras = lancs.filter((l) => l.tipo === "despesa" && l.cartao_id === c.id && faturaDaCompra(l.data, c) === mes);
    return { c, total: soma(compras) };
  });

  const nomeMes = MESES[Number(mes.slice(5, 7)) - 1].toLowerCase();
  const hoje = todayISO();

  return (
    <div>
      <PageHeader title="Dashboard" desc="Visão geral da saúde financeira do mês: saldo, receitas, despesas e alertas." right={<MonthPicker />} />
      <BotoesLancamento onNovo={dlg.novo} className="mb-5 justify-end" />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[repeat(2,minmax(0,1fr))]">
        {/* Saldo total */}
        <Panel>
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gold-soft text-primary"><Wallet className="h-5 w-5" /></span>
            <div>
              <p className="text-xs text-muted-foreground">Saldo total</p>
              <p className={`text-2xl font-bold tabular-nums ${saldoTotal < 0 ? "text-destructive" : "text-primary"}`}>{brl(saldoTotal)}</p>
            </div>
          </div>
          {saldos.length === 0 ? (
            <p className="pt-4 text-sm text-muted-foreground">Cadastre suas contas em <Link to={`${base}/configuracoes`} className="text-primary underline">Configurações</Link>.</p>
          ) : (
            <ul className="pt-2">
              {saldos.map(({ conta, saldo }) => (
                <li key={conta.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`${base}/extrato?conta=${conta.id}`)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-secondary"
                  >
                    <Landmark className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">{conta.nome}</span>
                      <span className="block text-xs text-muted-foreground">{TIPO_CONTA[conta.tipo] ?? conta.tipo}</span>
                    </span>
                    <span className={`text-sm font-semibold tabular-nums ${saldo < 0 ? "text-destructive" : "text-foreground"}`}>{brl(saldo)}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Receitas / despesas / balanço */}
        <Panel className="flex flex-col justify-center gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-success/10 text-success"><TrendingUp className="h-5 w-5" /></span>
            <span className="flex-1 text-sm text-muted-foreground">Receitas do mês</span>
            <span className="text-lg font-bold tabular-nums text-foreground">{brl(totalRec)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive"><TrendingDown className="h-5 w-5" /></span>
            <span className="flex-1 text-sm text-muted-foreground">Despesas do mês</span>
            <span className="text-lg font-bold tabular-nums text-foreground">{brl(totalDesp)}</span>
          </div>
          <div className={`flex items-center justify-between rounded-2xl px-4 py-3.5 ${balanco >= 0 ? "bg-success/10" : "bg-destructive/10"}`}>
            <span className="text-sm text-foreground">Balanço do mês</span>
            <span className={`text-xl font-bold tabular-nums ${balanco >= 0 ? "text-success" : "text-destructive"}`}>{brlSigned(balanco)}</span>
          </div>
        </Panel>

        {/* Faturas dos cartões */}
        <Panel>
          <PanelTitle icon={CreditCard}>Faturas dos cartões</PanelTitle>
          {faturas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cartão cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {faturas.map(({ c, total }) => {
                const uso = c.limite ? Math.min(100, (total / Number(c.limite)) * 100) : 0;
                return (
                  <div key={c.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{c.nome}</p>
                        <p className="text-xs text-muted-foreground">Fech. dia {c.dia_fechamento} · Venc. dia {c.dia_vencimento}</p>
                        <p className="text-xs text-muted-foreground">Fatura de {nomeMes} · vence {vencimentoFatura(mes, c)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold tabular-nums text-foreground">{brl(total)}</p>
                        {total === 0 && <span className="mt-1 inline-block rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">Sem lançamentos</span>}
                      </div>
                    </div>
                    {c.limite ? (
                      <div className="mt-3">
                        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                          <div className={`h-full rounded-full ${uso > 80 ? "bg-gold" : "bg-primary"}`} style={{ width: `${uso}%` }} />
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">{pct(uso)} do limite de {brl(Number(c.limite))}</p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        {/* Tarefas pendentes */}
        <Panel>
          <PanelTitle icon={ListChecks} right={<Link to={`${base}/tarefas`} className="text-xs font-medium text-primary hover:underline">Ver todas</Link>}>
            Tarefas pendentes
          </PanelTitle>
          {tarefas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma tarefa pendente.</p>
          ) : (
            <ul className="divide-y divide-border">
              {tarefas.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-gold" />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">{t.titulo}</span>
                  {t.prazo && (
                    <span className={`shrink-0 text-xs ${t.prazo < hoje ? "text-destructive" : "text-muted-foreground"}`}>até {ddmm(t.prazo)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <ListaPendentes
          titulo="Contas a pagar" sub="Parte ainda não paga das despesas do mês" icon={ArrowDownCircle} tom="destructive"
          itens={aPagar} vazio="Nenhuma conta a pagar neste mês." catById={catById} onToggle={togglePago} onOpen={dlg.editar}
        />
        <ListaPendentes
          titulo="Contas a receber" sub="Receitas do mês que ainda não entraram" icon={ArrowUpCircle} tom="success"
          itens={aReceber} vazio="Nenhuma conta a receber neste mês." catById={catById} onToggle={togglePago} onOpen={dlg.editar}
        />

        {/* Método GCPM */}
        <Panel className="border-gold/40 bg-gold-soft/40 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gold">
              <span className="font-display text-[11px] italic text-primary">R&amp;M</span>
            </span>
            <div>
              <h2 className="font-display text-lg text-primary">Seu mês no Método GCPM</h2>
              <p className="text-xs text-muted-foreground">Gerar, Cuidar, Proteger e Multiplicar — um passo de cada vez.</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Indicador icon={Sprout} letra="Gerar" valor={brl(totalRec)}
              frase={totalRec > 0 ? "Tudo o que entrou no mês. Cada fonte de renda conta." : "Registre suas entradas para enxergar o mês inteiro."} />
            <Indicador icon={HeartHandshake} letra="Cuidar" valor={gcpm.cuidar === null ? "—" : pct(gcpm.cuidar)}
              frase={gcpm.cuidar === null ? "Defina limites por categoria para acompanhar seus gastos."
                : `${gcpm.catsOk} de ${gcpm.nLim} categorias dentro do limite. ${gcpm.cuidar >= 90 ? "Muito bem!" : "Dá para ajustar com calma."}`}
              link={gcpm.cuidar === null ? `${base}/limites` : undefined} />
            <Indicador icon={ShieldCheck} letra="Proteger" valor={`${gcpm.reserva.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${gcpm.reserva >= 1 && gcpm.reserva < 2 ? "mês" : "meses"}`}
              frase={gcpm.reserva >= 6 ? "Reserva saudável. Você está protegido(a)." : "de reserva. A meta é chegar a 6 meses de despesas."} />
            <Indicador icon={Coins} letra="Multiplicar" valor={brl(gcpm.multiplicar)}
              frase={gcpm.multiplicar > 0 ? "Investido neste mês. Seu dinheiro trabalhando por você." : "Que tal separar um valor, mesmo pequeno, para investir?"} />
          </div>
        </Panel>
      </div>

      <DialogoLancamento d={dlg} userId={userId} cad={cad} onSaved={reload} />
    </div>
  );
}

function Indicador({ icon: Icon, letra, valor, frase, link }: { icon: typeof Sprout; letra: string; valor: string; frase: string; link?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold"><Icon className="h-3.5 w-3.5" /> {letra}</p>
      <p className="mt-1.5 text-xl font-bold tabular-nums text-primary">{valor}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {frase} {link && <Link to={link} className="text-primary underline">Definir limites</Link>}
      </p>
    </div>
  );
}

function ListaPendentes({
  titulo, sub, icon: Icon, tom, itens, vazio, catById, onToggle, onOpen,
}: {
  titulo: string; sub: string; icon: typeof Wallet; tom: "success" | "destructive"; itens: Lancamento[]; vazio: string;
  catById: Map<string, { icone: string | null }>; onToggle: (l: Lancamento) => void; onOpen: (l: Lancamento) => void;
}) {
  const total = soma(itens);
  const cor = tom === "success" ? "text-success" : "text-destructive";
  return (
    <Panel>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground"><Icon className={`h-4 w-4 ${cor}`} /> {titulo}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
        </div>
        {itens.length > 0 && <span className={`text-sm font-bold tabular-nums ${cor}`}>{brl(total)}</span>}
      </div>
      {itens.length === 0 ? (
        <p className="text-sm text-muted-foreground">{vazio}</p>
      ) : (
        <ul className="divide-y divide-border">
          {itens.map((l) => (
            <li key={l.id} className="flex cursor-pointer items-center gap-3 py-2.5" onClick={() => onOpen(l)}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
                <CatIcon name={l.categoria_id ? catById.get(l.categoria_id)?.icone : null} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-foreground">{l.descricao}</span>
                <span className="block text-xs text-muted-foreground">{ddmm(l.data)}</span>
              </span>
              <BotaoPago pago={l.pago} tipo={l.tipo} onClick={() => onToggle(l)} />
              <span className={`text-sm font-semibold tabular-nums ${cor}`}>{brl(l.valor)}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
