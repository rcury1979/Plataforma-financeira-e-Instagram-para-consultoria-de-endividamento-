import { Navigate } from "react-router-dom";
import { useTipoPessoa, type TipoPessoa } from "@/hooks/useTipoPessoa";

type Props = {
  allow: TipoPessoa;
  children: React.ReactNode;
};

/**
 * Bloqueia rotas por tipo de pessoa.
 * - PF tentando abrir módulo PJ é levado ao painel PF.
 * - PJ tentando abrir módulo PF é levado ao painel PJ.
 */
export function TipoPessoaGuard({ allow, children }: Props) {
  const { tipo, loading } = useTipoPessoa();
  if (loading) return <div className="min-h-[40vh]" />;
  if (tipo && tipo !== allow) {
    return <Navigate to={allow === "PJ" ? "/app/pf" : "/app"} replace />;
  }
  return <>{children}</>;
}
