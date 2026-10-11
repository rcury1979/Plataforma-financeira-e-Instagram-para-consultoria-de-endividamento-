/* Base compartilhada da Área do Cliente (Pessoa Física).
 * Tudo aqui é usado pelas telas em src/pages/cliente/*.tsx. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/** Cliente Supabase sem tipagem estrita — as tabelas cli_* ainda não estão no types.ts gerado. */
export const db = supabase as any;

/* ---------------- formatação ---------------- */
export const brl = (v: number | null | undefined) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const brlSigned = (v: number) => (v > 0 ? "+" : v < 0 ? "-" : "") + brl(Math.abs(v));
export const compact = (v: number) =>
  Math.abs(v) >= 1000 ? `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k` : String(Math.round(v));
export const fmtDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
};
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
export const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
export const DIAS_SEMANA = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

/* ---------------- mês de referência ---------------- */
/** "YYYY-MM" */
export type AnoMes = string;
export const anoMesOf = (d: Date): AnoMes => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
export const shiftAnoMes = (am: AnoMes, delta: number): AnoMes => {
  const [y, m] = am.split("-").map(Number);
  return anoMesOf(new Date(y, m - 1 + delta, 1));
};
export const labelAnoMes = (am: AnoMes) => {
  const [y, m] = am.split("-").map(Number);
  return `${MESES[m - 1]} ${y}`;
};
export const labelAnoMesCurto = (am: AnoMes) => {
  const [y, m] = am.split("-").map(Number);
  return `${MESES_CURTOS[m - 1]}/${String(y).slice(2)}`;
};
/** Primeiro e último dia do mês, em "YYYY-MM-DD". */
export const rangeAnoMes = (am: AnoMes) => {
  const [y, m] = am.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return { inicio: `${am}-01`, fim: `${am}-${String(last).padStart(2, "0")}` };
};

const MesCtx = createContext<{ mes: AnoMes; setMes: (m: AnoMes) => void }>({ mes: anoMesOf(new Date()), setMes: () => {} });
export function MesProvider({ children }: { children: ReactNode }) {
  const [mes, setMes] = useState<AnoMes>(anoMesOf(new Date()));
  return <MesCtx.Provider value={{ mes, setMes }}>{children}</MesCtx.Provider>;
}
/** Mês selecionado no topo das telas (compartilhado entre as telas da área do cliente). */
export const useMes = () => useContext(MesCtx);

