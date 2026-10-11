import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Wallet, AlertCircle, TrendingUp, Clock, Plus, Sparkles,
  UserPlus, Building2, Receipt, Package, Calendar, LineChart as LineIcon,
  Check, ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { PageHeader, KpiCard, SectionCard, EmptyState } from "./_ui";
import { Card } from "@/components/ui/card";
import { useOnline, saveSnapshot, loadSnapshot, formatSnapshotAge } from "@/pwa/offline";


type Lanc = { id: string; tipo: "receita" | "despesa"; valor: number; data: string; planejado: boolean };

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const passos = [
  { id: 1, icon: UserPlus, titulo: "Cadastre seu primeiro cliente", desc: "Base para começar a usar o R&M 360°.", to: "/app/clientes" },
  { id: 2, icon: Receipt, titulo: "Lance uma receita ou despesa", desc: "Comece a construir seu histórico financeiro.", to: "/app/lancamentos" },
  { id: 3, icon: Calendar, titulo: "Acompanhe o fluxo de caixa", desc: "Veja entradas e saídas de cada dia.", to: "/app/fluxo-caixa" },
  { id: 4, icon: LineIcon, titulo: "Projete os próximos meses", desc: "Simule cenários de 3, 6 ou 12 meses.", to: "/app/simuladores" },
  { id: 5, icon: Building2, titulo: "Organize suas tarefas", desc: "Não perca prazos e pendências.", to: "/app/tarefas" },
  { id: 6, icon: Package, titulo: "Configure seu plano", desc: "Garanta acesso após a avaliação gratuita.", to: "/app/mais" },
];

