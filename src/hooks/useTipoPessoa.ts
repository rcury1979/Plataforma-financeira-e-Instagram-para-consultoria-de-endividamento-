import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TipoPessoa = "PF" | "PJ";

export function useTipoPessoa() {
  const [tipo, setTipo] = useState<TipoPessoa | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (alive) { setTipo(null); setLoading(false); } return; }
      const { data } = await (supabase as any)
        .from("profiles")
        .select("tipo_pessoa")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!alive) return;
      setTipo((data?.tipo_pessoa as TipoPessoa) ?? "PJ");
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  return { tipo, loading };
}
