import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Wallet, Target, TrendingDown, PiggyBank, Plus, TrendingUp, Sparkles, Heart, Trophy, Compass, Filter, X } from "lucide-react";
import PFOnboarding, { isPFOnboarded } from "./PFOnboarding";

const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Mensagens acolhedoras rotativas — quase todas em primeira pessoa da mentora
const MENSAGENS_MARTINIANA = [
  "Você não está sozinho(a) nessa. Um dia de cada vez.",
  "Cada centavo registrado é um passo pra fora da confusão.",
  "Dinheiro organizado é paz de espírito. Vamos juntos.",
  "Não é sobre ter muito — é sobre ter clareza.",
  "Sua história financeira pode começar diferente hoje.",
  "Coragem pra olhar. Estratégia pra mudar. Fé pra continuar.",
];

function saudacao(nome: string) {
  const h = new Date().getHours();
  const parte = h < 5 ? "Boa madrugada" : h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  const primeiroNome = (nome || "").trim().split(" ")[0];
  return primeiroNome ? `${parte}, ${primeiroNome}` : parte;
}

export default function PFDashboard() {
  const [patrimonio, setPatrimonio] = useState(0);
  const [dividas, setDividas] = useState(0);
  const [dividasQuitadas, setDividasQuitadas] = useState(0);
  const [metas, setMetas] = useState<any[]>([]);
  const [metasConcluidas, setMetasConcluidas] = useState(0);
  const [txRecentes, setTxRecentes] = useState<any[]>([]); // últimos ~60 dias, todos os campos
  const [nome, setNome] = useState("");
  const [diaJornada, setDiaJornada] = useState(1);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [catsSelecionadas, setCatsSelecionadas] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Profile pro nome + dia da jornada
      const { data: prof } = await (supabase as any).from("profiles").select("full_name,created_at").eq("user_id", user.id).maybeSingle();
      setNome(prof?.full_name || "");
      const inicio = prof?.created_at ? new Date(prof.created_at) : new Date(user.created_at);
      const dias = Math.max(1, Math.floor((Date.now() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      setDiaJornada(dias);

      // Onboarding
      if (!isPFOnboarded()) setShowOnboarding(true);

      // Janela ampla pra alimentar totais do mês + últimas transações
      const janela = new Date();
      janela.setDate(janela.getDate() - 60);
      const janelaStr = janela.toISOString().slice(0, 10);

      const [tx, pat, div, divQuit, met, metConc] = await Promise.all([
        (supabase as any).from("pf_transacoes").select("*").eq("user_id", user.id).gte("data", janelaStr).order("data", { ascending: false }),
        (supabase as any).from("pf_patrimonio").select("valor_atual").eq("user_id", user.id),
        (supabase as any).from("pf_dividas").select("valor_total,valor_pago").eq("user_id", user.id).eq("quitada", false),
        (supabase as any).from("pf_dividas").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("quitada", true),
        (supabase as any).from("pf_metas_pessoais").select("*").eq("user_id", user.id).eq("concluida", false).order("prazo", { ascending: true }).limit(3),
        (supabase as any).from("pf_metas_pessoais").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("concluida", true),
      ]);

      setTxRecentes(tx.data || []);
      setPatrimonio((pat.data || []).reduce((s: number, r: any) => s + Number(r.valor_atual), 0));
      setDividas((div.data || []).reduce((s: number, r: any) => s + (Number(r.valor_total) - Number(r.valor_pago)), 0));
      setDividasQuitadas(divQuit.count || 0);
      setMetas(met.data || []);
      setMetasConcluidas(metConc.count || 0);
    })();
  }, []);

  // Corte do mês atual
  const inicioMesStr = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  }, []);

  // Categorias disponíveis (do mês)
  const categoriasDoMes = useMemo(() => {
    const s = new Set<string>();
    txRecentes.forEach((t) => { if (t.data >= inicioMesStr && t.categoria) s.add(t.categoria); });
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [txRecentes, inicioMesStr]);

  // Aplica filtro de categorias
  const passaFiltro = (t: any) => catsSelecionadas.size === 0 || catsSelecionadas.has(t.categoria);

  // Totais do mês (com filtro)
  const { receitas, despesas, totalLancamentosMes } = useMemo(() => {
    const doMes = txRecentes.filter((t) => t.data >= inicioMesStr && passaFiltro(t));
    return {
      receitas: doMes.filter((r) => r.tipo === "receita").reduce((s, r) => s + Number(r.valor), 0),
      despesas: doMes.filter((r) => r.tipo === "despesa").reduce((s, r) => s + Number(r.valor), 0),
      totalLancamentosMes: doMes.length,
    };
  }, [txRecentes, inicioMesStr, catsSelecionadas]);

  // Últimas transações (com filtro)
  const ultimas = useMemo(() => txRecentes.filter(passaFiltro).slice(0, 5), [txRecentes, catsSelecionadas]);

  const toggleCat = (c: string) => {
    setCatsSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });
  };
  const limparFiltros = () => setCatsSelecionadas(new Set());

  const saldo = receitas - despesas;
  const patrimonioLiquido = patrimonio - dividas;
  const mensagem = useMemo(() => MENSAGENS_MARTINIANA[diaJornada % MENSAGENS_MARTINIANA.length], [diaJornada]);
  const filtroAtivo = catsSelecionadas.size > 0;

  // Próximo passo sugerido (heurística acolhedora)
  const proximoPasso = useMemo(() => {
    if (totalLancamentosMes === 0 && !filtroAtivo) return { titulo: "Registre seu primeiro lançamento do mês", desc: "Escrever é o primeiro ato de organizar. Sem julgamento.", to: "/app/pf/transacoes", icon: Wallet };
    if (metas.length === 0) return { titulo: "Defina seu primeiro sonho", desc: "Sem meta, o dinheiro vaza. Escolha algo que faz seus olhos brilharem.", to: "/app/pf/metas", icon: Target };
    if (dividas > 0) return { titulo: "Atualize suas dívidas", desc: "Enxergar o total é o primeiro passo pra sair. Coragem.", to: "/app/pf/dividas", icon: TrendingDown };
    if (patrimonio === 0) return { titulo: "Cadastre seus bens e reservas", desc: "Você tem mais do que imagina. Vamos organizar.", to: "/app/pf/patrimonio", icon: PiggyBank };
    return { titulo: "Revise sua evolução do mês", desc: "Compare com o mês passado. Celebre o progresso.", to: "/app/pf/evolucao", icon: TrendingUp };
  }, [totalLancamentosMes, metas.length, dividas, patrimonio, filtroAtivo]);

  const temVitoria = dividasQuitadas > 0 || metasConcluidas > 0 || (saldo > 0 && totalLancamentosMes > 0);

  return (
    <div className="space-y-5">
      {showOnboarding && <PFOnboarding nome={nome} onClose={() => setShowOnboarding(false)} />}

      {/* Header acolhedor */}
      <div className="relative overflow-hidden rounded-3xl gradient-warm p-6 text-primary-foreground shadow-warm">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80">
            <Compass className="h-3.5 w-3.5" /> Dia {diaJornada} da sua jornada
          </div>
          <h1 className="font-serif text-2xl mt-2">{saudacao(nome)} 💛</h1>
          <p className="text-sm opacity-90 mt-1 italic">"{mensagem}"</p>
          <p className="text-[11px] opacity-70 mt-1">— Marta Cury</p>
        </div>
      </div>

      {/* Próximo passo — a bússola */}
      <NavLink to={proximoPasso.to} className="block">
        <Card className="p-4 border-primary/30 bg-primary/5 hover:bg-primary/10 transition">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl gradient-warm grid place-items-center shrink-0 shadow-warm">
              <proximoPasso.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-primary font-semibold">Seu próximo passo</div>
              <div className="text-sm font-semibold mt-0.5">{proximoPasso.titulo}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{proximoPasso.desc}</div>
            </div>
            <div className="text-primary">→</div>
          </div>
        </Card>
      </NavLink>

      {/* Celebração — só aparece se tem vitória */}
      {temVitoria && (
        <Card className="p-4 border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
            <Trophy className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Suas vitórias</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {saldo > 0 && totalLancamentosMes > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                🎉 Saldo positivo de {BRL(saldo)} este mês
              </span>
            )}
            {dividasQuitadas > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                ✨ {dividasQuitadas} dívida{dividasQuitadas > 1 ? "s" : ""} quitada{dividasQuitadas > 1 ? "s" : ""}
              </span>
            )}
            {metasConcluidas > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                🏆 {metasConcluidas} sonho{metasConcluidas > 1 ? "s" : ""} realizado{metasConcluidas > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Filtro por categorias */}
      {categoriasDoMes.length > 0 && (
        <Card className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Filtrar por categoria
              {filtroAtivo && (
                <span className="ml-1 rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[10px]">
                  {catsSelecionadas.size} selecionada{catsSelecionadas.size > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {filtroAtivo && (
              <button onClick={limparFiltros} className="flex items-center gap-1 text-[11px] text-primary hover:underline">
                <X className="h-3 w-3" /> Limpar
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categoriasDoMes.map((c) => {
              const on = catsSelecionadas.has(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCat(c)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition ${on ? "gradient-warm text-primary-foreground border-transparent shadow-sm" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"}`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Saldo do mês */}
      <Card className="p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Como estou este mês {filtroAtivo && <span className="text-primary normal-case tracking-normal">· filtrado</span>}
        </div>
        <div className={`text-3xl font-semibold mt-1 ${saldo >= 0 ? "text-emerald-500" : "text-destructive"}`}>
          {BRL(saldo)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {totalLancamentosMes === 0
            ? "Ainda sem lançamentos — comece registrando."
            : saldo >= 0
            ? "Você está no controle. Continue firme."
            : "Sem drama — vamos entender e ajustar juntos."}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            <div>
              <div className="text-muted-foreground text-xs">Entrou</div>
              <div className="font-medium">{BRL(receitas)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ArrowDownRight className="h-4 w-4 text-destructive" />
            <div>
              <div className="text-muted-foreground text-xs">Saiu</div>
              <div className="font-medium">{BRL(despesas)}</div>
            </div>
          </div>
        </div>
        <NavLink to="/app/pf/evolucao" className="mt-4 flex items-center justify-between text-xs text-primary hover:underline">
          <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Ver minha evolução</span>
          <span>→</span>
        </NavLink>
      </Card>

      {/* KPIs patrimoniais */}
      <div className="grid grid-cols-2 gap-3">
        <NavLink to="/app/pf/patrimonio">
          <Card className="p-4 h-full">
            <PiggyBank className="h-4 w-4 text-primary mb-2" />
            <div className="text-xs text-muted-foreground">O que é meu</div>
            <div className="text-lg font-semibold">{BRL(patrimonioLiquido)}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Bens {BRL(patrimonio)}</div>
          </Card>
        </NavLink>
        <NavLink to="/app/pf/dividas">
          <Card className="p-4 h-full">
            <Heart className="h-4 w-4 text-destructive mb-2" />
            <div className="text-xs text-muted-foreground">A libertar</div>
            <div className="text-lg font-semibold">{BRL(dividas)}</div>
            <div className="text-[11px] text-primary mt-0.5">Ver meu plano →</div>
          </Card>
        </NavLink>
      </div>

      {/* Metas */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Meus sonhos em construção</h2>
          <NavLink to="/app/pf/metas" className="text-xs text-primary hover:underline">Ver todos</NavLink>
        </div>
        {metas.length === 0 ? (
          <Card className="p-4 text-sm text-center">
            <Target className="h-6 w-6 mx-auto mb-2 text-primary/60" />
            <p className="text-muted-foreground">Nenhum sonho definido ainda.</p>
            <NavLink to="/app/pf/metas" className="text-primary hover:underline text-xs mt-1 inline-block">Escolher meu primeiro sonho →</NavLink>
          </Card>
        ) : (
          <div className="space-y-2">
            {metas.map((m) => {
              const pct = Math.min(100, (Number(m.valor_atual) / Number(m.valor_alvo)) * 100);
              return (
                <Card key={m.id} className="p-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{m.titulo}</span>
                    <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                    <div className="h-full gradient-warm" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    {BRL(Number(m.valor_atual))} de {BRL(Number(m.valor_alvo))}
                    {pct >= 100 && <span className="ml-2 text-emerald-500">🎉 Realizado!</span>}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Últimas transações */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> Últimos passos</h2>
          <NavLink to="/app/pf/transacoes" className="text-xs text-primary hover:underline">Ver todos</NavLink>
        </div>
        {ultimas.length === 0 ? (
          <Card className="p-4 text-sm text-muted-foreground text-center">
            Nenhum lançamento ainda. Coragem: escrever é o primeiro passo pra mudar.
          </Card>
        ) : (
          <Card className="divide-y">
            {ultimas.map((t) => (
              <div key={t.id} className="flex justify-between items-center p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{t.descricao || t.categoria}</div>
                  <div className="text-[11px] text-muted-foreground">{t.categoria} · {new Date(t.data).toLocaleDateString("pt-BR")}</div>
                </div>
                <div className={`text-sm font-semibold ${t.tipo === "receita" ? "text-emerald-500" : "text-destructive"}`}>
                  {t.tipo === "receita" ? "+" : "−"} {BRL(Number(t.valor))}
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>

      <NavLink
        to="/app/pf/transacoes"
        className="fixed bottom-20 right-4 h-12 w-12 rounded-full gradient-warm text-primary-foreground shadow-warm flex items-center justify-center hover:scale-105 transition"
        aria-label="Novo lançamento"
      >
        <Plus className="h-5 w-5" />
      </NavLink>
    </div>
  );
}
