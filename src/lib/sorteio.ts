/* Sorteio ao vivo: avatares e acesso às tabelas novas (fora dos tipos gerados do Supabase). */
import { supabase } from "@/integrations/supabase/client";

export const AVATARES = [
  "🦊", "🐱", "🐼", "🦄", "🐸", "🐵", "🐧", "🦁", "🐯", "🐨", "🐰", "🐻",
  "🦋", "🐙", "🐢", "🦉", "🌸", "🌻", "⭐", "🚀", "💎", "👑", "🍀", "🔥",
] as const;

/** Cores de fundo das bolinhas dos avatares (só decoração; o nome sempre aparece junto). */
export const CORES_AVATAR = ["#f3dfa6", "#cfe3f7", "#f7d6e0", "#d7efd8", "#e6dcf7", "#fde2c8"];
export const corDoAvatar = (seed: string) => CORES_AVATAR[[...seed].reduce((t, c) => t + c.charCodeAt(0), 0) % CORES_AVATAR.length];

type Resposta<T> = { data: T | null; error: { message: string } | null };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Consulta = any;
/** Cliente sem tipos para as tabelas do sorteio (a segurança está nas regras do banco). */
export const dbSorteio = supabase as unknown as {
  from: (tabela: string) => Consulta;
  rpc: <T = unknown>(funcao: string, args?: object) => Promise<Resposta<T>>;
};
