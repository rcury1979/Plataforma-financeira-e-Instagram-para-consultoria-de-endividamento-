import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { textContent, targetModule, fileName } = await req.json();

    if (!textContent || !targetModule) {
      return new Response(
        JSON.stringify({ error: "textContent e targetModule são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const moduleSchemas: Record<string, string> = {
      contas_pagar: `Array de objetos com: fornecedor (string obrigatório), valor (number obrigatório), vencimento (string YYYY-MM-DD obrigatório), descricao (string opcional), categoria (string opcional), forma_pagamento (string opcional), pago (boolean, default false)`,
      contas_receber: `Array de objetos com: cliente (string obrigatório), valor (number obrigatório), vencimento (string YYYY-MM-DD obrigatório), descricao (string opcional), forma_pagamento (string opcional), recebido (boolean, default false)`,
      extrato_bancario: `Array de objetos com: data (string YYYY-MM-DD obrigatório), descricao (string obrigatório), valor (number obrigatório, positivo para crédito, negativo para débito), tipo (string "credito" ou "debito"), memo (string opcional)`,
      notas_fiscais: `Array de objetos com: cliente_nome (string obrigatório), descricao (string obrigatório), valor_total (number obrigatório), data_emissao (string YYYY-MM-DD obrigatório), data_competencia (string YYYY-MM-DD opcional), tipo (string "nfs-e" ou "nf-e"), cliente_cnpj_cpf (string opcional), natureza_operacao (string opcional)`,
      funcionarios: `Array de objetos com: nome (string obrigatório), cargo (string obrigatório), salario (number obrigatório), admissao (string YYYY-MM-DD obrigatório), telefone (string opcional), status (string "Ativo" ou "Inativo", default "Ativo")`,
    };

    const schema = moduleSchemas[targetModule];
    if (!schema) {
      return new Response(
        JSON.stringify({ error: "Módulo destino inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `Você é um assistente de extração de dados. Analise o conteúdo abaixo extraído de um arquivo (${fileName}) e extraia os dados estruturados.

Módulo destino: ${targetModule}
Schema esperado: ${schema}

REGRAS:
- Retorne APENAS um JSON válido, sem markdown, sem explicações
- O JSON deve ser um array de objetos
- Converta valores monetários para números (ex: "R$ 1.234,56" → 1234.56)
- Converta datas para formato YYYY-MM-DD
- Se não conseguir extrair dados, retorne []
- Ignore cabeçalhos, totais e linhas vazias
- Seja inteligente ao mapear colunas para os campos esperados

Conteúdo do arquivo:
${textContent.substring(0, 15000)}`;

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "API key não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", errText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar com IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "[]";
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = rawContent;
    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", jsonStr);
      parsedData = [];
    }

    return new Response(
      JSON.stringify({ data: parsedData, count: parsedData.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("parse-import-file internal error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno ao processar o arquivo. Tente novamente em instantes." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
