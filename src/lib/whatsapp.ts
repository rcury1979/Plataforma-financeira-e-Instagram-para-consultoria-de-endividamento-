// Centraliza o número e a mensagem pré-preenchida do WhatsApp da Marta Cury.
export const WHATSAPP_PHONE = "5521986000039";

export const WHATSAPP_DEFAULT_MESSAGE =
  "Olá, Marta Cury! 👋\n\nVim pelo site da RM Consultoria e gostaria de conversar sobre minha situação financeira.\n\nPara você já me orientar melhor, me conta:\n\n👉 Você está buscando ajuda como *pessoa física* (organizar dívidas, orçamento familiar) ou para a sua *empresa* (reestruturação, fluxo de caixa)?\n\n💼 Se for empresa, qual o seu segmento? (ex: comércio, restaurante, serviços, igreja, outro)\n\nObrigado(a)! 💛";

export function buildWhatsAppLink(message: string = WHATSAPP_DEFAULT_MESSAGE) {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}
