/* Lê uma frase falada (ou digitada) e transforma em um lançamento:
 * "gastei 45 reais no mercado ontem no cartão Nubank" → despesa, R$ 45,00, Mercado, ontem, cartão Nubank.
 * Tudo roda no aparelho, sem enviar a fala para servidores. */

export type CategoriaVoz = { id: string; nome: string; tipo: "despesa" | "receita"; parent_id?: string | null };
export type ContaVoz = { id: string; nome: string };

export type GastoInterpretado = {
  tipo: "despesa" | "receita";
  valor: number | null;
  data: string; // YYYY-MM-DD
  descricao: string;
  /** id de uma categoria existente do cliente */
  categoriaId: string | null;
  /** nome sugerido quando o cliente ainda não tem a categoria (pode ser criada ao salvar) */
  categoriaNova: string | null;
  /** "conta:<id>" ou "cartao:<id>" ou "" */
  origem: string;
};

export const normalizar = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

/* ---------------- números por extenso ---------------- */
const UNIDADES: Record<string, number> = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9,
  dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14, quinze: 15, dezesseis: 16, dezessete: 17,
  dezoito: 18, dezenove: 19, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70,
  oitenta: 80, noventa: 90, cem: 100, cento: 100, duzentos: 200, duzentas: 200, trezentos: 300, quatrocentos: 400,
  quinhentos: 500, seiscentos: 600, setecentos: 700, oitocentos: 800, novecentos: 900,
};
const PALAVRA_NUM = new RegExp(`\\b(?:${[...Object.keys(UNIDADES), "mil", "e"].join("|")})\\b`);

/** "mil duzentos e cinquenta" → 1250. Retorna null se não for número. */
export function extensoParaNumero(txt: string): number | null {
  const ps = normalizar(txt).split(" ").filter((p) => p && p !== "e");
  if (!ps.length) return null;
  let total = 0, atual = 0;
  for (const p of ps) {
    if (p === "mil") { total += (atual || 1) * 1000; atual = 0; continue; }
    if (!(p in UNIDADES)) return null;
    atual += UNIDADES[p];
  }
  return total + atual;
}

/** Converte trechos por extenso em dígitos: "cinquenta e dois reais" → "52 reais". */
function extensosEmDigitos(t: string): string {
  const palavras = t.split(" ");
  const out: string[] = [];
  let buf: string[] = [];
  const flush = () => {
    // "e" sozinho no fim não faz parte do número
    while (buf.length && buf[buf.length - 1] === "e") { out.push(...[]); buf.pop(); }
    const n = buf.length ? extensoParaNumero(buf.join(" ")) : null;
    if (n !== null && buf.some((b) => b !== "e" && b !== "um" && b !== "uma")) out.push(String(n));
    else if (n !== null && buf.length) out.push(...buf); // "um/uma" isolado continua palavra (ex.: "uma pizza")
    buf = [];
  };
  for (const w of palavras) {
    const isNum = PALAVRA_NUM.test(w) && (w !== "e" || buf.length > 0);
    if (isNum) buf.push(w);
    else { flush(); out.push(w); }
  }
  flush();
  return out.join(" ").replace(/(\d+) e (?=reais|real\b)/g, "$1 ");
}

/* ---------------- valor ---------------- */
function numeroBR(s: string): number {
  const t = s.trim();
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(t)) return Number(t.replace(/\./g, "").replace(",", "."));
  if (/^\d+,\d{1,2}$/.test(t)) return Number(t.replace(",", "."));
  if (/^\d+\.\d{1,2}$/.test(t)) return Number(t);
  if (/^\d{1,3}(,\d{3})+$/.test(t)) return Number(t.replace(/,/g, ""));
  return Number(t.replace(/\./g, ""));
}

const RE_VALORES = [
  // 45 reais e 90 centavos | 45 reais com 90
  /(\d[\d.]*)\s*(?:reais|real)\s*(?:e|com)\s*(\d{1,2})(?:\s*centavos?)?/,
  // R$ 45,90 | R$45 | 45,90 reais | 1.200 reais
  /r\$\s*(\d[\d.,]*)/,
  /(\d[\d.,]*)\s*(?:reais|real|conto|contos|pila|pilas)\b/,
  // 45 e 90 (sem "reais")
  /\b(\d+)\s*e\s*(\d{2})\b(?!\s*(?:de|do|da)\b)/,
  // qualquer número que não seja dia ("dia 15")
  /(?<!dia\s)(?<![\d/])(\d[\d.,]*)(?![\d/])/,
];

