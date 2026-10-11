/* Cálculo do Planejamento de futuro (tudo em valores reais, "a valor de hoje"). */

export type Premissas = {
  idade: number; aposentar: number; renda: number; aporte: number;
  taxa: number; inflacao: number; viverAte: number; inicial: number;
};
/** Saída de caixa (objetivo) em uma idade, já descontado o bem vendido. */
export type Saida = { idade: number; valor: number };

export type Ponto = { idade: number; atual: number; consumir: number; renda: number };

export type Resultado = {
  rMes: number; rAno: number;
  pontos: Ponto[];
  /** Patrimônio na aposentadoria em cada cenário. */
  patAtual: number; metaConsumir: number; metaRenda: number;
  /** Aporte mensal necessário em cada cenário (null = impossível com taxa real ≤ 0). */
  aporteConsumir: number; aporteRenda: number | null;
  /** Idade em que a projeção atual zera (null = dura até viver_até). */
  acabaAos: number | null;
};

const pv = (v: number, r: number, meses: number) => v / Math.pow(1 + r, meses);

/** Simula mês a mês: aporta até a aposentadoria, depois saca a renda. Objetivos saem no início da idade-alvo. */
function simular(p: Premissas, saidas: Saida[], aporte: number, rMes: number) {
  let w = p.inicial;
  const anual: number[] = [];
  let acabaAos: number | null = null;
  for (let idade = p.idade; idade <= p.viverAte; idade++) {
    for (const s of saidas) if (s.idade === idade) w -= s.valor;
    if (w < 0 && acabaAos === null && idade >= p.aposentar) acabaAos = idade;
    anual.push(w);
    if (idade === p.viverAte) break;
    for (let m = 0; m < 12; m++) {
      w = w * (1 + rMes) + (idade < p.aposentar ? aporte : -p.renda);
      if (w < 0 && acabaAos === null && idade >= p.aposentar) acabaAos = idade;
    }
  }
  return { anual, acabaAos };
}

export function calcular(p: Premissas, saidas: Saida[]): Resultado {
  const rAno = (1 + p.taxa / 100) / (1 + p.inflacao / 100) - 1;
  const rMes = Math.pow(1 + rAno, 1 / 12) - 1;
  const mesesAcum = Math.max(0, (p.aposentar - p.idade) * 12);
  const mesesRet = Math.max(0, (p.viverAte - p.aposentar) * 12);

  // objetivos depois da aposentadoria entram na meta, trazidos a valor da data de aposentadoria
  const posApos = saidas.filter((s) => s.idade >= p.aposentar).reduce((a, s) => a + pv(s.valor, rMes, (s.idade - p.aposentar) * 12), 0);
  const preApos = saidas.filter((s) => s.idade < p.aposentar);

  const anuidade = rMes === 0 ? p.renda * mesesRet : (p.renda * (1 - Math.pow(1 + rMes, -mesesRet))) / rMes;
  const metaConsumir = anuidade + posApos;
  const metaRenda = rAno > 0 ? (p.renda * 12) / rAno + posApos : Infinity;

  // valor na aposentadoria sem aportes (patrimônio inicial − objetivos antes da aposentadoria)
  let semAporte = p.inicial * Math.pow(1 + rMes, mesesAcum);
  for (const s of preApos) if (s.idade >= p.idade) semAporte -= s.valor * Math.pow(1 + rMes, (p.aposentar - s.idade) * 12);
  const fator = rMes === 0 ? mesesAcum : (Math.pow(1 + rMes, mesesAcum) - 1) / rMes; // valor futuro de R$1/mês
  const precisa = (meta: number) => (fator > 0 ? Math.max(0, (meta - semAporte) / fator) : 0);

  const aporteConsumir = precisa(metaConsumir);
  const aporteRenda = Number.isFinite(metaRenda) ? precisa(metaRenda) : null;
  const patAtual = semAporte + p.aporte * fator;

  const atual = simular(p, saidas, p.aporte, rMes);
  const cons = simular(p, saidas, aporteConsumir, rMes);
  const rend = aporteRenda !== null ? simular(p, saidas, aporteRenda, rMes) : null;

  // depois de zerar, a projeção fica em zero (não existe patrimônio negativo no gráfico)
  let zerou = false;
  const pontos: Ponto[] = atual.anual.map((v, i) => {
    const idade = p.idade + i;
    if (atual.acabaAos !== null && idade > atual.acabaAos) zerou = true;
    return {
      idade,
      atual: zerou ? 0 : Math.max(0, v),
      consumir: Math.max(0, cons.anual[i]),
      renda: rend ? Math.max(0, rend.anual[i]) : 0,
    };
  });

  return { rMes, rAno, pontos, patAtual, metaConsumir, metaRenda, aporteConsumir, aporteRenda, acabaAos: atual.acabaAos };
}
