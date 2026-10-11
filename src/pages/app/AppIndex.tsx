import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTipoPessoa } from "@/hooks/useTipoPessoa";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight, Wallet, TrendingUp, TrendingDown, Target, PiggyBank,
  Users, FileText, Package, ShoppingCart, ListChecks, Sparkles, Database,
} from "lucide-react";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

function Kpi({ icon: Icon, label, value, hint, tone }: {
  icon: any; label: string; value: string; hint?: string; tone?: "up" | "down" | "neutral";
}) {
  const toneClass =
    tone === "up" ? "text-emerald-500" : tone === "down" ? "text-red-500" : "text-foreground";
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function Atalho({ to, icon: Icon, title, desc }: { to: string; icon: any; title: string; desc: string }) {
  return (
    <Link
      to={to}
      className="group rounded-xl border bg-card p-4 flex items-start gap-3 hover:border-primary hover:bg-accent/50 transition"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 font-semibold">
          {title}
          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition" />
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{desc}</p>
      </div>
    </Link>
  );
}

function HomePF({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [receitas, setReceitas] = useState(0);
  const [despesas, setDespesas] = useState(0);
  const [patrimonio, setPatrimonio] = useState(0);
  const [dividasSaldo, setDividasSaldo] = useState(0);
  const [metasAtivas, setMetasAtivas] = useState(0);

  useEffect(() => {
    (async () => {
      const inicioMes = new Date();
      inicioMes.setDate(1);
      const dataStr = inicioMes.toISOString().slice(0, 10);
      const [tx, pat, div, met] = await Promise.all([
        (supabase as any).from("pf_transacoes").select("tipo,valor").eq("user_id", userId).gte("data", dataStr),
        (supabase as any).from("pf_patrimonio").select("valor_atual").eq("user_id", userId),
        (supabase as any).from("pf_dividas").select("valor_total,valor_pago").eq("user_id", userId).eq("quitada", false),
        (supabase as any).from("pf_metas_pessoais").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("concluida", false),
      ]);
      const rec = (tx.data ?? []).filter((t: any) => t.tipo === "receita").reduce((s: number, t: any) => s + Number(t.valor || 0), 0);
      const des = (tx.data ?? []).filter((t: any) => t.tipo === "despesa").reduce((s: number, t: any) => s + Number(t.valor || 0), 0);
      const pt = (pat.data ?? []).reduce((s: number, p: any) => s + Number(p.valor_atual || 0), 0);
      const dv = (div.data ?? []).reduce((s: number, d: any) => s + (Number(d.valor_total || 0) - Number(d.valor_pago || 0)), 0);
      setReceitas(rec); setDespesas(des); setPatrimonio(pt); setDividasSaldo(dv);
      setMetasAtivas(met.count ?? 0);
      setLoading(false);
    })();
  }, [userId]);

  const saldo = receitas - despesas;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Seu espaço pessoal</span>
        <h1 className="text-2xl md:text-3xl font-bold mt-1">Como estão suas finanças hoje?</h1>
        <p className="text-muted-foreground mt-2">
          Acompanhe seus lançamentos, dívidas e sonhos em um só lugar — sem julgamento, no seu ritmo.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={TrendingUp} label="Receitas no mês" value={loading ? "—" : brl(receitas)} tone="up" />
        <Kpi icon={TrendingDown} label="Despesas no mês" value={loading ? "—" : brl(despesas)} tone="down" />
        <Kpi icon={Wallet} label="Saldo do mês" value={loading ? "—" : brl(saldo)} tone={saldo >= 0 ? "up" : "down"} />
        <Kpi icon={PiggyBank} label="Patrimônio" value={loading ? "—" : brl(patrimonio)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Kpi icon={TrendingDown} label="Dívidas em aberto" value={loading ? "—" : brl(dividasSaldo)} hint="Saldo devedor total" tone={dividasSaldo > 0 ? "down" : "neutral"} />
        <Kpi icon={Target} label="Sonhos em andamento" value={loading ? "—" : String(metasAtivas)} hint="Metas que você está buscando" />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Atalhos rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Atalho to="/app/pf/transacoes" icon={Wallet} title="Lançar gasto ou receita" desc="Registre um movimento em segundos." />
          <Atalho to="/app/pf/dividas" icon={TrendingDown} title="Minhas dívidas" desc="Organize e planeje a quitação com coragem." />
          <Atalho to="/app/pf/metas" icon={Target} title="Sonhos e metas" desc="Defina onde quer chegar e acompanhe." />
          <Atalho to="/app/pf/patrimonio" icon={PiggyBank} title="Meu patrimônio" desc="Bens, aplicações e reservas." />
          <Atalho to="/app/pf/evolucao" icon={TrendingUp} title="Evolução" desc="Veja sua jornada mês a mês." />
          <Atalho to="/app/simuladores" icon={Sparkles} title="Simuladores" desc="Juros, financiamentos e independência." />
        </div>
      </div>
    </div>
  );
}

function HomePJ({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [receitas, setReceitas] = useState(0);
  const [despesas, setDespesas] = useState(0);
  const [aReceber, setAReceber] = useState(0);
  const [aPagar, setAPagar] = useState(0);
  const [clientes, setClientes] = useState(0);
  const [tarefasAbertas, setTarefasAbertas] = useState(0);

  useEffect(() => {
    (async () => {
      const inicioMes = new Date();
      inicioMes.setDate(1);
      const dataStr = inicioMes.toISOString().slice(0, 10);
      const [lanc, cr, cp, cli, tar] = await Promise.all([
        (supabase as any).from("lancamentos").select("tipo,valor,data").gte("data", dataStr),
        (supabase as any).from("contas_receber").select("valor,valor_recebido,status"),
        (supabase as any).from("contas_pagar").select("valor,valor_pago,status"),
        supabase.from("clientes").select("*", { count: "exact", head: true }),
        (supabase as any).from("tarefas").select("*", { count: "exact", head: true }).neq("status", "concluida"),
      ]);
      const rec = (lanc.data ?? []).filter((l: any) => l.tipo === "receita").reduce((s: number, l: any) => s + Number(l.valor || 0), 0);
      const des = (lanc.data ?? []).filter((l: any) => l.tipo === "despesa").reduce((s: number, l: any) => s + Number(l.valor || 0), 0);
      const ar = (cr.data ?? []).filter((r: any) => r.status !== "recebido").reduce((s: number, r: any) => s + (Number(r.valor || 0) - Number(r.valor_recebido || 0)), 0);
      const ap = (cp.data ?? []).filter((p: any) => p.status !== "pago").reduce((s: number, p: any) => s + (Number(p.valor || 0) - Number(p.valor_pago || 0)), 0);
      setReceitas(rec); setDespesas(des); setAReceber(ar); setAPagar(ap);
      setClientes(cli.count ?? 0);
      setTarefasAbertas(tar.count ?? 0);
      setLoading(false);
    })();
  }, [userId]);

  const resultado = receitas - despesas;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-gradient-to-br from-primary/10 via-card to-card p-6">
        <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Painel da empresa</span>
        <h1 className="text-2xl md:text-3xl font-bold mt-1">Visão geral do negócio</h1>
        <p className="text-muted-foreground mt-2">
          Fluxo de caixa, recebíveis e obrigações do mês — tudo consolidado.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={TrendingUp} label="Receitas do mês" value={loading ? "—" : brl(receitas)} tone="up" />
        <Kpi icon={TrendingDown} label="Despesas do mês" value={loading ? "—" : brl(despesas)} tone="down" />
        <Kpi icon={Wallet} label="Resultado" value={loading ? "—" : brl(resultado)} tone={resultado >= 0 ? "up" : "down"} />
        <Kpi icon={Users} label="Clientes" value={loading ? "—" : String(clientes)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Kpi icon={TrendingUp} label="A receber" value={loading ? "—" : brl(aReceber)} hint="Contas em aberto" tone="up" />
        <Kpi icon={TrendingDown} label="A pagar" value={loading ? "—" : brl(aPagar)} hint="Obrigações em aberto" tone="down" />
        <Kpi icon={ListChecks} label="Tarefas abertas" value={loading ? "—" : String(tarefasAbertas)} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Atalhos rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <Atalho to="/app/lancamentos" icon={Wallet} title="Novo lançamento" desc="Registrar receita ou despesa." />
          <Atalho to="/app/fluxo-caixa" icon={TrendingUp} title="Fluxo de caixa" desc="Entradas e saídas projetadas." />
          <Atalho to="/app/clientes" icon={Users} title="Clientes" desc="Cadastro, dashboard e relatórios." />
          <Atalho to="/app/vendas" icon={ShoppingCart} title="Vendas" desc="Pedidos, NF-e e comissões." />
          <Atalho to="/app/estoque" icon={Package} title="Estoque" desc="Produtos e movimentações." />
          <Atalho to="/app/biblioteca" icon={Database} title="Biblioteca Inteligente" desc="Consultas e auditoria Amil/Databricks." />
          <Atalho to="/app/tarefas" icon={FileText} title="Tarefas" desc="Prazos e responsáveis." />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 flex items-center justify-between">
        <div>
          <div className="font-semibold">Precisa de mais capacidade?</div>
          <div className="text-sm text-muted-foreground">Conheça os planos e libere multiempresa, IA e suporte prioritário.</div>
        </div>
        <Button asChild><Link to="/planos">Ver planos</Link></Button>
      </div>
    </div>
  );
}

export default function AppIndex() {
  const { tipo, loading } = useTipoPessoa();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  if (loading || !userId) return <div className="h-40" />;

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {tipo === "PF" ? <HomePF userId={userId} /> : <HomePJ userId={userId} />}
    </div>
  );
}
