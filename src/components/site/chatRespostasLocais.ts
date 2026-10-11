/* Respostas prontas do chat do site. Usadas quando a IA não responde (sem internet, servidor fora,
 * site de teste) — assim o visitante nunca fica sem resposta. */

const WHATS = "https://wa.me/5521986000039";

type Regra = { chaves: string[]; resposta: string };

const REGRAS: Regra[] = [
  {
    chaves: ["divid", "devend", "endivid", "nome sujo", "serasa", "negativ", "cartao", "cartão", "juros", "emprest", "boleto"],
    resposta:
      "Você não está sozinha(o) nisso. 💛 O primeiro passo é enxergar o tamanho real das dívidas, sem julgamento.\n\n" +
      "1. Liste cada dívida com valor, juros e parcela.\n2. Faça o **[Diagnóstico gratuito](/diagnostico)** — leva poucos minutos.\n" +
      `3. Fale com a Marta Cury pelo **[WhatsApp](${WHATS})** para montar um plano de saída possível.`,
  },
  {
    chaves: ["palestra", "igreja", "ministerio", "ministério", "evento", "grupo"],
    resposta:
      "As **palestras para igrejas, ministérios e grupos** são gratuitas e falam de finanças com acolhimento e fé. ✨\n\n" +
      "Veja os temas e peça a sua na página **[Palestras](/palestras)**, ou chame no **[WhatsApp](" + WHATS + ")**.",
  },
  {
    chaves: ["plano", "preço", "preco", "valor", "assinatura", "quanto custa", "plataforma", "app", "aplicativo", "sistema"],
    resposta:
      "O **R&M 360°** é o app da RM Consultoria, com o **Método GCPM** (Gerar, Cuidar, Proteger e Multiplicar): extrato, limites, dívidas, patrimônio, metas e acompanhamento com a educadora.\n\n" +
      "A assinatura começa com **7 dias grátis**: **R$ 25,99/mês** no contrato de 6 meses ou **R$ 21,99/mês** no de 12 meses — veja em **[Planos](/planos)**. Se for cliente da mentoria, o acesso vem junto — pergunte no **[WhatsApp](" + WHATS + ")**.",
  },
  {
    chaves: ["planilha", "baixar", "download", "orçamento", "orcamento"],
    resposta: "A **planilha de orçamento familiar** é gratuita! 🙌 Baixe em **[Planilha grátis](/planilha-gratis)**.",
  },
  {
    chaves: ["curso", "aula", "aprender", "estudar"],
    resposta: "Os **cursos online** ensinam a organizar o dinheiro e sair das dívidas no seu ritmo. Veja em **[Cursos](/cursos)**.",
  },
  {
    chaves: ["mentoria", "consultoria", "atendimento", "individual", "agendar", "agenda", "conversa", "reunião", "reuniao"],
    resposta:
      "A **mentoria individual** é para pessoas, famílias e empresas que querem um plano feito junto com a Marta Cury.\n\n" +
      "Você pode **[agendar uma conversa](/agendar)** ou chamar direto no **[WhatsApp](" + WHATS + ")**.",
  },
  {
    chaves: ["gcpm", "metodo", "método"],
    resposta:
      "O **Método GCPM** tem quatro passos: **Gerar** (organizar e aumentar a renda), **Cuidar** (gastos e dívidas sob controle), " +
      "**Proteger** (reserva para imprevistos) e **Multiplicar** (fazer o dinheiro crescer). Um passo de cada vez. 💛",
  },
  {
    chaves: ["empresa", "cnpj", "negocio", "negócio", "caixa", "pj"],
    resposta:
      "Para empresas, a RM ajuda a reorganizar o **fluxo de caixa**, renegociar dívidas e criar indicadores simples.\n\n" +
      "Faça o **[Diagnóstico](/diagnostico)** ou fale no **[WhatsApp](" + WHATS + ")**.",
  },
  {
    chaves: ["video", "vídeo", "reels", "instagram", "insta"],
    resposta:
      "Os vídeos mais assistidos estão na página **[Vídeos](/videos)**. 🎬\n\n" +
      "E tem conteúdo novo toda semana no Instagram: **[@marta_curyy](https://www.instagram.com/marta_curyy)**.",
  },
  {
    chaves: ["contato", "whatsapp", "telefone", "email", "e-mail", "instagram", "falar"],
    resposta:
      `Fale com a Marta Cury:\n- **WhatsApp:** [(21) 98600-0039](${WHATS})\n- **E-mail:** contato@rmconsultoria.finance\n- **Instagram:** [@marta_curyy](https://www.instagram.com/marta_curyy)`,
  },
];

const normalizar = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Resposta pronta para a pergunta, ou uma resposta geral com os caminhos principais. */
export function respostaLocal(pergunta: string): string {
  const p = normalizar(pergunta);
  const achou = REGRAS.find((r) => r.chaves.some((c) => p.includes(normalizar(c))));
  if (achou) return achou.resposta;
  return (
    "Posso te ajudar com **dívidas, orçamento, palestras, cursos e o app R&M 360°**. 💛\n\n" +
    "- **[Diagnóstico gratuito](/diagnostico)**\n- **[Planilha grátis](/planilha-gratis)**\n- **[Palestras](/palestras)**\n\n" +
    `Para algo específico, fale direto com a Marta Cury no **[WhatsApp](${WHATS})**.`
  );
}
