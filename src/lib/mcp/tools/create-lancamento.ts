import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_lancamento",
  title: "Criar lançamento da empresa (PJ)",
  description: "Cria um lançamento financeiro empresarial (receita ou despesa) para o usuário autenticado.",
  inputSchema: {
    tipo: z.enum(["receita", "despesa"]).describe("Tipo do lançamento."),
    valor: z.number().positive().describe("Valor em reais."),
    descricao: z.string().trim().min(1).max(300).describe("Descrição do lançamento."),
    data: z.string().describe("Data do lançamento no formato YYYY-MM-DD."),
    categoria: z.string().trim().optional().describe("Categoria / plano de contas."),
    forma_pagamento: z.string().trim().optional().describe("Forma de pagamento."),
    planejado: z.boolean().default(false).describe("Marcar como planejado (previsto)."),
    observacoes: z.string().trim().max(500).optional().describe("Observações."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: rows, error } = await supabase
      .from("lancamentos")
      .insert({
        user_id: ctx.getUserId(),
        tipo: input.tipo,
        valor: input.valor,
        descricao: input.descricao,
        data: input.data,
        categoria: input.categoria ?? null,
        forma_pagamento: input.forma_pagamento ?? null,
        planejado: input.planejado ?? false,
        observacoes: input.observacoes ?? null,
      })
      .select();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(rows?.[0] ?? null) }],
      structuredContent: { lancamento: rows?.[0] ?? null },
    };
  },
});
