/* Vídeos do Instagram exibidos no site. A lista oficial fica no banco (tabela reels_destaque, gerida em
 * Admin → Reels); esta lista padrão — os reels mais assistidos de @marta_curyy — aparece se o banco estiver vazio. */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const INSTAGRAM_HANDLE = "@marta_curyy";
export const INSTAGRAM_URL = "https://www.instagram.com/marta_curyy";

export type Reel = { code: string; title: string };

export const REELS_PADRAO: Reel[] = [
  { code: "DctPptmONll", title: "Quer uma simulação com a sua realidade atual?" },
  { code: "DdjgnRxB0EY", title: "Mesmo salário, resultados diferentes: o que muda?" },
  { code: "DcdgxXWgnNI", title: "Educação financeira na prática" },
  { code: "DdRauM9O-iJ", title: "Recebe um salário mínimo? Cada real precisa ter destino" },
  { code: "DctQWjfOzHx", title: "Educação financeira dentro da sua realidade" },
  { code: "Db_KKRmuO3i", title: "Duas pessoas, a mesma renda e resultados opostos" },
  { code: "Db8XL80uDKc", title: "Ganhar mais não basta: é preciso administrar" },
  { code: "DcIyRSBA_yX", title: "Seu salário trabalha pelos seus sonhos?" },
  { code: "DcJg_a9gYGn", title: "Dê um destino para cada parte do salário" },
];

export const reelUrl = (code: string) => `https://www.instagram.com/reel/${code}/`;

/** Carrega os reels ativos do banco; usa a lista padrão se o banco estiver vazio ou indisponível. */
export function useReels() {
  const [reels, setReels] = useState<Reel[]>(REELS_PADRAO);
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const { data } = await (supabase as any)
          .from("reels_destaque")
          .select("code, titulo")
          .eq("ativo", true)
          .order("ordem", { ascending: true });
        if (vivo && Array.isArray(data) && data.length > 0) {
          setReels(data.map((r: any) => ({ code: r.code, title: r.titulo })));
        }
      } catch {
        /* mantém a lista padrão */
      } finally {
        if (vivo) setCarregando(false);
      }
    })();
    return () => { vivo = false; };
  }, []);
  return { reels, carregando };
}