function extrairValor(t: string): { valor: number | null; resto: string } {
  for (const re of RE_VALORES) {
    const m = t.match(re);
    if (!m) continue;
    let v = numeroBR(m[1].replace(/[.,]$/, ""));
    if (m[2]) v += Number(m[2]) / 100;
    if (Number.isFinite(v) && v > 0) return { valor: Math.round(v * 100) / 100, resto: t.replace(m[0], " ") };
  }
  return { valor: null, resto: t };
}

/* ---------------- data ---------------- */
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const DIAS = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

function extrairData(t: string, hoje: Date): { data: string; resto: string } {
  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const menos = (n: number) => { const d = new Date(base); d.setDate(d.getDate() - n); return iso(d); };
  let m = t.match(/\banteontem\b/);
  if (m) return { data: menos(2), resto: t.replace(m[0], " ") };
  m = t.match(/\bontem\b/);
  if (m) return { data: menos(1), resto: t.replace(m[0], " ") };
  m = t.match(/\bhoje\b/);
  if (m) return { data: iso(base), resto: t.replace(m[0], " ") };
  // "dia 15" / "no dia 3/11"
  m = t.match(/\b(?:no\s+)?dia\s+(\d{1,2})(?:\s*(?:\/|de)\s*(\d{1,2}))?\b/);
  if (m) {
    const dia = Number(m[1]);
    let mes = m[2] ? Number(m[2]) - 1 : base.getMonth();
    let ano = base.getFullYear();
    let d = new Date(ano, mes, dia);
    if (!m[2] && d > base) { mes -= 1; d = new Date(ano, mes, dia); }
    if (m[2] && d > base) { ano -= 1; d = new Date(ano, mes, dia); }
    if (dia >= 1 && dia <= 31) return { data: iso(d), resto: t.replace(m[0], " ") };
  }
  // "na segunda", "sexta-feira passada"
  m = t.match(/\b(?:na |no |nesta |neste |nessa |nesse )?(domingo|segunda|terca|quarta|quinta|sexta|sabado)(?:[- ]feira)?(?: passad[ao])?\b/);
  if (m) {
    const alvo = DIAS.indexOf(m[1]);
    let diff = (base.getDay() - alvo + 7) % 7;
    if (diff === 0 && /passad/.test(m[0])) diff = 7;
    return { data: menos(diff), resto: t.replace(m[0], " ") };
  }
  return { data: iso(base), resto: t };
}

/* ---------------- tipo ---------------- */
const RE_RECEITA = /\b(recebi|ganhei|entrou|entraram|caiu|cairam|salario|vendi|pagamento recebido|me pagaram|me pagou|rendeu|rendimento)\b/;