export default function Financeiro() {
  const online = useOnline();
  const [lancs, setLancs] = useState<Lanc[]>([]);
  const [clientesCount, setClientesCount] = useState(0);
  const [tarefasAbertas, setTarefasAbertas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [snapshotAt, setSnapshotAt] = useState<number | null>(null);

  useEffect(() => {
    const cached = loadSnapshot<{ lancs: Lanc[]; clientesCount: number; tarefasAbertas: number }>("financeiro");
    if (cached) {
      setLancs(cached.data.lancs);
      setClientesCount(cached.data.clientesCount);
      setTarefasAbertas(cached.data.tarefasAbertas);
      setSnapshotAt(cached.at);
      setLoading(false);
    }
    (async () => {
      try {
        const { data: l, error: e1 } = await (supabase as any).from("lancamentos").select("id,tipo,valor,data,planejado");
        if (e1) throw e1;
        const { count } = await supabase.from("clientes").select("*", { count: "exact", head: true });
        const { count: tc } = await (supabase as any).from("tarefas").select("*", { count: "exact", head: true }).neq("status", "concluida");
        const lancsData = (l ?? []) as Lanc[];
        setLancs(lancsData);
        setClientesCount(count ?? 0);
        setTarefasAbertas(tc ?? 0);
        setSnapshotAt(Date.now());
        saveSnapshot("financeiro", { lancs: lancsData, clientesCount: count ?? 0, tarefasAbertas: tc ?? 0 });
      } catch {
        // offline / falha: mantém cache
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  const stats = useMemo(() => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    let aReceber = 0, recebidoMes = 0, despesaMes = 0, total = 0, emAtraso = 0;
    const abertasNoMes: Lanc[] = [];
    for (const l of lancs) {
      const v = Number(l.valor) || 0;
      const d = new Date(l.data);
      if (l.tipo === "receita") {
        if (l.planejado) {
          if (d < hoje) emAtraso += v;
          else if (d <= fimMes) aReceber += v;
          if (d <= fimMes) abertasNoMes.push(l);
        }
        if (!l.planejado) { total += v; if (d >= inicioMes) recebidoMes += v; }
      } else {
        if (!l.planejado && d >= inicioMes) despesaMes += v;
      }
    }
    return { aReceber, recebidoMes, despesaMes, total, emAtraso, saldoMes: recebidoMes - despesaMes, abertasNoMes };
  }, [lancs]);


  const chartData = useMemo(() => {
    const hoje = new Date();
    const buckets: { mes: string; recebido: number; despesa: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const rec = lancs.filter((l) => !l.planejado && l.tipo === "receita" && l.data.startsWith(key)).reduce((s, l) => s + Number(l.valor), 0);
      const des = lancs.filter((l) => !l.planejado && l.tipo === "despesa" && l.data.startsWith(key)).reduce((s, l) => s + Number(l.valor), 0);
      buckets.push({ mes: d.toLocaleDateString("pt-BR", { month: "short" }), recebido: rec, despesa: des });
    }
    return buckets;
  }, [lancs]);

  const done = [
    clientesCount > 0,
    lancs.some((l) => !l.planejado),
    lancs.length > 0,
    lancs.some((l) => l.planejado),
    tarefasAbertas > 0,
    false,
  ];
  const passosConcluidos = done.filter(Boolean).length;

  const hasChartData = chartData.some((c) => c.recebido || c.despesa);

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Wallet}
        title="Financeiro"
        subtitle={`Visão geral · ${new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`}
      />

      {!online && snapshotAt && (
        <div className="text-[11px] text-muted-foreground bg-muted/40 border border-border rounded-md px-3 py-1.5">
          Dados salvos {formatSnapshotAge(snapshotAt)} · offline
        </div>
      )}
      {!online && !snapshotAt && !loading && (
        <EmptyState
          icon={Wallet}
          title="Sem dados salvos"
          description="Você está offline e ainda não abriu esta tela conectado. Reconecte para carregar seu financeiro."
        />
      )}


      {/* Onboarding — trilha horizontal com passo atual em destaque */}
      {passosConcluidos < passos.length && (() => {
        const proxIdx = done.findIndex(d => !d);
        const proximo = passos[proxIdx];
        const PIcon = proximo.icon;
        return (
          <Card className="overflow-hidden border-primary/20">
            <div className="px-4 pt-4 pb-3 border-b border-border/50 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-primary/80">Sua trilha</div>
                <div className="font-serif text-lg leading-tight mt-0.5">Comece pelo essencial</div>
              </div>
              <div className="text-right">
                <div className="font-serif text-2xl leading-none text-primary">{passosConcluidos}<span className="text-muted-foreground/60">/{passos.length}</span></div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">passos</div>
              </div>
            </div>

            {/* Trilha de círculos conectados */}
            <div className="px-4 py-4">
              <div className="relative flex items-center justify-between">
                <div className="absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-border" />
                <div
                  className="absolute left-3 top-1/2 h-px -translate-y-1/2 bg-primary transition-all"
                  style={{ width: `calc((100% - 1.5rem) * ${passosConcluidos / (passos.length - 1)})` }}
                />
                {passos.map((p, i) => {
                  const isDone = done[i];
                  const isCurrent = i === proxIdx;
                  return (
                    <Link
                      key={p.id}
                      to={p.to}
                      aria-label={p.titulo}
                      className={`relative z-10 flex items-center justify-center rounded-full transition ${
                        isCurrent
                          ? "h-7 w-7 bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : isDone
                          ? "h-6 w-6 bg-primary/90 text-primary-foreground"
                          : "h-6 w-6 bg-card border border-border text-muted-foreground"
                      }`}
                    >
                      {isDone ? <Check className="h-3 w-3" /> : <span className="text-[10px] font-semibold">{i + 1}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Passo atual — CTA destacado */}
            <Link
              to={proximo.to}
              className="group flex items-center gap-3 mx-3 mb-3 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/25 p-3 hover:border-primary/50 transition"
            >
              <div className="h-11 w-11 shrink-0 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
                <PIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-primary/80">Próximo passo · {proxIdx + 1}</div>
                <div className="font-serif text-[15px] leading-tight mt-0.5 truncate">{proximo.titulo}</div>
                <div className="text-xs text-muted-foreground truncate">{proximo.desc}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-primary shrink-0 group-hover:translate-x-0.5 transition" />
            </Link>
          </Card>
        );
      })()}

      {/* Progresso do mês */}
      <Card className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold capitalize">
            Progresso de {new Date().toLocaleDateString("pt-BR", { month: "long" })}
          </div>
          <div className="text-xs text-muted-foreground">
            {stats.abertasNoMes.length === 0
              ? "Nenhum pagamento esperado para este mês."
              : `${stats.abertasNoMes.length} ${stats.abertasNoMes.length === 1 ? "pagamento esperado" : "pagamentos esperados"} até o fim do mês.`}
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard icon={Wallet} label="A receber" value={brl(stats.aReceber)} tone="primary" />
        <KpiCard icon={AlertCircle} label="Em atraso" value={brl(stats.emAtraso)} tone="danger" />
        <KpiCard icon={TrendingUp} label="Recebido este mês" value={brl(stats.recebidoMes)} tone="success" />
        <KpiCard icon={Clock} label="Faturamento total" value={brl(stats.total)} />
      </div>


      {/* Chart */}
      <SectionCard title="Evolução — últimos 12 meses" icon={TrendingUp}>
        {loading ? (
          <div className="h-56 animate-pulse bg-muted/40 rounded" />
        ) : hasChartData ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => brl(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="recebido" name="Recebido" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="despesa" name="Despesa" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="Sem dados para o gráfico"
            description="Adicione lançamentos para visualizar a evolução mês a mês."
            action={
              <Link to="/app/lancamentos">
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />Primeiro lançamento</Button>
              </Link>
            }
          />
        )}
      </SectionCard>

      {/* A receber até o fim do mês */}
      <SectionCard title={`A receber até o fim de ${new Date().toLocaleDateString("pt-BR", { month: "long" })}`} icon={Calendar}>
        {stats.abertasNoMes.length === 0 ? (
          <div className="border border-dashed rounded-lg p-6 flex flex-col items-center text-center">
            <div className="h-10 w-10 rounded-full border-2 border-[hsl(var(--success))] flex items-center justify-center mb-3">
              <Check className="h-5 w-5 text-[hsl(var(--success))]" />
            </div>
            <div className="text-sm font-medium">Nenhuma parcela em aberto até o fim do mês</div>
            <div className="text-xs text-muted-foreground mt-1">
              Tudo em dia. Os próximos recebimentos aparecerão aqui automaticamente.
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Clique numa parcela para registrar o recebimento em <Link to="/app/lancamentos" className="text-primary hover:underline">Lançamentos</Link>.
          </p>
        )}
      </SectionCard>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2">
        <Link to="/app/lancamentos">
          <Button className="w-full" size="lg"><Plus className="h-4 w-4 mr-1" />Lançamento</Button>
        </Link>
        <Link to="/app/fluxo-caixa">
          <Button className="w-full" size="lg" variant="outline">
            <Calendar className="h-4 w-4 mr-1" />Fluxo diário
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

