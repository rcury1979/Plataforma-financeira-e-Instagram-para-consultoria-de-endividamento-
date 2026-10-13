// Stripe direto (sem intermediário). Segredos configurados no Supabase → Edge Functions → Secrets:
//   STRIPE_SECRET_KEY      chave secreta da conta Stripe (sk_live_... ou sk_test_... para testes)
//   STRIPE_WEBHOOK_SECRET  segredo do webhook (whsec_...), criado no painel do Stripe
import { encode } from "https://deno.land/std@0.168.0/encoding/hex.ts";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

export type StripeEnv = "sandbox" | "live";

const getEnv = (key: string): string => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`${key} não configurada no Supabase (Edge Functions → Secrets)`);
  return value;
};

/** Ambiente da chave configurada: sk_test_ = testes, sk_live_ = cobranças reais. */
export function stripeEnv(): StripeEnv {
  return getEnv("STRIPE_SECRET_KEY").startsWith("sk_live_") ? "live" : "sandbox";
}

export function createStripeClient(): Stripe {
  return new Stripe(getEnv("STRIPE_SECRET_KEY"), {
    apiVersion: "2025-02-24.acacia",
    httpClient: Stripe.createFetchHttpClient(),
  });
}

/** Planos do app R&M 360° — valores combinados (centavos de real). */
export const PLANOS = {
  "6m": { meses: 6, centavos: 2599, nome: "R&M 360° — contrato de 6 meses" },
  "12m": { meses: 12, centavos: 2199, nome: "R&M 360° — contrato de 12 meses" },
} as const;
export type PlanoId = keyof typeof PLANOS;
export const DIAS_GRATIS = 7;

/** Endereços para onde o pagamento pode voltar (evita redirecionar para sites de terceiros). */
export function origemPermitida(origin: string | null): string {
  const padrao = "https://rmconsultoriaeducation.com";
  if (!origin) return padrao;
  try {
    const u = new URL(origin);
    const ok =
      u.hostname === "rmconsultoriaeducation.com" ||
      u.hostname === "www.rmconsultoriaeducation.com" ||
      u.hostname.endsWith(".netlify.app") ||
      u.hostname === "localhost" || u.hostname === "127.0.0.1";
    return ok ? u.origin : padrao;
  } catch {
    return padrao;
  }
}

export async function verifyWebhook(req: Request): Promise<{ type: string; livemode: boolean; data: { object: any } }> {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();
  const secret = getEnv("STRIPE_WEBHOOK_SECRET");
  if (!signature || !body) throw new Error("Missing signature or body");

  let timestamp: string | undefined;
  const v1Signatures: string[] = [];
  for (const part of signature.split(",")) {
    const [key, value] = part.split("=", 2);
    if (key === "t") timestamp = value;
    if (key === "v1") v1Signatures.push(value);
  }
  if (!timestamp || v1Signatures.length === 0) throw new Error("Invalid signature format");
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) throw new Error("Webhook timestamp too old");

  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`));
  const expected = new TextDecoder().decode(encode(new Uint8Array(signed)));
  if (!v1Signatures.includes(expected)) throw new Error("Invalid webhook signature");
  return JSON.parse(body);
}
