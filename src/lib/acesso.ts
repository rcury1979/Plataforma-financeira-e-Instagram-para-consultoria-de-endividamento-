/* eslint-disable @typescript-eslint/no-explicit-any */
/* Acesso ao app R&M 360°: só entra quem assina, quem é cliente da mentoria (liberado pela educadora),
 * quem recebeu cortesia, ou a própria equipe. A regra de verdade está no banco (função tem_acesso_app);
 * aqui o app só consulta para mostrar a tela certa. */
import { supabase } from "@/integrations/supabase/client";

export type OrigemAcesso = "equipe" | "assinatura" | "mentoria" | "cortesia" | "nenhum";

export type MinhaAssinatura = {
  tem_acesso: boolean;
  origem: OrigemAcesso;
  status: string | null;
  contrato_meses: number | null;
  fidelidade_ate: string | null;
  proxima_cobranca: string | null;
  cancela_no_fim: boolean;
};

export async function temAcessoApp(): Promise<boolean> {
  const { data, error } = await (supabase as any).rpc("tem_acesso_app");
  // Enquanto a atualização do banco (assinatura_acesso) não for aplicada, a função não existe: não bloqueia ninguém.
  if (error) return error.code === "PGRST202";
  return data === true;
}

export async function minhaAssinatura(): Promise<MinhaAssinatura | null> {
  const { data, error } = await (supabase as any).rpc("minha_assinatura");
  if (error || !data) return null;
  return (Array.isArray(data) ? data[0] : data) ?? null;
}

/** Abre a página de pagamento segura do Stripe para o plano escolhido. */
export async function abrirPagamento(plano: "6m" | "12m"): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke("create-checkout", { body: { plano } });
  if (data?.url) { window.location.href = data.url; return null; }
  let msg = data?.error as string | undefined;
  if (!msg && error && "context" in error) {
    try { msg = (await (error as any).context.json())?.error; } catch { /* ignora */ }
  }
  return msg || "Não foi possível abrir o pagamento agora. Tente de novo em instantes.";
}

/** Abre o portal do Stripe (trocar cartão, ver faturas, cancelar após a fidelidade). */
export async function abrirPortal(): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke("create-portal-session", { body: {} });
  if (data?.url) { window.location.href = data.url; return null; }
  let msg = data?.error as string | undefined;
  if (!msg && error && "context" in error) {
    try { msg = (await (error as any).context.json())?.error; } catch { /* ignora */ }
  }
  return msg || "Não foi possível abrir o portal agora.";
}

export const ROTULO_ORIGEM: Record<OrigemAcesso, string> = {
  equipe: "Equipe R&M",
  assinatura: "Assinatura",
  mentoria: "Incluso na mentoria",
  cortesia: "Cortesia",
  nenhum: "Sem acesso",
};

export const ROTULO_STATUS: Record<string, string> = {
  trialing: "Teste grátis",
  active: "Ativa",
  past_due: "Pagamento pendente",
  canceled: "Cancelada",
  unpaid: "Não paga",
  incomplete: "Aguardando pagamento",
  incomplete_expired: "Pagamento não concluído",
  paused: "Pausada",
};
