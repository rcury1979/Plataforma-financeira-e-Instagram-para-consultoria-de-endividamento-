import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_pf_transacoes",
  title: "Listar lançamentos pessoais (PF)",
  description:
    "Lista os lançamentos pessoais (receitas e despesas) do usuário autenticado, com filtros opcionais de período, tipo e categoria.",
  inputSchema: {
    from: z.string().optional().describe("Data inicial no formato YYYY-MM-DD."),
    to: z.string().optional().describe("Data final no formato YYYY-MM-DD."),
    tipo: z.enum(["receita", "despesa"]).optional().describe("Filtrar por tipo."),
    categoria: z.string().optional().describe("Filtrar por categoria exata."),
    limit: z.number().int().min(1).max(200).default(50).describe("Máximo de registros."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to, tipo, categoria, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("pf_transacoes")
      .select("id,data,tipo,categoria,descricao,valor,recorrente")
      .order("data", { ascending: false })
      .limit(limit ?? 50);
    if (from) query = query.gte("data", from);
    if (to) query = query.lte("data", to);
    if (tipo) query = query.eq("tipo", tipo);
    if (categoria) query = query.eq("categoria", categoria);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { transacoes: data ?? [] },
    };
  },
});