export function MonthPicker() {
  const { mes, setMes } = useMes();
  return (
    <div className="inline-flex items-center gap-1 text-sm">
      <button type="button" onClick={() => setMes(shiftAnoMes(mes, -1))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary" aria-label="Mês anterior">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="inline-flex min-w-[140px] items-center justify-center gap-1.5 text-foreground">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        {labelAnoMes(mes)}
      </span>
      <button type="button" onClick={() => setMes(shiftAnoMes(mes, 1))} className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary" aria-label="Próximo mês">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ---------------- usuário / cliente em foco ---------------- */
/** Quando a educadora abre a área de um cliente, este contexto diz qual cliente e qual o endereço base das telas. */
type Alvo = { userId: string | null; base: string; educador: boolean; nomeCliente?: string };
const AlvoCtx = createContext<Alvo>({ userId: null, base: "/cliente", educador: false });
export function ClienteAlvoProvider({ value, children }: { value: Alvo; children: ReactNode }) {
  return <AlvoCtx.Provider value={value}>{children}</AlvoCtx.Provider>;
}
/** true quando quem está vendo é a educadora (não o próprio cliente). */
export const useEducadorView = () => useContext(AlvoCtx).educador;
/** Endereço base das telas do cliente ("/cliente" ou "/educador/clientes/<id>"). */
export const useClienteBase = () => useContext(AlvoCtx).base;

/** id do cliente cujos dados a tela mostra (o próprio usuário ou o cliente aberto pela educadora). */
export function useUserId() {
  const alvo = useContext(AlvoCtx);
  const [userId, setUserId] = useState<string | null>(alvo.userId);
  useEffect(() => {
    if (alvo.userId) { setUserId(alvo.userId); return; }
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [alvo.userId]);
  return userId;
}

/* ---------------- dados de apoio ---------------- */
export type Conta = { id: string; nome: string; tipo: string; saldo_inicial: number; arquivada?: boolean };
export type Cartao = { id: string; nome: string; limite: number | null; dia_fechamento: number; dia_vencimento: number; conta_pagamento_id: string | null };
export type Categoria = { id: string; nome: string; tipo: "despesa" | "receita"; icone: string | null; parent_id: string | null; ordem: number };
export type Lancamento = {
  id: string; user_id: string; tipo: "receita" | "despesa" | "transferencia"; descricao: string; valor: number; data: string;
  categoria_id: string | null; conta_id: string | null; cartao_id: string | null; conta_destino_id: string | null;
  pago: boolean; recorrente: boolean; observacao: string | null; origem: string;
};

/** Carrega contas, cartões e categorias do cliente. `reload()` recarrega. */
export function useCadastros(userId: string | null) {
  const [contas, setContas] = useState<Conta[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [c, k, g] = await Promise.all([
        db.from("cli_contas").select("*").eq("user_id", userId).order("nome"),
        db.from("cli_cartoes").select("*").eq("user_id", userId).order("nome"),
        db.from("cli_categorias").select("*").eq("user_id", userId).order("ordem"),
      ]);
      setContas((c.data ?? []).filter((x: Conta) => !x.arquivada));
      setCartoes(k.data ?? []);
      setCategorias(g.data ?? []);
    })();
  }, [userId, tick]);
  const catById = useMemo(() => new Map(categorias.map((c) => [c.id, c])), [categorias]);
  const contaById = useMemo(() => new Map(contas.map((c) => [c.id, c])), [contas]);
  const cartaoById = useMemo(() => new Map(cartoes.map((c) => [c.id, c])), [cartoes]);
  return { contas, cartoes, categorias, catById, contaById, cartaoById, reload: () => setTick((t) => t + 1) };
}

/** Saldo atual de uma conta = saldo inicial + receitas pagas − despesas pagas ± transferências, até hoje. */
export function saldoConta(conta: Conta, lancs: Lancamento[], ate = todayISO()) {
  let s = Number(conta.saldo_inicial || 0);
  for (const l of lancs) {
    if (!l.pago || l.data > ate) continue;
    const v = Number(l.valor || 0);
    if (l.tipo === "receita" && l.conta_id === conta.id) s += v;
    if (l.tipo === "despesa" && l.conta_id === conta.id && !l.cartao_id) s -= v;
    if (l.tipo === "transferencia") {
      if (l.conta_id === conta.id) s -= v;
      if (l.conta_destino_id === conta.id) s += v;
    }
  }
  return s;
}

/** Mês da fatura em que cai uma compra no cartão (compra após o fechamento vai para a fatura seguinte). */
export function faturaDaCompra(dataISO: string, cartao: Cartao): AnoMes {
  const [y, m, d] = dataISO.split("-").map(Number);
  const base = anoMesOf(new Date(y, m - 1, 1));
  return d >= cartao.dia_fechamento ? shiftAnoMes(base, 1) : base;
}

/** Valor do snapshot vigente em um mês: o último registrado até aquele mês (cada mês herda o anterior). */
export function snapshotVigente<T extends { ano_mes: string }>(snaps: T[], mes: AnoMes): T | null {
  let best: T | null = null;
  for (const s of snaps) if (s.ano_mes <= mes && (!best || s.ano_mes > best.ano_mes)) best = s;
  return best;
}

/* ---------------- UI comum ---------------- */
export function PageHeader({ title, desc, right }: { title: string; desc?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-[28px] leading-tight text-foreground">{title}</h1>
        {desc && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{desc}</p>}
      </div>
      {right && <div className="flex shrink-0 flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_hsl(222_47%_14%/0.06)] ${className}`}>{children}</div>;
}

export function PanelTitle({ icon: Icon, children, right }: { icon?: any; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
        {Icon && <Icon className="h-4 w-4 text-gold" />}
        {children}
      </h2>
      {right}
    </div>
  );
}

export function EmptyState({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
      <p className="font-medium text-foreground">{title}</p>
      {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Botão em pílula (padrão da área do cliente). variant: solid (dourado), outline, ghost. */
export function Pill({ variant = "outline", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "outline" | "ghost" }) {
  const v =
    variant === "solid"
      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_6px_18px_-8px_hsl(var(--primary)/0.55)]"
      : variant === "ghost"
        ? "text-muted-foreground hover:bg-secondary hover:text-foreground"
        : "border border-border bg-card text-foreground hover:bg-secondary";
  return <button type="button" {...props} className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium transition disabled:opacity-50 ${v} ${className}`} />;
}

export function Money({ v, signed = false, className = "" }: { v: number; signed?: boolean; className?: string }) {
  const tone = v > 0 ? "text-success" : v < 0 ? "text-destructive" : "text-foreground";
  return <span className={`tabular-nums font-semibold ${signed ? tone : ""} ${className}`}>{signed ? brlSigned(v) : brl(v)}</span>;
}

/** Campo de formulário com rótulo. */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground/80">{hint}</span>}
    </label>
  );
}
export const inputCls = "h-10 w-full rounded-full border border-border bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/60";
export const selectCls = inputCls + " appearance-none";

/** Lê número digitado em pt-BR ("1.234,56" ou "1234.56"). */
export const parseValor = (s: string) => {
  const t = String(s).trim();
  if (!t) return 0;
  const n = t.includes(",") ? Number(t.replace(/\./g, "").replace(",", ".")) : Number(t);
  return Number.isFinite(n) ? n : 0;
};
