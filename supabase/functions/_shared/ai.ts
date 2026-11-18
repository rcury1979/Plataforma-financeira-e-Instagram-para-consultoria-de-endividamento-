// Provedor de IA das funções (qualquer API compatível com OpenAI /chat/completions).
// Segredos no Supabase (Edge Functions → Secrets):
//   AI_API_KEY   chave do provedor
//   AI_BASE_URL  ex.: https://generativelanguage.googleapis.com/v1beta/openai  (Google Gemini, tem plano grátis)
//                     https://api.openai.com/v1                                (OpenAI)
//   AI_MODEL     opcional; padrão gemini-2.5-flash (Google) ou gpt-4o-mini (outros)
// Sem esses segredos, usa o gateway do Lovable (LOVABLE_API_KEY), que só existe em projetos Lovable.

export type AiConfig = { url: string; headers: Record<string, string>; model: string };

/** `lovableModel` é o modelo usado quando cai no gateway do Lovable. Retorna null se nada estiver configurado. */
export function aiConfig(lovableModel = "google/gemini-2.5-flash"): AiConfig | null {
  const key = Deno.env.get("AI_API_KEY");
  const base = (Deno.env.get("AI_BASE_URL") ?? "").replace(/\/+$/, "");
  if (key && base) {
    const padrao = base.includes("googleapis.com") ? "gemini-2.5-flash" : "gpt-4o-mini";
    return {
      url: `${base}/chat/completions`,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      model: Deno.env.get("AI_MODEL") || padrao,
    };
  }
  const lovable = Deno.env.get("LOVABLE_API_KEY");
  if (!lovable) return null;
  return {
    url: "https://ai.gateway.lovable.dev/v1/chat/completions",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovable}`, "Lovable-API-Key": lovable },
    model: lovableModel,
  };
}

export const AI_NAO_CONFIGURADA = "IA não configurada: defina AI_API_KEY e AI_BASE_URL nos segredos das funções do Supabase.";
