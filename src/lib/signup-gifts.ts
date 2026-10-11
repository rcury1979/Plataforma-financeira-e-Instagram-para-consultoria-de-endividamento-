export const SIGNUP_GIFT_BUCKET = "cadastro-brindes";
export const SIGNUP_GIFTS = [
  { id: "gcpm", filename: "metodo-gcpm.pdf", title: "Método GCPM", description: "Gerar, Cuidar, Proteger e Multiplicar, com exercícios e um plano de 30 dias.", pages: 8 },
  { id: "organizacao", filename: "organizacao-financeira.pdf", title: "Organização financeira", description: "Um caderno prático para organizar receitas, categorias, dívidas e metas.", pages: 8 },
] as const;

export function canReceiveSignupGifts(user: { email_confirmed_at?: string | null } | null): boolean {
  return Boolean(user?.email_confirmed_at);
}