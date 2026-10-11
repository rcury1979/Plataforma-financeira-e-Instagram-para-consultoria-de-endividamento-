import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import {
  ArrowDownRight, ArrowUpRight, Minus, PiggyBank, Target, TrendingDown,
  TrendingUp, Wallet, Calendar as CalendarIcon, Download, FileText, FileSpreadsheet,
  StickyNote, Save, Trash2, Loader2,
} from "lucide-react";

const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const BRLFull = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const MONTHS_PT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const PIE_COLORS = ["hsl(var(--primary))", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"];

type Preset = "3m" | "6m" | "12m" | "24m" | "custom";

function ymKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function labelMes(d: Date) {
  return `${MONTHS_PT[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;
}
function labelMesFull(k: string) {
  const [y, m] = k.split("-");
  return `${MONTHS_PT[Number(m) - 1]}/${y}`;
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59); }

export default function PFEvolucao() {
  const [preset, setPreset] = useState<Preset>("6m");
  const [dataInicio, setDataInicio] = useState<Date>(() => { const d = new Date(); d.setMonth(d.getMonth() - 5); return startOfMonth(d); });
  const [dataFim, setDataFim] = useState<Date>(() => endOfMonth(new Date()));

  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [patrimonio, setPatrimonio] = useState<any[]>([]);
  const [dividas, setDividas] = useState<any[]>([]);
  const [metas, setMetas] = useState<any[]>([]);
  const [notas, setNotas] = useState<Record<string, { id?: string; nota: string }>>({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<null | "pdf" | "csv">(null);

  const dashboardRef = useRef<HTMLDivElement>(null);

  // Sync preset → datas
  useEffect(() => {
    if (preset === "custom") return;
    const meses = { "3m": 3, "6m": 6, "12m": 12, "24m": 24 }[preset] as number;
    const ini = new Date();
    ini.setMonth(ini.getMonth() - (meses - 1));
    setDataInicio(startOfMonth(ini));
    setDataFim(endOfMonth(new Date()));
  }, [preset]);

  // Load
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const inicioStr = dataInicio.toISOString().slice(0, 10);
      const fimStr = dataFim.toISOString().slice(0, 10);

      const [tx, pat, div, met, nt] = await Promise.all([
        (supabase as any).from("pf_transacoes").select("tipo,valor,categoria,data").eq("user_id", user.id).gte("data", inicioStr).lte("data", fimStr).order("data", { ascending: true }),
        (supabase as any).from("pf_patrimonio").select("valor_atual,created_at").eq("user_id", user.id),
        (supabase as any).from("pf_dividas").select("valor_total,valor_pago,created_at,quitada").eq("user_id", user.id),
        (supabase as any).from("pf_metas_pessoais").select("titulo,valor_atual,valor_alvo,concluida,prazo").eq("user_id", user.id),
        (supabase as any).from("pf_notas_mensais").select("id,ano_mes,nota").eq("user_id", user.id),
      ]);

      setTransacoes(tx.data || []);
      setPatrimonio(pat.data || []);
      setDividas(div.data || []);
      setMetas(met.data || []);
      const nmap: Record<string, { id: string; nota: string }> = {};
      (nt.data || []).forEach((r: any) => { nmap[r.ano_mes] = { id: r.id, nota: r.nota }; });
      setNotas(nmap);
      setLoading(false);
    })();
  }, [dataInicio, dataFim]);

  const meses = useMemo(() => {
    const arr: { key: string; label: string; date: Date }[] = [];
    const start = startOfMonth(dataInicio);
    const end = startOfMonth(dataFim);
    const cur = new Date(start);
    while (cur <= end) {
      arr.push({ key: ymKey(cur), label: labelMes(cur), date: new Date(cur) });
      cur.setMonth(cur.getMonth() + 1);
    }
    return arr;
  }, [dataInicio, dataFim]);

  const serieRD = useMemo(() => {
    const map = new Map(meses.map((m) => [m.key, { key: m.key, mes: m.label, receitas: 0, despesas: 0, saldo: 0 }]));
    for (const t of transacoes) {
      const k = ymKey(new Date(t.data));
      const row = map.get(k);
      if (!row) continue;
      const v = Number(t.valor) || 0;
      if (t.tipo === "receita") row.receitas += v;
      else if (t.tipo === "despesa") row.despesas += v;
    }
    let acc = 0;
    return Array.from(map.values()).map((r) => {
      r.saldo = r.receitas - r.despesas;
      acc += r.saldo;
      return { ...r, acumulado: acc };
    });
  }, [transacoes, meses]);

  const comparativo = useMemo(() => {
    const atual = serieRD[serieRD.length - 1];
    const anterior = serieRD[serieRD.length - 2];
    const calc = (a?: number, b?: number) => {
      const av = Number(a || 0); const bv = Number(b || 0);
      if (bv === 0) return av === 0 ? 0 : 100;
      return ((av - bv) / Math.abs(bv)) * 100;
    };
    return {
      atual, anterior,
      varReceitas: calc(atual?.receitas, anterior?.receitas),
      varDespesas: calc(atual?.despesas, anterior?.despesas),
      varSaldo: calc(atual?.saldo, anterior?.saldo),
    };
  }, [serieRD]);

  const seriePatrimonio = useMemo(() => {
    return meses.map((m) => {
      const fim = endOfMonth(m.date);
      const bens = patrimonio.filter((p) => new Date(p.created_at) <= fim).reduce((s, p) => s + Number(p.valor_atual || 0), 0);
      const dv = dividas.filter((d) => new Date(d.created_at) <= fim && !d.quitada).reduce((s, d) => s + (Number(d.valor_total || 0) - Number(d.valor_pago || 0)), 0);
      return { mes: m.label, bens, dividas: dv, liquido: bens - dv };
    });
  }, [meses, patrimonio, dividas]);

  const progressoMetas = useMemo(() => {
    return metas.filter((m) => !m.concluida).slice(0, 8).map((m) => ({
      nome: m.titulo?.length > 22 ? m.titulo.slice(0, 22) + "…" : m.titulo,
      pct: Math.min(100, Math.round((Number(m.valor_atual) / Math.max(1, Number(m.valor_alvo))) * 100)),
    }));
  }, [metas]);

  const despesasCategoria = useMemo(() => {
    const agg = new Map<string, number>();
    for (const t of transacoes) {
      if (t.tipo !== "despesa") continue;
      const c = t.categoria || "Outros";
      agg.set(c, (agg.get(c) || 0) + Number(t.valor || 0));
    }
    return Array.from(agg.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [transacoes]);

  const totalDespesasPeriodo = despesasCategoria.reduce((s, r) => s + r.value, 0);

  // ---- Salvar nota ----
  async function salvarNota(anoMes: string, texto: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const existing = notas[anoMes];
    if (!texto.trim()) {
      if (existing?.id) {
        await (supabase as any).from("pf_notas_mensais").delete().eq("id", existing.id);
        setNotas((n) => { const c = { ...n }; delete c[anoMes]; return c; });
        toast.success("Nota removida");
      }
      return;
    }
    if (existing?.id) {
      const { error } = await (supabase as any).from("pf_notas_mensais").update({ nota: texto }).eq("id", existing.id);
      if (error) { toast.error("Erro ao salvar"); return; }
      setNotas((n) => ({ ...n, [anoMes]: { ...existing, nota: texto } }));
    } else {
      const { data, error } = await (supabase as any).from("pf_notas_mensais").insert({ user_id: user.id, ano_mes: anoMes, nota: texto }).select().single();
      if (error) { toast.error("Erro ao salvar"); return; }
      setNotas((n) => ({ ...n, [anoMes]: { id: data.id, nota: texto } }));
    }
    toast.success("Nota salva");
  }

  // ---- Export CSV ----
  function exportarCSV() {
    setExporting("csv");
    try {
      const lines: string[] = [];
      lines.push("Dashboard de Evolução - R&M 360°");
      lines.push(`Período,${format(dataInicio, "dd/MM/yyyy")} até ${format(dataFim, "dd/MM/yyyy")}`);
      lines.push("");
      lines.push("Mês,Receitas,Despesas,Saldo do mês,Saldo acumulado,Bens,Dívidas,Patrimônio líquido,Nota");
      serieRD.forEach((r, i) => {
        const p = seriePatrimonio[i];
        const nota = (notas[r.key]?.nota || "").replace(/"/g, '""').replace(/\n/g, " ");
        lines.push([
          r.mes, r.receitas.toFixed(2), r.despesas.toFixed(2), r.saldo.toFixed(2), r.acumulado.toFixed(2),
          (p?.bens || 0).toFixed(2), (p?.dividas || 0).toFixed(2), (p?.liquido || 0).toFixed(2),
          `"${nota}"`,
        ].join(","));
      });
      lines.push("");
      lines.push("Despesas por categoria (período)");
      lines.push("Categoria,Valor,% do total");
      despesasCategoria.forEach((c) => {
        const pct = totalDespesasPeriodo ? (c.value / totalDespesasPeriodo) * 100 : 0;
        lines.push(`${c.name},${c.value.toFixed(2)},${pct.toFixed(1)}%`);
      });
      lines.push("");
      lines.push("Metas em andamento");
      lines.push("Meta,Progresso %");
      progressoMetas.forEach((m) => lines.push(`${m.nome},${m.pct}%`));

      const csv = "\uFEFF" + lines.join("\n"); // BOM para Excel
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `evolucao-${format(dataInicio, "yyyy-MM")}-a-${format(dataFim, "yyyy-MM")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exportado");
    } catch (e) {
      toast.error("Erro ao exportar CSV");
    } finally {
      setExporting(null);
    }
  }

  // ---- Export PDF ----
  async function exportarPDF() {
    if (!dashboardRef.current) return;
    setExporting("pdf");
    try {
      const [{ default: html2canvas }, jspdfMod] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const jsPDF = (jspdfMod as any).jsPDF || (jspdfMod as any).default;

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // Cabeçalho
      pdf.setFontSize(16); pdf.setTextColor(40);
      pdf.text("Dashboard de Evolução - R&M 360°", 10, 12);
      pdf.setFontSize(10); pdf.setTextColor(100);
      pdf.text(`Período: ${format(dataInicio, "dd/MM/yyyy")} a ${format(dataFim, "dd/MM/yyyy")}`, 10, 18);
      pdf.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 10, 23);

      const imgW = pageW - 20;
      const imgH = (canvas.height * imgW) / canvas.width;
      let y = 28;
      let heightLeft = imgH;
      pdf.addImage(imgData, "PNG", 10, y, imgW, imgH);
      heightLeft -= (pageH - y);
      while (heightLeft > 0) {
        pdf.addPage();
        y = -(imgH - heightLeft);
        pdf.addImage(imgData, "PNG", 10, y, imgW, imgH);
        heightLeft -= pageH;
      }
      pdf.save(`evolucao-${format(dataInicio, "yyyy-MM")}-a-${format(dataFim, "yyyy-MM")}.pdf`);
      toast.success("PDF exportado");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar PDF");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Header + filtros */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-serif">Minha evolução</h1>
            <p className="text-sm text-muted-foreground">Sua saúde financeira ao longo do tempo.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={exportarCSV} disabled={!!exporting}>
              {exporting === "csv" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
              <span className="ml-1.5 hidden sm:inline">CSV</span>
            </Button>
            <Button size="sm" variant="outline" onClick={exportarPDF} disabled={!!exporting}>
              {exporting === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              <span className="ml-1.5 hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>

        {/* Presets + custom */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-muted rounded-full p-0.5 text-xs">
            {(["3m", "6m", "12m", "24m"] as Preset[]).map((p) => (
              <button
                key={p}
                onClick={() => setPreset(p)}
                className={cn(
                  "px-3 py-1.5 rounded-full transition",
                  preset === p ? "bg-background shadow font-medium" : "text-muted-foreground"
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPreset("custom")}
              className={cn(
                "px-3 py-1.5 rounded-full transition flex items-center gap-1",
                preset === "custom" ? "bg-background shadow font-medium" : "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-3 w-3" /> Custom
            </button>
          </div>
          {preset === "custom" && (
            <div className="flex items-center gap-1.5 text-xs">
              <DatePop label="De" value={dataInicio} onChange={(d) => setDataInicio(startOfMonth(d))} />
              <span className="text-muted-foreground">→</span>
              <DatePop label="Até" value={dataFim} onChange={(d) => setDataFim(endOfMonth(d))} />
            </div>
          )}
          <div className="text-[11px] text-muted-foreground ml-auto">
            {meses.length} {meses.length === 1 ? "mês" : "meses"}
          </div>
        </div>
      </div>

      {/* Área capturada pelo PDF */}
      <div ref={dashboardRef} className="space-y-5 bg-background">
        {/* Comparativo */}
        <div className="grid grid-cols-3 gap-2">
          <ComparaCard label="Receitas" atual={comparativo.atual?.receitas || 0} pct={comparativo.varReceitas} positivoBom />
          <ComparaCard label="Despesas" atual={comparativo.atual?.despesas || 0} pct={comparativo.varDespesas} positivoBom={false} />
          <ComparaCard label="Saldo" atual={comparativo.atual?.saldo || 0} pct={comparativo.varSaldo} positivoBom />
        </div>

        {/* Receitas × Despesas */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium">Receitas × Despesas</h2>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serieRD} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => BRL(v)} />
                <Tooltip formatter={(v: any) => BRLFull(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Saldo acumulado */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium">Saldo acumulado</h2>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serieRD} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-saldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => BRL(v)} />
                <Tooltip formatter={(v: any) => BRLFull(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="acumulado" name="Acumulado" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#grad-saldo)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Patrimônio líquido */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <PiggyBank className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium">Patrimônio líquido</h2>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={seriePatrimonio} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => BRL(v)} />
                <Tooltip formatter={(v: any) => BRLFull(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="bens" name="Bens" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="dividas" name="Dívidas" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="liquido" name="Líquido" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Despesas por categoria */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium">Despesas por categoria <span className="text-muted-foreground font-normal">· período</span></h2>
          </div>
          {despesasCategoria.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">Sem despesas no período.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={despesasCategoria} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                      {despesasCategoria.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => BRLFull(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {despesasCategoria.map((c, i) => {
                  const pct = totalDespesasPeriodo ? (c.value / totalDespesasPeriodo) * 100 : 0;
                  return (
                    <div key={c.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="truncate">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
                        <span className="font-medium">{BRL(c.value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Metas */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium">Progresso das metas</h2>
          </div>
          {progressoMetas.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">Nenhuma meta em andamento.</div>
          ) : (
            <div className="space-y-3">
              {progressoMetas.map((m) => (
                <div key={m.nome}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium truncate">{m.nome}</span>
                    <span className="text-muted-foreground">{m.pct}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${m.pct}%`, background: m.pct >= 100 ? "#10b981" : "hsl(var(--primary))" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Notas mensais */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-medium">Anotações mensais <span className="text-muted-foreground font-normal">· contexto por mês</span></h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Registre o que explica cada mês (ex: "13º recebido", "gastos altos por férias"). As notas aparecem no PDF e CSV.
          </p>
          <div className="space-y-2">
            {[...serieRD].reverse().map((r) => (
              <NotaLinha
                key={r.key}
                label={labelMesFull(r.key)}
                receitas={r.receitas}
                despesas={r.despesas}
                saldo={r.saldo}
                notaInicial={notas[r.key]?.nota || ""}
                onSave={(txt) => salvarNota(r.key, txt)}
              />
            ))}
          </div>
        </Card>
      </div>

      {loading && (
        <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Carregando…
        </div>
      )}
    </div>
  );
}

/* ---------------- subcomponentes ---------------- */

function DatePop({ label, value, onChange }: { label: string; value: Date; onChange: (d: Date) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 font-normal">
          <span className="text-muted-foreground">{label}:</span>
          <span>{format(value, "MMM/yy", { locale: ptBR })}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={(d) => d && onChange(d)} initialFocus className={cn("p-3 pointer-events-auto")} locale={ptBR} />
      </PopoverContent>
    </Popover>
  );
}

function ComparaCard({ label, atual, pct, positivoBom }: { label: string; atual: number; pct: number; positivoBom: boolean }) {
  const subiu = pct > 0.5; const desceu = pct < -0.5;
  const bom = (subiu && positivoBom) || (desceu && !positivoBom);
  const ruim = (subiu && !positivoBom) || (desceu && positivoBom);
  const Icon = subiu ? ArrowUpRight : desceu ? ArrowDownRight : Minus;
  const cor = bom ? "text-emerald-500" : ruim ? "text-destructive" : "text-muted-foreground";
  return (
    <Card className="p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-base font-semibold mt-0.5 truncate">{BRL(atual)}</div>
      <div className={`flex items-center gap-1 text-[11px] mt-1 ${cor}`}>
        <Icon className="h-3 w-3" />
        <span>{Math.abs(pct).toFixed(0)}% vs mês ant.</span>
      </div>
    </Card>
  );
}

function NotaLinha({
  label, receitas, despesas, saldo, notaInicial, onSave,
}: { label: string; receitas: number; despesas: number; saldo: number; notaInicial: string; onSave: (txt: string) => Promise<void> | void }) {
  const [texto, setTexto] = useState(notaInicial);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const dirty = texto !== notaInicial;

  useEffect(() => { setTexto(notaInicial); }, [notaInicial]);

  async function handleSave() {
    setSaving(true); await onSave(texto); setSaving(false);
  }

  return (
    <div className="rounded-lg border border-border p-3 hover:bg-muted/30 transition">
      <div className="flex items-center justify-between gap-2 cursor-pointer" onClick={() => setExpanded((e) => !e)}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-sm font-medium capitalize w-14">{label}</div>
          <div className="hidden sm:flex items-center gap-3 text-[11px]">
            <span className="text-emerald-500">+{BRL(receitas)}</span>
            <span className="text-destructive">−{BRL(despesas)}</span>
            <span className={saldo >= 0 ? "text-emerald-500" : "text-destructive"}>{BRL(saldo)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          {notaInicial && <StickyNote className="h-3 w-3 text-primary" />}
          <span>{expanded ? "−" : "+"}</span>
        </div>
      </div>
      {!expanded && notaInicial && (
        <div className="text-xs text-muted-foreground mt-1 pl-[3.75rem] line-clamp-1 italic">"{notaInicial}"</div>
      )}
      {expanded && (
        <div className="mt-3 space-y-2">
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder='Ex: "aumento por promoção", "13º recebido", "gastos altos por férias"…'
            className="text-sm resize-none min-h-[70px]"
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{texto.length}/500</span>
            <div className="flex gap-1.5">
              {notaInicial && (
                <Button size="sm" variant="ghost" onClick={() => { setTexto(""); onSave(""); }} className="h-7 text-xs text-destructive">
                  <Trash2 className="h-3 w-3 mr-1" /> Remover
                </Button>
              )}
              <Button size="sm" onClick={handleSave} disabled={!dirty || saving} className="h-7 text-xs">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
