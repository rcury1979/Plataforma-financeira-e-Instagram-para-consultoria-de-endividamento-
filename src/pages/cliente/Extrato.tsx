/* Extrato: lançamentos do mês agrupados por dia, com busca, filtros, seleção em lote, exportação e totais. */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Search, ListChecks, Download, Filter, Landmark, CreditCard, CheckCircle2, Clock, X, Trash2, ThumbsUp, Check,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  db, brl, useMes, useUserId, useCadastros, MonthPicker, PageHeader, Panel, EmptyState, Pill, Field, selectCls, inputCls,
  MESES_CURTOS, DIAS_SEMANA, labelAnoMes, type Lancamento,
} from "./_shared";
import { CatIcon } from "./_icons";
import { useLancamentos, doMes, soma } from "./_extrato-utils";
import { BotoesLancamento, DialogoLancamento, useLancDialog, BotaoPago } from "./_extrato-acoes";

type Filtros = { tipo: string; origem: string; categoria: string; status: string };
const FILTROS_VAZIOS: Filtros = { tipo: "", origem: "", categoria: "", status: "" };

export default function Extrato() {
  const userId = useUserId();
  const { mes } = useMes();
  const cad = useCadastros(userId);
  const { contas, cartoes, categorias, catById, contaById, cartaoById } = cad;
  const { lancs, setLancs, reload, togglePago, loading } = useLancamentos(userId);
  const dlg = useLancDialog();
  const [params, setParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  const [f, setF] = useState<Filtros>(() => ({ ...FILTROS_VAZIOS, origem: params.get("conta") ? `conta:${params.get("conta")}` : "" }));
  const [selecionando, setSelecionando] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [confirmar, setConfirmar] = useState(false);

  // ?conta=<id> (vindo do Dashboard) controla o filtro de conta
  const contaParam = params.get("conta");
  useEffect(() => {
    setF((x) => ({ ...x, origem: contaParam ? `conta:${contaParam}` : x.origem.startsWith("conta:") ? "" : x.origem }));
  }, [contaParam]);
  const setOrigem = (v: string) => {
    setF((x) => ({ ...x, origem: v }));
    setParams(v.startsWith("conta:") ? { conta: v.slice(6) } : {}, { replace: true });
  };
  const limparFiltros = () => { setF(FILTROS_VAZIOS); setParams({}, { replace: true }); };

  const nomeCat = (id: string | null) => (id ? catById.get(id)?.nome ?? "" : "");
  const origemLabel = (l: Lancamento) => {
    if (l.tipo === "transferencia") return `${contaById.get(l.conta_id ?? "")?.nome ?? "?"} → ${contaById.get(l.conta_destino_id ?? "")?.nome ?? "?"}`;
    if (l.cartao_id) return cartaoById.get(l.cartao_id)?.nome ?? "Cartão";
    return contaById.get(l.conta_id ?? "")?.nome ?? "—";
  };

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const catIds = f.categoria ? new Set([f.categoria, ...categorias.filter((c) => c.parent_id === f.categoria).map((c) => c.id)]) : null;
    const [kind, oid] = f.origem.split(":");
    return doMes(lancs, mes).filter((l) => {
      if (f.tipo && l.tipo !== f.tipo) return false;
      if (f.status === "pago" && !l.pago) return false;
      if (f.status === "pendente" && l.pago) return false;
      if (catIds && !(l.categoria_id && catIds.has(l.categoria_id))) return false;
      if (kind === "conta" && !(l.conta_id === oid && !l.cartao_id) && l.conta_destino_id !== oid) return false;
      if (kind === "cartao" && l.cartao_id !== oid) return false;
      if (q) {
        const txt = [l.descricao, nomeCat(l.categoria_id), origemLabel(l), l.observacao ?? ""].join(" ").toLowerCase();
        if (!txt.includes(q)) return false;
      }
      return true;
    });
  }, [lancs, mes, f, busca, categorias, catById, contaById, cartaoById]); // eslint-disable-line react-hooks/exhaustive-deps

  // agrupa por dia (mais recente primeiro)
  const grupos = useMemo(() => {
    const m = new Map<string, Lancamento[]>();
    for (const l of [...filtrados].sort((a, b) => b.data.localeCompare(a.data))) {
      if (!m.has(l.data)) m.set(l.data, []);
      m.get(l.data)!.push(l);
    }
    return [...m.entries()];
  }, [filtrados]);

  const tot = (xs: Lancamento[]) => {
    const e = soma(xs.filter((l) => l.tipo === "receita"));
    const s = soma(xs.filter((l) => l.tipo === "despesa"));
    return { e, s, b: e - s };
  };
  const realizado = tot(filtrados.filter((l) => l.pago));
  const comPend = tot(filtrados);

  const nFiltros = [f.tipo, f.origem, f.categoria, f.status].filter(Boolean).length;

  /* ---------- ações em lote ---------- */
  const toggleSel = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const sairSelecao = () => { setSelecionando(false); setSel(new Set()); };
  const marcarPagoLote = async () => {
    const ids = [...sel];
    const { error } = await db.from("cli_lancamentos").update({ pago: true }).in("id", ids);
    if (error) return toast.error("Não foi possível atualizar.");
    setLancs((xs) => xs.map((x) => (sel.has(x.id) ? { ...x, pago: true } : x)));
    toast.success(`${ids.length} lançamento(s) marcados como pagos`);
    sairSelecao();
  };
  const excluirLote = async () => {
    const ids = [...sel];
    const { error } = await db.from("cli_lancamentos").delete().in("id", ids);
    setConfirmar(false);
    if (error) return toast.error("Não foi possível excluir.");
    setLancs((xs) => xs.filter((x) => !sel.has(x.id)));
    toast.success(`${ids.length} lançamento(s) excluídos`);
    sairSelecao();
  };

  /* ---------- exportar CSV ---------- */
  const exportar = () => {
    if (filtrados.length === 0) return toast.info("Nada para exportar neste filtro.");
    const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
    const tipoNome = { receita: "Receita", despesa: "Despesa", transferencia: "Transferência" } as const;
    const linhas = [
      ["Data", "Tipo", "Descrição", "Categoria", "Conta/Cartão", "Valor", "Status"].join(";"),
      ...[...filtrados].sort((a, b) => a.data.localeCompare(b.data)).map((l) =>
        [
          l.data.split("-").reverse().join("/"), tipoNome[l.tipo], esc(l.descricao), esc(nomeCat(l.categoria_id)), esc(origemLabel(l)),
          (l.tipo === "despesa" ? -l.valor : l.valor).toFixed(2).replace(".", ","), l.pago ? "Pago" : "Pendente",
        ].join(";"),
      ),
    ];
    const blob = new Blob(["﻿" + linhas.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `extrato-${mes}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Extrato exportado");
  };

  const despCats = categorias.filter((c) => !c.parent_id);

  return (
    <div>
      <PageHeader
        title="Extrato"
        right={
          <>
            <Pill variant={selecionando ? "solid" : "ghost"} onClick={() => (selecionando ? sairSelecao() : setSelecionando(true))}>
              <ListChecks className="h-4 w-4" /> {selecionando ? "Cancelar seleção" : "Selecionar"}
            </Pill>
            <Pill variant="ghost" onClick={exportar}><Download className="h-4 w-4" /> Exportar</Pill>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition ${nFiltros ? "border border-border bg-card text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                  <Filter className="h-4 w-4" /> Filtros
                  {nFiltros > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-primary">{nFiltros}</span>}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[300px] space-y-3 rounded-2xl">
                <Field label="Tipo">
                  <select className={selectCls} value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}>
                    <option value="">Todos</option>
                    <option value="receita">Receitas</option>
                    <option value="despesa">Despesas</option>
                    <option value="transferencia">Transferências</option>
                  </select>
                </Field>
                <Field label="Conta ou cartão">
                  <select className={selectCls} value={f.origem} onChange={(e) => setOrigem(e.target.value)}>
                    <option value="">Todos</option>
                    <optgroup label="Contas">{contas.map((c) => <option key={c.id} value={`conta:${c.id}`}>{c.nome}</option>)}</optgroup>
                    {cartoes.length > 0 && <optgroup label="Cartões">{cartoes.map((c) => <option key={c.id} value={`cartao:${c.id}`}>{c.nome}</option>)}</optgroup>}
                  </select>
                </Field>
                <Field label="Categoria">
                  <select className={selectCls} value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>
                    <option value="">Todas</option>
                    {(["despesa", "receita"] as const).map((t) => (
                      <optgroup key={t} label={t === "despesa" ? "Despesas" : "Receitas"}>
                        {despCats.filter((c) => c.tipo === t).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <select className={selectCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
                    <option value="">Todos</option>
                    <option value="pago">Pago / recebido</option>
                    <option value="pendente">Pendente</option>
                  </select>
                </Field>
                {nFiltros > 0 && <Pill variant="ghost" className="w-full" onClick={limparFiltros}><X className="h-4 w-4" /> Limpar filtros</Pill>}
              </PopoverContent>
            </Popover>
            <MonthPicker />
          </>
        }
      />

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input className={`${inputCls} bg-card pl-10`} placeholder="Buscar por descrição, conta, cartão…" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <BotoesLancamento onNovo={dlg.novo} />
      </div>

      {/* filtros ativos */}
      {nFiltros > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {f.tipo && <Chip onX={() => setF({ ...f, tipo: "" })}>{{ receita: "Receitas", despesa: "Despesas", transferencia: "Transferências" }[f.tipo]}</Chip>}
          {f.origem && <Chip onX={() => setOrigem("")}>{(f.origem.startsWith("conta:") ? contaById.get(f.origem.slice(6)) : cartaoById.get(f.origem.slice(7)))?.nome ?? "Conta"}</Chip>}
          {f.categoria && <Chip onX={() => setF({ ...f, categoria: "" })}>{nomeCat(f.categoria)}</Chip>}
          {f.status && <Chip onX={() => setF({ ...f, status: "" })}>{f.status === "pago" ? "Pagos" : "Pendentes"}</Chip>}
        </div>
      )}

      {/* barra de seleção */}
      {selecionando && (
        <div className="sticky top-2 z-10 mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 shadow-sm">
          <span className="mr-auto text-sm text-foreground">{sel.size} selecionado(s)</span>
          <Pill variant="ghost" onClick={() => setSel(sel.size === filtrados.length ? new Set() : new Set(filtrados.map((l) => l.id)))}>
            {sel.size === filtrados.length && filtrados.length > 0 ? "Desmarcar todos" : "Selecionar todos"}
          </Pill>
          <Pill disabled={!sel.size} onClick={marcarPagoLote}><ThumbsUp className="h-4 w-4 text-success" /> Marcar pago</Pill>
          <Pill disabled={!sel.size} onClick={() => setConfirmar(true)} className="text-destructive"><Trash2 className="h-4 w-4" /> Excluir</Pill>
        </div>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : grupos.length === 0 ? (
        <EmptyState
          title={busca || nFiltros ? "Nada encontrado com esse filtro" : `Nenhum lançamento em ${labelAnoMes(mes)}`}
          desc={busca || nFiltros ? "Tente outra busca ou limpe os filtros." : "Registre uma receita ou despesa para começar."}
        />
      ) : (
        <div className="space-y-5">
          {grupos.map(([dia, itens]) => {
            const [y, m, d] = dia.split("-").map(Number);
            const sem = DIAS_SEMANA[new Date(y, m - 1, d).getDay()];
            return (
              <section key={dia}>
                <div className="mb-1 flex items-center gap-2 px-1">
                  <span className="text-lg font-bold tabular-nums text-foreground">{String(d).padStart(2, "0")}</span>
                  <span className="text-sm text-muted-foreground">{MESES_CURTOS[m - 1]}</span>
                  <span className="text-xs text-muted-foreground">· {sem}</span>
                  <span className="ml-2 h-px flex-1 bg-border" />
                </div>
                <ul>
                  {itens.map((l) => {
                    const cat = l.categoria_id ? catById.get(l.categoria_id) : null;
                    const marcado = sel.has(l.id);
                    const OIcon = l.cartao_id ? CreditCard : Landmark;
                    return (
                      <li
                        key={l.id}
                        onClick={() => (selecionando ? toggleSel(l.id) : dlg.editar(l))}
                        className={`grid cursor-pointer grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-2xl px-2 py-2.5 transition sm:grid-cols-[auto_minmax(0,1.4fr)_minmax(0,1fr)_auto_auto] ${
                          marcado ? "bg-gold-soft" : "hover:bg-card"
                        }`}
                      >
                        {selecionando ? (
                          <span className={`grid h-10 w-10 place-items-center rounded-full border ${marcado ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>
                            {marcado && <Check className="h-4 w-4" />}
                          </span>
                        ) : (
                          <span className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-muted-foreground">
                            <CatIcon name={l.tipo === "transferencia" ? "recorrente" : cat?.icone} />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm text-foreground">{l.descricao}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {l.tipo === "transferencia" ? "Entre contas" : cat?.nome ?? "Sem categoria"}
                            <span className="sm:hidden"> · {origemLabel(l)}</span>
                          </p>
                        </div>
                        <p className="hidden min-w-0 items-center gap-1.5 truncate text-xs text-muted-foreground sm:flex">
                          <OIcon className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{origemLabel(l)}</span>
                        </p>
                        <span className={`whitespace-nowrap text-right text-sm font-semibold tabular-nums ${
                          l.tipo === "receita" ? "text-success" : l.tipo === "despesa" ? "text-destructive" : "text-foreground"
                        } ${!l.pago ? "opacity-70" : ""}`}>
                          {l.tipo === "receita" ? "+ " : l.tipo === "despesa" ? "− " : ""}{brl(l.valor)}
                        </span>
                        {l.tipo === "transferencia" ? <span className="w-8" /> : <BotaoPago pago={l.pago} tipo={l.tipo} onClick={() => togglePago(l)} />}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {/* Totais */}
      <Panel className="mt-8">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[15px] font-semibold text-foreground">Totais do período</h2>
          <span className="text-xs text-muted-foreground">conforme os filtros aplicados</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <BlocoTotais titulo="Realizado" sub="(pago)" icon={CheckCircle2} t={realizado} />
          <BlocoTotais titulo="Com pendentes" icon={Clock} t={comPend} tracejado />
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">Entradas e saídas do filtro atual. Não inclui transferências.</p>
      </Panel>

      <DialogoLancamento d={dlg} userId={userId} cad={cad} onSaved={reload} />

      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {sel.size} lançamento(s)?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={excluirLote}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Chip({ children, onX }: { children: React.ReactNode; onX: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-3 py-1 text-xs text-primary">
      {children}
      <button type="button" onClick={onX} aria-label="Remover filtro" className="rounded-full p-0.5 hover:bg-card"><X className="h-3 w-3" /></button>
    </span>
  );
}

function BlocoTotais({ titulo, sub, icon: Icon, t, tracejado = false }: { titulo: string; sub?: string; icon: typeof Clock; t: { e: number; s: number; b: number }; tracejado?: boolean }) {
  return (
    <div className={`rounded-2xl border border-border p-4 ${tracejado ? "border-dashed" : ""}`}>
      <p className="mb-2 flex items-center gap-1.5 text-sm text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" /> {titulo} {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Entradas</span><span className="font-semibold tabular-nums text-success">+{brl(t.e)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Saídas</span><span className="font-semibold tabular-nums text-destructive">−{brl(t.s)}</span></div>
      </div>
      <div className={`mt-2 flex justify-between rounded-xl px-3 py-2 text-sm ${t.b >= 0 ? "bg-success/10" : "bg-destructive/10"}`}>
        <span className="text-foreground">Balanço</span>
        <span className={`font-bold tabular-nums ${t.b >= 0 ? "text-success" : "text-destructive"}`}>{t.b >= 0 ? "+" : "−"}{brl(Math.abs(t.b))}</span>
      </div>
    </div>
  );
}
