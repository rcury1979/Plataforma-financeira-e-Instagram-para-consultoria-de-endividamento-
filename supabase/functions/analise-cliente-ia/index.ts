import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autenticado" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: "Não autenticado" }, 401);

    const { clienteId } = await req.json().catch(() => ({}));
    if (!clienteId) return json({ error: "clienteId é obrigatório" }, 400);

    const { data: cliente } = await supabase
      .from("clientes")
      .select("id,nome,observacoes")
      .eq("id", clienteId)
      .maybeSingle();
    if (!cliente) return json({ error: "Cliente não encontrado" }, 404);

    const { data: anamnese } = await supabase
      .from("cliente_anamnese")
      .select("respostas")
      .eq("cliente_id", clienteId)
      .maybeSingle();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "LOVABLE_API_KEY não configurada" }, 500);

    const prompt = `Você é assistente de uma educadora financeira brasileira (Método 360°: Educação, Mentoria e Gestão).
Gere uma ANÁLISE FINANCEIRA em português do Brasil para o cliente abaixo, em markdown, com tom acolhedor,
sem julgamento, prática e realista. Nunca prometa resultado garantido nem indique produto financeiro específico.

Cliente: ${cliente.nome}
Observações do atendimento: ${cliente.observacoes ?? "não informadas"}
Anamnese (respostas): ${JSON.stringify(anamnese?.respostas ?? {}, null, 2)}

Estruture exatamente com estes títulos:
## Onde você está hoje
## O que mais pesa no seu orçamento
## Plano dos próximos 30 dias
## Plano dos próximos 90 dias
## Hábitos para construir
## Próximo passo com a mentoria`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resp.ok) {
      const details = await resp.text();
      console.error(`AI gateway falhou [${resp.status}]: ${details}`);
      if (resp.status === 429) return json({ error: "Muitas solicitações. Tente novamente em instantes." }, 429);
      if (resp.status === 402) return json({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }, 402);
      return json({ error: "Falha ao gerar a análise", details }, resp.status);
    }

    const data = await resp.json();
    const conteudo = data?.choices?.[0]?.message?.content;
    if (!conteudo) return json({ error: "A IA não retornou conteúdo" }, 502);

    const titulo = `Análise financeira · ${new Date().toLocaleDateString("pt-BR")}`;
    const { data: salvo, error: insertError } = await supabase
      .from("cliente_analises")
      .insert({ user_id: user.id, cliente_id: clienteId, tipo: "financeira", titulo, conteudo })
      .select("id,titulo,conteudo,revisado,created_at")
      .single();

    if (insertError) {
      console.error("Erro ao salvar análise:", insertError.message);
      return json({ error: insertError.message }, 500);
    }

    return json({ analise: salvo });
  } catch (e) {
    console.error("Erro inesperado:", e);
    return json({ error: e instanceof Error ? e.message : "Erro inesperado" }, 500);
  }
});
