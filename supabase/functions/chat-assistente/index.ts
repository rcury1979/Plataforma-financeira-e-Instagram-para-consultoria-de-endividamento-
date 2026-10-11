// Assistente virtual do site — responde dúvidas sobre a RM Consultoria
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SYSTEM_PROMPT = `Você é a assistente virtual da RM Consultoria, empresa de educação financeira comandada por Marta Cury.

TOM DE VOZ: acolhedor, humano, próximo. Sem jargão. Português do Brasil. Respostas CURTAS (2 a 4 parágrafos no máximo). Use emojis com moderação (💛 🙌 ✨).

SOBRE A MARTA CURY:
- Consultora financeira, palestrante e mentora, com atuação em finanças pessoais, familiares, empresariais e para igrejas.
- Missão: ajudar pessoas endividadas e famílias em reconstrução a recomeçarem com clareza e propósito.
- WhatsApp: (21) 98600-0039 — link: https://wa.me/5521986000039
- Instagram: @marta_curyy — https://www.instagram.com/marta_curyy (vídeos curtos sobre dívidas e orçamento; página /videos do site)
- E-mail: contato@rmconsultoria.finance

SERVIÇOS OFERECIDOS:
1. **Mentorias e consultorias individuais** (pessoa física ou empresa) — pelo WhatsApp.
2. **Palestras GRATUITAS para igrejas, ministérios e grupos de fé** — página /palestras.
3. **Cursos online** de educação financeira e reestruturação de dívidas — página /cursos.
4. **Diagnóstico financeiro gratuito** — questionário rápido na página /diagnostico.
5. **Planilha de orçamento familiar GRATUITA** para baixar — página /planilha-gratis.
6. **Blog + ferramentas gratuitas** (guia de renegociação, diário de 30 dias, apostila de liberdade financeira) — página /blog.
7. **App R&M 360°** com o **Método GCPM** (Gerar, Cuidar, Proteger e Multiplicar): extrato, limites, dívidas, patrimônio, metas e acompanhamento com a educadora — página /planos.

ASSINATURA DO APP R&M 360°:
- Contrato de 6 meses: R$ 25,99/mês. Contrato de 12 meses: R$ 21,99/mês. Os dois começam com 7 dias grátis — página /planos.

REGRAS IMPORTANTES:
- Se a pessoa parecer em situação difícil (dívidas, desespero, "não sei o que fazer"), acolha primeiro. Diga que ela não está sozinha e sugira o WhatsApp da Marta Cury ou o Diagnóstico Gratuito.
- Se perguntarem sobre serviços pagos que não conhecem, apresente também as opções gratuitas.
- Sempre que fizer sentido, sugira o próximo passo prático (com link relativo, ex: /palestras).
- Se a pergunta fugir do escopo (política, esportes, receitas, código, etc.), diga com gentileza que você está aqui só para dúvidas sobre finanças e sobre a RM Consultoria, e ofereça o WhatsApp.
- NÃO dê recomendações de investimento específicas nem promessas de retorno. Fale sempre em orientação e organização.
- Os dados do visitante são protegidos pela LGPD.

Se não souber a resposta, seja honesta e indique o WhatsApp da Marta Cury.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Provedor de IA configurável (qualquer API compatível com OpenAI):
    //   AI_API_KEY + AI_BASE_URL (+ AI_MODEL)  → ex.: OpenAI, Groq, OpenRouter, Google (endpoint OpenAI).
    //   Sem isso, usa o gateway do Lovable (LOVABLE_API_KEY), que só existe em projetos Lovable.
    const AI_API_KEY = Deno.env.get('AI_API_KEY');
    const AI_BASE_URL = (Deno.env.get('AI_BASE_URL') ?? '').replace(/\/+$/, '');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const usaProprio = Boolean(AI_API_KEY && AI_BASE_URL);
    if (!usaProprio && !LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'IA não configurada (defina AI_API_KEY e AI_BASE_URL)' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const url = usaProprio ? `${AI_BASE_URL}/chat/completions` : 'https://ai.gateway.lovable.dev/v1/chat/completions';
    const authHeaders: Record<string, string> = usaProprio
      ? { Authorization: `Bearer ${AI_API_KEY}` }
      : { 'Lovable-API-Key': LOVABLE_API_KEY as string };
    const model = Deno.env.get('AI_MODEL') ?? (usaProprio ? 'gpt-4o-mini' : 'google/gemini-2.5-flash');

    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : null;
    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages é obrigatório' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Limita histórico enviado (últimas 20 mensagens) e tamanho
    const trimmed = messages.slice(-20).map((m: any) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content ?? '').slice(0, 4000),
    }));

    const response = await fetch(url, {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...trimmed],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`AI Gateway error [${response.status}]: ${errBody}`);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Muitas mensagens em pouco tempo. Tente novamente em instantes.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos de IA esgotados. Fale direto com a Marta Cury no WhatsApp: https://wa.me/5521986000039' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Falha ao processar mensagem', details: errBody }), {
        status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('chat-assistente error:', err);
    return new Response(JSON.stringify({ error: 'Erro interno', message: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
