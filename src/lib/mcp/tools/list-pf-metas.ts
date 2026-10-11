import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_pf_metas",
  title: "Listar sonhos e metas pessoais",
  description:
    "Lista as metas/sonhos financeiros do usuário autenticado, com valor alvo, valor acumulado e prazo.",
  inputSchema: {
    incluir_concluidas: z.boolean().default(false).describe("Incluir metas já concluídas."),
    limit: z.number().int().min(1).max(200).default(50).describe("Máximo de registros."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ incluir_concluidas, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("pf_metas_pessoais")
      .select("id,titulo,categoria,valor_alvo,valor_atual,prazo,concluida")
      .order("prazo", { ascending: true })
      .limit(limit ?? 50);
    if (!incluir_concluidas) query = query.eq("concluida", false);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { metas: data ?? [] },
    };
  },
});
