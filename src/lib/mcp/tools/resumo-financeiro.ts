import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

type Row = { tipo: string; valor: number; categoria: string | null };

function summarize(rows: Row[]) {
  let receitas = 0;
  let despesas = 0;
  const porCategoria: Record<string, number> = {};
  for (const r of rows) {
    const valor = Number(r.valor) || 0;
    if (r.tipo === "receita") receitas += valor;
    else {
      despesas += valor;
      const key = r.categoria ?? "Sem categoria";
      porCategoria[key] = (porCategoria[key] ?? 0) + valor;
    }
  }
  return {
    receitas,
    despesas,
    saldo: receitas - despesas,
    despesas_por_categoria: Object.entries(porCategoria)
      .sort((a, b) => b[1] - a[1])
      .map(([categoria, total]) => ({ categoria, total })),
  };
}

export default defineTool({
  name: "resumo_financeiro",
  title: "Resumo financeiro do período",
  description:
    "Calcula receitas, despesas, saldo e despesas por categoria em um período, para as finanças pessoais (PF) ou da empresa (PJ).",
  inputSchema: {
    escopo: z.enum(["pf", "pj"]).describe("pf para finanças pessoais, pj para a empresa."),
    from: z.string().describe("Data inicial no formato YYYY-MM-DD."),
    to: z.string().describe("Data final no formato YYYY-MM-DD."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ escopo, from, to }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const table = escopo === "pf" ? "pf_transacoes" : "lancamentos";
    const { data, error } = await supabase
      .from(table)
      .select("tipo,valor,categoria")
      .gte("data", from)
      .lte("data", to)
      .limit(5000);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const resumo = { escopo, from, to, ...summarize((data ?? []) as Row[]) };
    return {
      content: [{ type: "text", text: JSON.stringify(resumo) }],
      structuredContent: resumo,
    };
  },
});
