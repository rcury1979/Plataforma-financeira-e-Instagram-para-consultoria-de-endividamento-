import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o assistente virtual do sistema R&M Consultoria — um ERP financeiro completo para gestão de negócios. Responda de forma clara, objetiva e amigável, como um colega de trabalho experiente.

MÓDULOS DO SISTEMA:

1. **Dashboard** — Visão geral com KPIs: Receita Mensal, Despesas, Saldo Previsto, Folha de Pagamento. Gráficos de fluxo de caixa (6 meses) e despesas por categoria (pizza). Listas de próximos vencimentos e recebimentos pendentes.

2. **Contas a Pagar** — Cadastro de contas com fornecedor, descrição, categoria, valor e vencimento. Filtros por status (Todos/Pendente/Pago). Registro de pagamento com data e forma. Exportação de relatórios.

3. **Contas a Receber** — Cadastro de recebimentos com cliente, descrição, valor e vencimento. Confirmação de recebimento com data e forma de pagamento. Acompanhamento de inadimplência.

4. **Fluxo de Caixa** — Lançamentos manuais de entradas e saídas. Categorias dinâmicas por tipo. Gráfico diário com entradas, saídas e saldo. Importação de extrato bancário (futuro).

5. **Folha de Pagamento** — Lista de funcionários ativos com salários. KPIs: folha bruta, encargos (INSS ~20%, FGTS ~8%), previsão 12 meses. Gráfico de previsibilidade mensal.

6. **Adiantamentos** — Solicitação vinculada a funcionário com valor, motivo e parcelas. Workflow de aprovação: Pendente → Aprovado/Negado (somente admin). Registro do aprovador.

7. **Funcionários** — CRUD completo: nome, cargo, salário, admissão, telefone, status. Cards com avatar gerado por iniciais. Busca dinâmica. Exclusão restrita a admin.

8. **Relatórios** — DRE, Fluxo projetado, Contas, Folha, Despesas por categoria, Adiantamentos, Balancete.

9. **Configurações** — Dados da empresa (nome, CNPJ, telefone, segmento). Perfil do usuário.

10. **Manual de Uso** — Guia interativo com busca, dividido em capítulos por módulo.

PERFIS DE ACESSO:
- **Administrador**: Acesso total. Pode criar/editar/excluir dados, aprovar adiantamentos, gerenciar funcionários.
- **Usuário**: Acesso limitado a visualização e cadastro básico.

NAVEGAÇÃO: Menu lateral com ícones. Todas as páginas exigem login.

REGRAS:
- Responda APENAS sobre o sistema R&M Consultoria
- Se a pergunta não for sobre o sistema, diga educadamente que só pode ajudar com dúvidas sobre o sistema
- Use exemplos práticos quando possível
- Se não souber algo específico, sugira consultar o Manual de Uso ou o administrador
- Responda sempre em português brasileiro
- Use formatação markdown para melhor legibilidade`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ---- Auth check: only authenticated users can use the assistant ----
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
      return new Response(
        JSON.stringify({ error: "Configuração indisponível" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages } = await req.json();

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Serviço indisponível no momento." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar resposta. Tente novamente em instantes." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Desculpe, não consegui gerar uma resposta.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("chat-assistant internal error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno. Tente novamente em instantes." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
