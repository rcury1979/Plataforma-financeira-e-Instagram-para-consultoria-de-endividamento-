// Abre o portal do Stripe para o assinante trocar o cartão, ver faturas e (após a fidelidade) cancelar.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createStripeClient, origemPermitida } from "../_shared/stripe.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

/** Configuração do portal: durante a fidelidade, sem o botão de cancelar; depois, cancelamento no fim do mês pago.
 *  Criada uma vez no Stripe e reaproveitada. */
async function configPortal(stripe: ReturnType<typeof createStripeClient>, podeCancelar: boolean): Promise<string> {
  const tipo = podeCancelar ? "com_cancelamento" : "sem_cancelamento";
  const lista = await stripe.billingPortal.configurations.list({ limit: 100 });
  const achou = lista.data.find((c) => c.metadata?.rm360 === tipo && c.active);
  if (achou) return achou.id;
  const nova = await stripe.billingPortal.configurations.create({
    metadata: { rm360: tipo },
    business_profile: { headline: "R&M Consultoria — sua assinatura do app R&M 360°" },
    features: {
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
      customer_update: { enabled: true, allowed_updates: ["email", "address", "tax_id"] },
      subscription_cancel: podeCancelar
        ? { enabled: true, mode: "at_period_end", cancellation_reason: { enabled: true, options: ["too_expensive", "unused", "other"] } }
        : { enabled: false },
    },
  });
  return nova.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: "Faça login." }, 401);

    const { data: sub } = await admin
      .from("subscriptions")
      .select("stripe_customer_id, fidelidade_ate")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.stripe_customer_id) return json({ error: "Nenhuma assinatura encontrada." }, 404);

    const stripe = createStripeClient();
    const naFidelidade = sub.fidelidade_ate && new Date(sub.fidelidade_ate).getTime() > Date.now();
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id as string,
      return_url: `${origemPermitida(req.headers.get("origin"))}/cliente/configuracoes?aba=plano`,
      locale: "pt-BR",
      configuration: await configPortal(stripe, !naFidelidade),
    });
    return json({ url: portal.url });
  } catch (e) {
    console.error("create-portal-session error:", e);
    return json({ error: "Não foi possível abrir o portal agora." }, 400);
  }
});
