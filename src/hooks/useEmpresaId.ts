import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Retorna o empresa_id do usuário atual (primeira empresa vinculada em usuario_empresas).
 * Todo usuário recebe automaticamente uma empresa padrão via trigger handle_new_user.
 */
export function useEmpresaId() {
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("usuario_empresas")
        .select("empresa_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      setEmpresaId(data?.empresa_id ?? null);
      setLoading(false);
    })();
  }, []);

  return { empresaId, loading };
}
