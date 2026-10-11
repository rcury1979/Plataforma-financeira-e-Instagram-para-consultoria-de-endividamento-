import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listPfTransacoes from "./tools/list-pf-transacoes";
import createPfTransacao from "./tools/create-pf-transacao";
import listPfDividas from "./tools/list-pf-dividas";
import listPfMetas from "./tools/list-pf-metas";
import listLancamentos from "./tools/list-lancamentos";
import createLancamento from "./tools/create-lancamento";
import listClientes from "./tools/list-clientes";
import resumoFinanceiro from "./tools/resumo-financeiro";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "lovable-finance-hub",
  title: "Lovable Finance Hub",
  version: "0.1.0",
  instructions:
    "Ferramentas financeiras do Lovable Finance Hub. Use as ferramentas `pf` para finanças pessoais (lançamentos, dívidas, metas) e as ferramentas de empresa (lançamentos, clientes) para PJ. Use `resumo_financeiro` para totais de um período. Todos os dados são do usuário autenticado.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listPfTransacoes,
    createPfTransacao,
    listPfDividas,
    listPfMetas,
    listLancamentos,
    createLancamento,
    listClientes,
    resumoFinanceiro,
  ],
});
