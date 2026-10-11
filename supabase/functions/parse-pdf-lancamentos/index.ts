import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORIAS_RECEITA_PJ = ["Vendas", "Serviços", "Comissões", "Juros", "Aluguel Recebido", "Outros"];
const CATEGORIAS_DESPESA_PJ = [
  "Alimentação", "Transporte", "Moradia", "Energia", "Água", "Internet/Telefone",
  "Salários", "Impostos", "Fornecedores", "Marketing", "Software/Assinaturas",
  "Bancos/Tarifas", "Combustível", "Manutenção", "Educação", "Saúde",
  "Financiamento de Carro", "Financiamento de Moto", "Financiamento de Casa", "Empréstimo", "Outros",
];

const CATEGORIAS_RECEITA_PF = [
  "Salário", "13º Salário", "Férias", "Freelance / Bico", "Aluguel Recebido",
  "Rendimento de Investimento", "Pensão / Benefício", "Restituição", "Presente / Doação", "Outros",
];
const CATEGORIAS_DESPESA_PF = [
  "Aluguel", "Condomínio", "Luz", "Água", "Gás", "Internet", "Telefone / Celular", "IPTU",
  "Mercado", "Restaurante / Delivery", "Combustível", "Transporte por App", "Ônibus / Metrô",
  "Manutenção do Carro", "IPVA / Licenciamento", "Seguro do Carro",
  "Plano de Saúde", "Farmácia", "Consultas / Exames", "Academia",
  "Escola / Faculdade", "Cursos", "Streaming", "Assinaturas", "Lazer / Passeios", "Viagem",
  "Roupas", "Beleza / Cuidados", "Pets", "Presentes",
  "Cartão de Crédito", "Empréstimo", "Financiamento de Carro", "Financiamento de Moto",
  "Financiamento de Casa", "Tarifas Bancárias", "Juros / Multas", "Impostos", "Doações", "Outros",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { pdfBase64, mimeType, fileName, perfil, textoBruto, clienteId } = await req.json();
    let verifiedProfile = perfil;
    if (clienteId) {
      if (typeof clienteId !== "string" || !/^[0-9a-f-]{36}$/i.test(clienteId)) return new Response(JSON.stringify({ error: "Cliente inválido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const client = await supabase.from("clientes").select("id,tipo_pessoa").eq("id", clienteId).single();
      if (client.error || !client.data) return new Response(JSON.stringify({ error: "Cliente não autorizado" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      verifiedProfile = client.data.tipo_pessoa;
    }
    if (!pdfBase64 && !textoBruto) {
      return new Response(JSON.stringify({ error: "pdfBase64 ou textoBruto é obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isPF = verifiedProfile === "PF";
    const CATEGORIAS_RECEITA = isPF ? CATEGORIAS_RECEITA_PF : CATEGORIAS_RECEITA_PJ;
    const CATEGORIAS_DESPESA = isPF ? CATEGORIAS_DESPESA_PF : CATEGORIAS_DESPESA_PJ;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY ausente" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hoje = new Date().toISOString().slice(0, 10);
    const prompt = `Você é um analista financeiro especialista em leitura de extratos bancários brasileiros (Itaú, Bradesco, Banco do Brasil, Caixa, Santander, Nubank, Inter, C6, PicPay, Sicoob, Sicredi), faturas de cartão de crédito, comprovantes de Pix e recibos.

Analise o documento anexado e extraia TODOS os lançamentos financeiros como um ARRAY JSON.

Para cada lançamento retorne um objeto com:
- data: string YYYY-MM-DD (use ${hoje} apenas se a linha realmente não tiver data). Se o extrato mostrar só dia/mês, use o ano da competência do documento.
- tipo: "receita" (entrada/crédito) ou "despesa" (saída/débito)
- descricao: descrição curta e legível, já limpa de códigos internos do banco. Se a linha não permitir identificar nada (só um código, número solto etc.) → string vazia ""
- valor: number positivo (sempre positivo; o sinal é dado pelo campo tipo)
- categoria: uma destas — Receitas: ${CATEGORIAS_RECEITA.join(", ")} | Despesas: ${CATEGORIAS_DESPESA.join(", ")}. Se não conseguir classificar com confiança, use "" (vazio).
- forma_pagamento: "pix", "boleto", "cartao_credito", "cartao_debito", "dinheiro", "transferencia" ou ""

REGRAS:
- Ignore linhas de SALDO (anterior, do dia, final), totais, subtotais, limites, cabeçalhos, rodapés e taxas de conversão de moeda.
- Em fatura de cartão, cada compra é uma "despesa"; parcelas ("03/10") entram com o valor da parcela e a parcela no fim da descrição.
- Estornos e créditos em fatura são "receita".
- Converta valores "R$ 1.234,56" → 1234.56 e "1.234,56 D" → despesa, "C" → receita.
- Não invente lançamentos e não duplique a mesma linha.
- Retorne APENAS o array JSON, sem markdown, sem \`\`\`, sem texto extra.
- Se não houver lançamentos, retorne [].`;

    const mime = mimeType || "application/pdf";
    const anexo = textoBruto
      ? {
          type: "text",
          text: `Conteúdo do arquivo ${fileName || "extrato.txt"} (texto puro):\n\n${String(textoBruto).slice(0, 200000)}`,
        }
      : mime.startsWith("image/")
      ? { type: "image_url", image_url: { url: `data:${mime};base64,${pdfBase64}` } }
      : {
          type: "file",
          file: {
            filename: fileName || "documento.pdf",
            file_data: `data:${mime};base64,${pdfBase64}`,
          },
        };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: prompt }, anexo],
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      const status = aiRes.status;
      let mensagem = "Falha ao processar o documento";
      if (status === 429) mensagem = "Muitas requisições — tente novamente em alguns instantes.";
      if (status === 402) mensagem = "Créditos de IA esgotados. Adicione créditos para continuar.";
      if (status === 403) mensagem = "Leitura por IA indisponível para esta conta no momento.";
      return new Response(JSON.stringify({ error: mensagem, detail: err }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content ?? "[]";
    const cleaned = String(raw).replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

    let lancamentos: any[] = [];
    try {
      lancamentos = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\[[\s\S]*\]/);
      if (m) lancamentos = JSON.parse(m[0]);
    }

    const normalized = (Array.isArray(lancamentos) ? lancamentos : []).map((l, i) => {
      const tipo = l.tipo === "receita" ? "receita" : "despesa";
      const descricao = String(l.descricao ?? "").trim();
      const categoria = String(l.categoria ?? "").trim();
      return {
        _id: `tmp-${i}`,
        data: l.data || hoje,
        tipo,
        descricao,
        valor: Number(l.valor) || 0,
        categoria,
        forma_pagamento: l.forma_pagamento || "",
        needs_review: !descricao || !categoria,
      };
    }).filter((l) => l.valor > 0);

    const totalReceitas = normalized.filter((l) => l.tipo === "receita").reduce((s, l) => s + l.valor, 0);
    const totalDespesas = normalized.filter((l) => l.tipo === "despesa").reduce((s, l) => s + l.valor, 0);

    return new Response(JSON.stringify({
      lancamentos: normalized,
      total: normalized.length,
      totalReceitas,
      totalDespesas,
      perfil: isPF ? "PF" : "PJ",
      categorias: { receita: CATEGORIAS_RECEITA, despesa: CATEGORIAS_DESPESA },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
