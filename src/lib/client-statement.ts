export type StatementClient = { id: string; nome: string; tipo_pessoa: "PF" | "PJ" };
export function statementDestination(client: StatementClient | undefined, ownProfile: "PF" | "PJ") {
  return { table: client ? "lancamentos" : ownProfile === "PF" ? "pf_transacoes" : "lancamentos", cliente_id: client?.id ?? null, profile: client?.tipo_pessoa ?? ownProfile };
}