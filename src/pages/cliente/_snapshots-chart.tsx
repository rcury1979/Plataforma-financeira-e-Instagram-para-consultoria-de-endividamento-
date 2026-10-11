/* Gráfico de evolução mensal (área com gradiente suave), usado por Dívidas e Patrimônio. */
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { brl, compact, Panel } from "./_shared";

export const COR = {
  azul: "hsl(221 62% 24%)",
  dourado: "hsl(41 72% 47%)",
  verde: "hsl(152 55% 33%)",
  vermelho: "hsl(0 68% 48%)",
  grade: "hsl(220 20% 89%)",
};

export function EvolucaoChart({
  titulo, data, linha, preenchimento, id,
}: {
  titulo: string; data: { label: string; valor: number }[]; linha: string; preenchimento: string; id: string;
}) {
  return (
    <Panel>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{titulo}</p>
      <div className="h-56 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={preenchimento} stopOpacity={0.28} />
                <stop offset="100%" stopColor={preenchimento} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={COR.grade} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: COR.grade }} tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v: number) => compact(v)} tickLine={false} axisLine={false} width={44} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v: number) => [brl(v), "Valor"]}
              contentStyle={{ borderRadius: 12, border: `1px solid ${COR.grade}`, fontSize: 12 }}
            />
            <Area type="monotone" dataKey="valor" stroke={linha} strokeWidth={2} fill={`url(#grad-${id})`} dot={{ r: 3, fill: linha }} activeDot={{ r: 5 }} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
