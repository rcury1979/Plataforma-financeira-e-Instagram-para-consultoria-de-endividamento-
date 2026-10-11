import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, ArrowDownCircle, Plus, Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { PageHeader, KpiCard, SectionCard, EmptyState } from "./_ui";
import { useOnline, saveSnapshot, loadSnapshot, formatSnapshotAge } from "@/pwa/offline";


type Lanc = { id: string; tipo: "receita" | "despesa"; descricao: string; valor: number; data: string; planejado: boolean };

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function shiftMonth(mes: string, delta: number) {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function FluxoCaixa() {
  const online = useOnline();
  const [items, setItems] = useState<Lanc[]>([]);
  const [mes, setMes] = useState(() => new Date().toISOString().slice(0, 7));
  const [snapshotAt, setSnapshotAt] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const key = `fluxo:${mes}`;
    const cached = loadSnapshot<Lanc[]>(key);
    if (cached) {
      setItems(cached.data);
      setSnapshotAt(cached.at);
    } else {
      setItems([]);
      setSnapshotAt(null);
    }
    (async () => {
      const inicio = `${mes}-01`;
      const [y, m] = mes.split("-").map(Number);
      const fim = new Date(y, m, 0).toISOString().slice(0, 10);
      const { data, error } = await (supabase as any)
        .from("lancamentos")
        .select("*")
        .eq("planejado", false)
        .gte("data", inicio).lte("data", fim)
        .order("data", { ascending: false });
      if (!error && data) {
        setItems(data as Lanc[]);
        setSnapshotAt(Date.now());
        saveSnapshot(key, data);
      }
      setLoaded(true);
    })();
  }, [mes]);


  const porDia = useMemo(() => {
    const map = new Map<string, { data: string; entradas: number; saidas: number; items: Lanc[] }>();
    for (const l of items) {
      const k = l.data;
      if (!map.has(k)) map.set(k, { data: k, entradas: 0, saidas: 0, items: [] });
      const g = map.get(k)!;
      if (l.tipo === "receita") g.entradas += Number(l.valor);
      else g.saidas += Number(l.valor);
      g.items.push(l);
    }
    return Array.from(map.values()).sort((a, b) => b.data.localeCompare(a.data));
  }, [items]);

  const totalEntradas = items.filter((i) => i.tipo === "receita").reduce((s, i) => s + Number(i.valor), 0);
  const totalSaidas = items.filter((i) => i.tipo === "despesa").reduce((s, i) => s + Number(i.valor), 0);
  const saldo = totalEntradas - totalSaidas;

  const chartData = useMemo(
    () => [...porDia].reverse().map((d) => ({ dia: d.data.slice(-2), Entradas: d.entradas, Saídas: d.saidas })),
    [porDia],
  );

  const mesLabel = new Date(mes + "-01T00:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-5">
      <PageHeader icon={Calendar} title="Fluxo de caixa" subtitle="Entradas e saídas por dia" />

      {!online && snapshotAt && (
        <div className="text-[11px] text-muted-foreground bg-muted/40 border border-border rounded-md px-3 py-1.5">
          Dados salvos {formatSnapshotAge(snapshotAt)} · offline
        </div>
      )}
      {!online && !snapshotAt && loaded && (
        <EmptyState
          icon={Calendar}
          title="Mês não disponível offline"
          description="Abra este mês uma vez conectado para poder consultá-lo offline."
        />
      )}


      {/* Month selector */}
      <Card className="p-2 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setMes(shiftMonth(mes, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium capitalize">{mesLabel}</div>
        <Button variant="ghost" size="icon" onClick={() => setMes(shiftMonth(mes, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <KpiCard icon={TrendingUp} label="Entradas" value={brl(totalEntradas)} tone="success" />
        <KpiCard icon={TrendingDown} label="Saídas" value={brl(totalSaidas)} tone="danger" />
        <KpiCard icon={Wallet} label="Saldo" value={brl(saldo)} tone={saldo >= 0 ? "primary" : "danger"} />
      </div>

      <SectionCard title="Resumo do mês" icon={Calendar}>
        {chartData.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => brl(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Entradas" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-6">Sem dados neste mês</div>
        )}
      </SectionCard>

      <Link to="/app/lancamentos"><Button className="w-full"><Plus className="h-4 w-4 mr-1" />Novo lançamento</Button></Link>

      {porDia.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Sem movimentações"
          description={`Nenhum lançamento em ${mesLabel}. Adicione entradas ou saídas para acompanhar seu fluxo.`}
          action={<Link to="/app/lancamentos"><Button size="sm"><Plus className="h-4 w-4 mr-1" />Adicionar</Button></Link>}
        />
      ) : (
        <div className="space-y-3">
          {porDia.map((d) => (
            <Card key={d.data} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold capitalize">
                  {new Date(d.data + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", weekday: "short" })}
                </div>
                <div className="text-xs tabular-nums">
                  <span className="text-[hsl(var(--success))]">+{brl(d.entradas)}</span>{" "}
                  <span className="text-destructive">-{brl(d.saidas)}</span>
                </div>
              </div>
              <div className="space-y-1">
                {d.items.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 text-xs">
                    {l.tipo === "receita" ? <ArrowUpCircle className="h-3 w-3 text-[hsl(var(--success))]" /> : <ArrowDownCircle className="h-3 w-3 text-destructive" />}
                    <span className="flex-1 truncate">{l.descricao}</span>
                    <span className={`tabular-nums ${l.tipo === "receita" ? "text-[hsl(var(--success))]" : "text-destructive"}`}>{brl(Number(l.valor))}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
