// Recebe os avisos do Stripe e libera/bloqueia o acesso ao app automaticamente.
// Endereço para cadastrar no Stripe: https://<projeto>.supabase.co/functions/v1/payments-webhook
// Eventos: customer.subscription.created, customer.subscription.updated, customer.subscription.deleted
import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyWebhook } from "../_shared/stripe.ts";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const iso = (s?: number | null) => (s ? new Date(s * 1000).toISOString() : null);

/** Fim da fidelidade: N meses contados a partir do fim do teste grátis (ou do início, se não teve teste). */
function fidelidadeAte(sub: any, meses: number | null): string | null {
  if (!meses) return null;
  const base = new Date((sub.trial_end ?? sub.start_date ?? sub.created) * 1000);
  base.setMonth(base.getMonth() + meses);
  return base.toISOString();
}

async function salvar(sub: any, livemode: boolean) {
  const item = sub.items?.data?.[0];
  const userId = sub.metadata?.userId;
  const meses = Number(sub.metadata?.contrato_meses) || null;
  const linha = {
    stripe_subscription_id: sub.id,
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
    product_id: typeof item?.price?.product === "string" ? item.price.product : item?.price?.product?.id ?? "rm360",
    price_id: sub.metadata?.plano ? `rm360_${sub.metadata.plano}` : item?.price?.id ?? "rm360",
    status: sub.status,
    current_period_start: iso(item?.current_period_start ?? sub.current_period_start),
    current_period_end: iso(item?.current_period_end ?? sub.current_period_end),
    cancel_at_period_end: !!sub.cancel_at_period_end,
    contrato_meses: meses,
    fidelidade_ate: fidelidadeAte(sub, meses),
    environment: livemode ? "live" : "sandbox",
    updated_at: new Date().toISOString(),
  };

  const { data: existe } = await supabase.from("subscriptions").select("id").eq("stripe_subscription_id", sub.id).maybeSingle();
  if (existe) {
    await supabase.from("subscriptions").update(linha).eq("stripe_subscription_id", sub.id);
  } else if (userId) {
    await supabase.from("subscriptions").insert({ ...linha, user_id: userId });
  } else {
    console.error("Assinatura sem userId nos metadados:", sub.id);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const event = await verifyWebhook(req);
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await salvar(event.data.object, event.livemode);
        break;
      default:
        console.log("Evento ignorado:", event.type);
    }
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
