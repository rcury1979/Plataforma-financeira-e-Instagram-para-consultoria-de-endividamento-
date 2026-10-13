// Abre o pagamento da assinatura do app R&M 360° (página segura do Stripe).
// O usuário precisa estar logado: o id e o e-mail vêm do login, nunca do navegador.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createStripeClient, DIAS_GRATIS, origemPermitida, PLANOS, type PlanoId, stripeEnv } from "../_shared/stripe.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: "Faça login para assinar." }, 401);

    const { plano } = (await req.json().catch(() => ({}))) as { plano?: string };
    if (plano !== "6m" && plano !== "12m") return json({ error: "Plano inválido." }, 400);
    const p = PLANOS[plano as PlanoId];

    // Já assinante? Não deixa pagar em dobro.
    const { data: subs } = await admin
      .from("subscriptions")
      .select("status, current_period_end, stripe_customer_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    const agora = Date.now();
    const ativa = (subs ?? []).find((s) =>
      ["active", "trialing", "past_due"].includes(s.status) &&
      (!s.current_period_end || new Date(s.current_period_end).getTime() > agora));
    if (ativa) return json({ error: "Você já tem uma assinatura ativa. Veja em Configurações → Minha assinatura." }, 409);

    const stripe = createStripeClient();
    let customerId = (subs ?? []).find((s) => s.stripe_customer_id)?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const existing = await stripe.customers.list({ email: user.email ?? undefined, limit: 1 });
      customerId = existing.data[0]?.id ??
        (await stripe.customers.create({ email: user.email ?? undefined, metadata: { userId: user.id } })).id;
    }

    // Teste grátis só na primeira assinatura.
    const primeiraVez = (subs ?? []).length === 0;
    const origem = origemPermitida(req.headers.get("origin"));

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      locale: "pt-BR",
      client_reference_id: user.id,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "brl",
          unit_amount: p.centavos,
          recurring: { interval: "month" },
          product_data: { name: p.nome, metadata: { plano } },
        },
      }],
      subscription_data: {
        ...(primeiraVez && { trial_period_days: DIAS_GRATIS }),
        metadata: { userId: user.id, plano, contrato_meses: String(p.meses) },
      },
      metadata: { userId: user.id, plano },
      allow_promotion_codes: true,
      success_url: `${origem}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origem}/planos?cancelado=1`,
    });

    return json({ url: session.url, ambiente: stripeEnv() });
  } catch (e) {
    console.error("create-checkout error:", e);
    return json({ error: "Não foi possível abrir o pagamento agora. Tente de novo em instantes." }, 400);
  }
});
