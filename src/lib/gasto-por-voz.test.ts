import { describe, expect, it } from "vitest";
import { interpretarGasto, extensoParaNumero, type CategoriaVoz } from "./gasto-por-voz";

const cats: CategoriaVoz[] = [
  { id: "mer", nome: "Mercado", tipo: "despesa" },
  { id: "ali", nome: "Alimentação", tipo: "despesa" },
  { id: "tra", nome: "Transporte", tipo: "despesa" },
  { id: "sau", nome: "Saúde", tipo: "despesa" },
  { id: "out", nome: "Outros", tipo: "despesa" },
  { id: "sal", nome: "Salário", tipo: "receita" },
  { id: "pet", nome: "Pet", tipo: "despesa" },
];
const contas = [{ id: "itau", nome: "Itaú" }, { id: "carteira", nome: "Dinheiro" }];
const cartoes = [{ id: "nu", nome: "Nubank" }, { id: "inter", nome: "Cartão Inter" }];
const hoje = new Date(2026, 10, 18); // 18/11/2026 (quarta)
const run = (f: string) => interpretarGasto(f, { categorias: cats, contas, cartoes, hoje });

describe("interpretarGasto", () => {
  it("valor, categoria, data e cartão", () => {
    const g = run("Gastei 45 reais no mercado ontem no cartão Nubank");
    expect(g).toMatchObject({ tipo: "despesa", valor: 45, categoriaId: "mer", data: "2026-11-17", origem: "cartao:nu" });
    expect(g.descricao).toBe("Mercado");
  });
  it("centavos com vírgula e com 'e'", () => {
    expect(run("uber 23,90").valor).toBe(23.9);
    expect(run("paguei 12 reais e 50 centavos de pão").valor).toBe(12.5);
    expect(run("R$ 1.250,00 aluguel").valor).toBe(1250);
  });
  it("palavra-chave leva à categoria padrão", () => {
    const g = run("almoço 32 reais");
    expect(g.categoriaId).toBe("ali");
    expect(g.descricao).toBe("Almoço");
    expect(run("farmácia 80").categoriaId).toBe("sau");
    expect(run("gasolina 150 no itaú")).toMatchObject({ categoriaId: "tra", origem: "conta:itau" });
  });
  it("categoria do próprio cliente pelo nome", () => {
    expect(run("ração do pet 90 reais").categoriaId).toBe("pet");
  });
  it("sugere criar categoria que o cliente não tem", () => {
    const g = run("netflix 55,90");
    expect(g.categoriaId).toBeNull();
    expect(g.categoriaNova).toBe("Assinaturas");
  });
  it("sem categoria reconhecida vai para Outros", () => {
    expect(run("presente da Ana 70 reais").categoriaId).toBe("out");
  });
  it("números por extenso", () => {
    expect(extensoParaNumero("mil duzentos e cinquenta")).toBe(1250);
    expect(run("gastei cinquenta reais de gasolina").valor).toBe(50);
    expect(run("comprei uma pizza de quarenta e cinco reais").valor).toBe(45);
  });
  it("receita", () => {
    expect(run("recebi meu salário de 3.500 reais")).toMatchObject({ tipo: "receita", valor: 3500, categoriaId: "sal" });
  });
  it("datas", () => {
    expect(run("mercado 100 dia 10").data).toBe("2026-11-10");
    expect(run("mercado 100 dia 25").data).toBe("2026-10-25");
    expect(run("mercado 100 anteontem").data).toBe("2026-11-16");
    expect(run("mercado 100 na segunda").data).toBe("2026-11-16");
    expect(run("mercado 100").data).toBe("2026-11-18");
  });
  it("pix/débito usa conta; 'cartão' sem nome usa o primeiro cartão", () => {
    expect(run("padaria 15 no pix").origem).toBe("conta:itau");
    expect(run("padaria 15 no cartão").origem).toBe("cartao:nu");
    expect(run("padaria 15 no inter").origem).toBe("cartao:inter");
  });
  it("sem valor", () => {
    expect(run("mercado").valor).toBeNull();
  });
});