/* ---------------- categorias ---------------- */
/** Palavras que indicam cada categoria padrão (nomes como em CATEGORIAS_PADRAO). */
export const PALAVRAS_CATEGORIA: [string, string[]][] = [
  ["Mercado", ["mercado", "supermercado", "atacadao", "assai", "carrefour", "hortifruti", "feira", "sacolao", "acougue", "compras do mes"]],
  ["Alimentação", ["restaurante", "lanche", "lanchonete", "almoco", "jantar", "janta", "cafe", "padaria", "pao", "pizza", "hamburguer", "ifood", "delivery", "marmita", "sorvete", "acai", "bar", "cerveja", "comida", "salgado", "doce", "quentinha", "churrasco", "sushi"]],
  ["Transporte", ["uber", "99", "taxi", "onibus", "metro", "barca", "trem", "gasolina", "combustivel", "etanol", "alcool", "diesel", "posto", "estacionamento", "pedagio", "passagem", "bilhete unico", "oficina", "mecanico", "ipva", "carro", "moto", "bicicleta"]],
  ["Moradia", ["aluguel", "condominio", "luz", "energia", "enel", "light", "agua", "gas", "iptu", "internet", "telefone", "celular", "conta de luz", "conta de agua", "reforma", "moveis", "faxina", "diarista", "casa"]],
  ["Saúde", ["farmacia", "remedio", "medicamento", "medico", "consulta", "exame", "dentista", "plano de saude", "hospital", "psicologo", "terapia", "academia", "drogaria", "vacina", "fisioterapia"]],
  ["Educação", ["escola", "faculdade", "curso", "livro", "material escolar", "mensalidade escolar", "apostila", "aula", "ingles", "creche"]],
  ["Lazer", ["cinema", "show", "viagem", "passeio", "hotel", "parque", "teatro", "festa", "jogo", "ingresso", "praia", "clube", "boliche"]],
  ["Vestuário", ["roupa", "roupas", "sapato", "tenis", "camisa", "camiseta", "calca", "vestido", "bermuda", "bolsa", "loja de roupa", "sandalia", "chinelo"]],
  ["Assinaturas", ["netflix", "spotify", "amazon prime", "prime video", "disney", "hbo", "max", "globoplay", "youtube premium", "assinatura", "icloud", "deezer", "apple"]],
  ["Dívidas", ["divida", "emprestimo", "parcela do emprestimo", "financiamento", "fatura atrasada", "acordo", "consignado", "juros"]],
  ["Investimentos", ["investimento", "investi", "tesouro", "poupanca", "cdb", "acoes", "previdencia", "aplicacao", "apliquei"]],
  ["Dízimo e doações", ["dizimo", "oferta", "doacao", "igreja", "caridade", "doei"]],
  ["Seguros", ["seguro", "seguro do carro", "seguro de vida"]],
  ["Beleza", ["salao", "cabelo", "cabeleireiro", "manicure", "unha", "barbeiro", "barbearia", "maquiagem", "perfume", "estetica", "depilacao", "sobrancelha", "cosmetico"]],
  ["Salário", ["salario", "pagamento do mes", "holerite"]],
  ["Renda extra", ["freela", "freelance", "bico", "venda", "vendi", "comissao", "renda extra"]],
  ["Rendimentos", ["rendimento", "rendeu", "dividendos", "juros recebidos"]],
];

const contemPalavra = (t: string, p: string) => new RegExp(`(?:^|[^a-z0-9])${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[^a-z0-9])`).test(t);

function escolherCategoria(t: string, tipo: "despesa" | "receita", cats: CategoriaVoz[]) {
  const doTipo = cats.filter((c) => c.tipo === tipo);
  // 1) nome de uma categoria do próprio cliente dito na frase (a mais específica/longa primeiro)
  const porNome = [...doTipo].sort((a, b) => b.nome.length - a.nome.length).find((c) => contemPalavra(t, normalizar(c.nome)));
  if (porNome) return { categoriaId: porNome.id, categoriaNova: null, palavra: normalizar(porNome.nome) };
  // 2) palavras-chave → categoria padrão (a palavra mais longa encontrada vence)
  let melhor: { nome: string; palavra: string } | null = null;
  for (const [nome, palavras] of PALAVRAS_CATEGORIA) {
    const ehReceita = ["Salário", "Renda extra", "Rendimentos"].includes(nome);
    if (ehReceita !== (tipo === "receita")) continue;
    for (const p of palavras) if (contemPalavra(t, p) && (!melhor || p.length > melhor.palavra.length)) melhor = { nome, palavra: p };
  }
  if (melhor) {
    const existente = doTipo.find((c) => normalizar(c.nome) === normalizar(melhor!.nome));
    return existente
      ? { categoriaId: existente.id, categoriaNova: null, palavra: melhor.palavra }
      : { categoriaId: null, categoriaNova: melhor.nome, palavra: melhor.palavra };
  }
  const outros = doTipo.find((c) => ["outros", "outras receitas"].includes(normalizar(c.nome)));
  return { categoriaId: outros?.id ?? null, categoriaNova: null, palavra: null };
}

