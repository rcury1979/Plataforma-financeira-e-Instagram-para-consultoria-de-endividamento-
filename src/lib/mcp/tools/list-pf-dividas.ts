import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_pf_dividas",
  title: "Listar dívidas pessoais",
  description:
    "Lista as dívidas pessoais do usuário autenticado, com credor, valores, parcelas e situação de quitação.",
  inputSchema: {
    incluir_quitadas: z.boolean().default(false).describe("Incluir dívidas já quitadas."),
    limit: z.number().int().min(1).max(200).default(50).describe("Máximo de registros."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ incluir_quitadas, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("pf_dividas")
      .select(
        "id,credor,descricao,valor_total,valor_pago,parcelas_total,parcelas_pagas,taxa_juros_mensal,vencimento,quitada",
      )
      .order("valor_total", { ascending: false })
      .limit(limit ?? 50);
    if (!incluir_quitadas) query = query.eq("quitada", false);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const saldo_devedor = (data ?? []).reduce(
      (acc: number, d: { valor_total: number; valor_pago: number }) =>
        acc + (Number(d.valor_total) - Number(d.valor_pago)),
      0,
    );
    return {
      content: [{ type: "text", text: JSON.stringify({ saldo_devedor, dividas: data ?? [] }) }],
      structuredContent: { saldo_devedor, dividas: data ?? [] },
    };
  },
});
