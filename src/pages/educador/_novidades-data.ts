/* Posts da tela Novidades. Cada parágrafo aceita **negrito** (entre dois asteriscos).
 * Para publicar um post novo, acrescente no topo da lista com um id único. */
export type TipoNovidade = "Novidade" | "Melhoria" | "Correção";
export type Novidade = { id: string; data: string; tipo: TipoNovidade; titulo: string; corpo: string[] };

export const NOVIDADES: Novidade[] = [
  {
    id: "2026-10-09-seguranca",
    data: "2026-10-09",
    tipo: "Melhoria",
    titulo: "Mais segurança: cada educadora vê só os próprios clientes",
    corpo: [
      "Reforçamos as regras de acesso do R&M 360°. A partir de agora, **cada educadora só enxerga os clientes que ela mesma cadastrou** — os dados de um cliente nunca aparecem para outra educadora, nem por engano.",
      "**Convite por e-mail.** Para dar acesso a um cliente, cadastre-o em Clientes com o e-mail dele e envie o convite. Enquanto ele não criar a conta, o cartão aparece como **convite pendente**. Assim que ele entrar, o vínculo é feito sozinho e você passa a acompanhar a área dele.",
      "**Cliente arquivado não é acessado.** Se você arquivar um cliente, o acesso aos dados dele fica bloqueado até você reativá-lo. As regras valem direto no banco de dados, não só nas telas.",
    ],
  },
  {
    id: "2026-10-09-importacao-ia",
    data: "2026-10-09",
    tipo: "Novidade",
    titulo: "Importe extrato e fatura com ajuda da IA",
    corpo: [
      "Lançar gasto por gasto cansa — e é aí que muita gente desiste. Agora o cliente pode **enviar o extrato do banco ou a fatura do cartão** (PDF, foto ou planilha) e a IA lê o arquivo e monta os lançamentos.",
      "**Revisão antes de salvar.** Nada entra direto: a IA sugere a data, o valor, a descrição e a **categoria de cada linha**, e o cliente confere, corrige o que quiser e só então confirma. Lançamentos repetidos são apontados para não duplicar.",
      "**Onde fica.** Na área do cliente, em **Importar com IA**. Você, educadora, também pode fazer a importação pela ficha do cliente, durante a reunião.",
    ],
  },
  {
    id: "2026-10-09-ficha-cliente",
    data: "2026-10-09",
    tipo: "Novidade",
    titulo: "Ficha do cliente, tarefas e diário de reuniões",
    corpo: [
      "Em **Clientes**, ao abrir um cliente vinculado você entra na **ficha completa** dele: as mesmas telas que ele vê — dashboard, extrato, limites, dívidas, patrimônio e objetivos — para acompanhar tudo sem pedir print.",
      "**Tarefas combinadas.** Crie tarefas para o cliente com prazo e descrição. Ele vê na área dele, marca como concluída e pode comentar. Aqui em **Tarefas** você acompanha as de todos os clientes de uma vez, com destaque para as **vencidas** — e ainda tem a aba **Minhas**, para as suas próprias pendências.",
      "**Diário de reuniões.** Registre o que foi conversado em cada encontro, os combinados e os próximos passos. Na reunião seguinte, o histórico está ali para retomar de onde pararam.",
    ],
  },
  {
    id: "2026-10-09-area-cliente",
    data: "2026-10-09",
    tipo: "Novidade",
    titulo: "Nova Área do Cliente com o Método GCPM",
    corpo: [
      "Seus clientes ganharam uma área nova, pensada do zero com o **Método GCPM — Gerar, Cuidar, Proteger e Multiplicar**. Linguagem simples, sem julgamento, e que funciona bem no celular.",
      "**O que tem lá.** Um **dashboard** com o resumo do mês, o **extrato** com receitas, despesas e transferências, **limites de gastos** por categoria, controle de **cartões e faturas**, **dívidas**, **patrimônio**, **despesas não recorrentes** e **planejamento de objetivos** com prazo e prioridade.",
      "**Para começar.** O cliente entra com o e-mail do convite, cadastra as contas e os cartões em Configurações e já recebe as categorias padrão — que você pode personalizar em **Configurações → Categorias padrão**.",
    ],
  },
];