/* ---------------- forma de pagamento ---------------- */
function escolherOrigem(t: string, tipo: "despesa" | "receita", contas: ContaVoz[], cartoes: ContaVoz[]) {
  const porNome = <T extends ContaVoz>(xs: T[]) =>
    [...xs].sort((a, b) => b.nome.length - a.nome.length).find((x) => {
      const n = normalizar(x.nome).replace(/^(cartao|conta|banco)\s+/, "");
      return n.length >= 2 && contemPalavra(t, n);
    });
  const falouCartao = /\b(cartao|credito|parcelad[oa]|fatura)\b/.test(t) && !/\bdebito\b/.test(t);
  if (tipo === "despesa") {
    const k = porNome(cartoes);
    if (k && (falouCartao || !porNome(contas))) return `cartao:${k.id}`;
    if (falouCartao && cartoes.length) return `cartao:${cartoes[0].id}`;
  }
  const c = porNome(contas);
  if (c) return `conta:${c.id}`;
  return contas[0] ? `conta:${contas[0].id}` : "";
}

/* ---------------- descrição ---------------- */
const FILLERS = new Set([
  "gastei", "gasto", "paguei", "pago", "comprei", "compra", "foi", "foram", "deu", "custou", "de", "do", "da", "dos", "das",
  "no", "na", "nos", "nas", "em", "com", "um", "uma", "o", "a", "os", "as", "e", "pra", "para", "pro", "por", "reais", "real",
  "centavos", "centavo", "r$", "cartao", "credito", "debito", "pix", "dinheiro", "conta", "via", "pelo", "pela", "meu", "minha",
  "recebi", "ganhei", "entrou", "caiu", "lancar", "lanca", "anota", "anotar", "registra", "registrar", "coloca", "colocar", "despesa",
  "receita", "hoje", "ontem", "passado", "passada", "feira", "fiz", "tive", "agora", "ai", "la", "aqui", "tambem", "so", "mais",
  "conto", "contos", "pila", "pilas", "valor", "isso", "que", "eu", "me", "parcelado", "parcelada", "fatura", "vista", "à",
]);

function montarDescricao(original: string, restoNorm: string, palavraCategoria: string | null, contasNomes: string[], categoriaNome: string | null) {
  let r = restoNorm;
  for (const n of contasNomes) {
    const nn = normalizar(n).replace(/^(cartao|conta|banco)\s+/, "");
    if (nn.length >= 2) r = r.replace(new RegExp(`(?:^|\\s)${nn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`, "g"), " ");
  }
  const palavras = r.split(/\s+/).filter((w) => w && !FILLERS.has(w) && !/^\d/.test(w));
  // recupera acentos do texto original
  const origPalavras = original.split(/\s+/);
  const comAcento = (w: string) => origPalavras.find((o) => normalizar(o).replace(/[^a-z0-9]/g, "") === w) ?? w;
  let desc = palavras.map(comAcento).join(" ").replace(/[.,;!?]+$/g, "").trim();
  if (!desc && palavraCategoria) desc = comAcento(palavraCategoria);
  if (!desc && categoriaNome) desc = categoriaNome;
  if (!desc) desc = "Gasto";
  return desc.charAt(0).toUpperCase() + desc.slice(1);
}

/** Interpreta a frase. `hoje` existe para os testes. */
export function interpretarGasto(
  frase: string,
  opts: { categorias: CategoriaVoz[]; contas: ContaVoz[]; cartoes: ContaVoz[]; hoje?: Date },
): GastoInterpretado {
  const hoje = opts.hoje ?? new Date();
  let t = normalizar(frase).replace(/[!?;]/g, " ");
  t = extensosEmDigitos(t);
  const tipo: "despesa" | "receita" = RE_RECEITA.test(t) ? "receita" : "despesa";
  const { data, resto: r1 } = extrairData(t, hoje);
  const { valor, resto: r2 } = extrairValor(r1);
  const cat = escolherCategoria(r2, tipo, opts.categorias);
  const origem = escolherOrigem(r2, tipo, opts.contas, opts.cartoes);
  const catNome = cat.categoriaId ? opts.categorias.find((c) => c.id === cat.categoriaId)?.nome ?? null : cat.categoriaNova;
  const descricao = montarDescricao(frase, r2.replace(/[.,]/g, " "), cat.palavra, [...opts.contas, ...opts.cartoes].map((x) => x.nome), catNome);
  return { tipo, valor, data, descricao, categoriaId: cat.categoriaId, categoriaNova: cat.categoriaNova, origem };
}
