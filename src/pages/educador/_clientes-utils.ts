/* Apoio das telas Início e Clientes da educadora: plano, convite, avatar e dados da própria educadora. */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "../cliente/_shared";

export type ClienteCad = {
  id: string; user_id: string; responsavel_id: string | null; nome: string; email: string | null;
  telefone: string | null; tipo_pessoa: "PF" | "PJ"; arquivado: boolean; cliente_user_id: string | null; created_at: string;
};

/** Vagas de clientes por plano. */
export const LIMITE_PLANO: Record<string, number> = { trial: 7, basic: 10, professional: 30, premium: 100 };
export const limiteDoPlano = (plano: string | null | undefined) => LIMITE_PLANO[plano ?? "trial"] ?? LIMITE_PLANO.trial;

export const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0] || "";
export const iniciais = (nome: string) =>
  nome.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

/** Cor estável do avatar, a partir do nome (azul, dourado ou verde suaves). */
const AVATAR_TONS = ["bg-primary/10 text-primary", "bg-gold-soft text-gold", "bg-success/10 text-success"];
export function avatarCls(nome: string) {
  let h = 0;
  for (const ch of nome) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TONS[h % AVATAR_TONS.length];
}

/** Link de cadastro que a educadora envia ao cliente. */
export const linkConvite = () =>
  `${window.location.origin}${import.meta.env.VITE_TEST_SITE === "1" ? "/#" : ""}/app/auth?mode=signup`;

export function mensagemConvite(cliente: string, educadora: string, email: string | null) {
  return [
    `Olá, ${primeiroNome(cliente)}! Tudo bem?`,
    `Preparei seu espaço na Área do Cliente R&M 360° para cuidarmos juntos da sua vida financeira, com calma e sem julgamentos.`,
    `É só criar sua conta por este link${email ? ` usando o e-mail ${email}` : ""} e confirmar o cadastro:`,
    linkConvite(),
    `Qualquer dúvida, estou por aqui.`,
    `Um abraço,`,
    educadora,
  ].join("\n");
}

export function whatsappUrl(telefone: string | null, texto: string) {
  let dig = (telefone ?? "").replace(/\D/g, "");
  if (dig && dig.length <= 11) dig = "55" + dig;
  return `https://wa.me/${dig}?text=${encodeURIComponent(texto)}`;
}

/** Dados da educadora logada: id, nome e plano. */
export function useEducadora() {
  const [me, setMe] = useState<{ id: string; nome: string; plano: string } | null>(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) return;
      const { data: p } = await db.from("profiles").select("full_name,plano,email").eq("user_id", u.id).maybeSingle();
      const nome = p?.full_name || (u.user_metadata?.full_name as string) || u.email || "";
      setMe({ id: u.id, nome, plano: p?.plano || "trial" });
    })();
  }, []);
  return me;
}
