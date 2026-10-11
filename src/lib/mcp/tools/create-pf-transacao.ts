import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_pf_transacao",
  title: "Criar lançamento pessoal (PF)",
  description: "Cria um lançamento pessoal (receita ou despesa) para o usuário autenticado.",
  inputSchema: {
    tipo: z.enum(["receita", "despesa"]).describe("Tipo do lançamento."),
    valor: z.number().positive().describe("Valor em reais."),
    categoria: z.string().trim().min(1).describe("Categoria, ex.: Luz, Supermercado, Salário."),
    data: z.string().describe("Data do lançamento no formato YYYY-MM-DD."),
    descricao: z.string().trim().max(500).optional().describe("Descrição livre."),
    recorrente: z.boolean().default(false).describe("Marcar como recorrente."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ tipo, valor, categoria, data, descricao, recorrente }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: rows, error } = await supabase
      .from("pf_transacoes")
      .insert({
        user_id: ctx.getUserId(),
        tipo,
        valor,
        categoria,
        data,
        descricao: descricao ?? null,
        recorrente: recorrente ?? false,
      })
      .select();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(rows?.[0] ?? null) }],
      structuredContent: { transacao: rows?.[0] ?? null },
    };
  },
});
