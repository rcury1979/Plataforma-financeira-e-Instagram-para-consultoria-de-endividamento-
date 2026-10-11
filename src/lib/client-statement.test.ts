import { expect, it } from "vitest";
import { statementDestination } from "./client-statement";
it("vincula extratos PF ao cliente explícito, não ao perfil do administrador", () => {
  expect(statementDestination({ id: "pf-client", nome: "Cliente PF", tipo_pessoa: "PF" }, "PJ")).toEqual({ table: "lancamentos", cliente_id: "pf-client", profile: "PF" });
});
it("isola extratos PJ pelo identificador do cliente", () => {
  expect(statementDestination({ id: "pj-client", nome: "Empresa", tipo_pessoa: "PJ" }, "PF")).toEqual({ table: "lancamentos", cliente_id: "pj-client", profile: "PJ" });
});
it("preserva lançamentos pessoais sem um cliente selecionado", () => {
  expect(statementDestination(undefined, "PF")).toEqual({ table: "pf_transacoes", cliente_id: null, profile: "PF" });
});