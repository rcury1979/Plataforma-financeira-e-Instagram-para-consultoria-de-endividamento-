import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_clientes",
  title: "Listar clientes",
  description: "Lista os clientes cadastrados pelo usuário autenticado, com busca opcional por nome.",
  inputSchema: {
    busca: z.string().trim().optional().describe("Texto para buscar no nome do cliente."),
    incluir_arquivados: z.boolean().default(false).describe("Incluir clientes arquivados."),
    limit: z.number().int().min(1).max(200).default(50).describe("Máximo de registros."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ busca, incluir_arquivados, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("clientes")
      .select("id,nome,email,telefone,documento,observacoes,arquivado")
      .order("nome", { ascending: true })
      .limit(limit ?? 50);
    if (!incluir_arquivados) query = query.eq("arquivado", false);
    if (busca) query = query.ilike("nome", `%${busca}%`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { clientes: data ?? [] },
    };
  },
});
