import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  BookOpen, Users, Inbox, Wallet, Calendar, Sparkles, ChevronDown,
  ChevronLeft, CheckCircle2, ArrowRight, FileText, Search, Plus,
  TrendingUp, TrendingDown, AlertCircle, Home, MoreHorizontal,
} from "lucide-react";

type Tela = {
  nome: string;
  descricao: string;
  elementos: { label: string; texto: string }[];
  mock: React.ReactNode;
};

type Secao = {
  slug: string;
  icone: any;
  titulo: string;
  publico: "Todos" | "Funcionário" | "Administrador";
  resumo: string;
  telas: Tela[];
  passos: { titulo: string; texto: string }[];
  exemplo: string;
  dica?: string;
  atalho?: { label: string; to: string };
};

/* ---------- Mock components (visual approximations of real screens) ---------- */

const MockFrame = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <div className="rounded-xl border bg-background overflow-hidden shadow-sm">
    <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/50">
      <div className="flex gap-1">
        <span className="h-2 w-2 rounded-full bg-red-400/70" />
        <span className="h-2 w-2 rounded-full bg-yellow-400/70" />
        <span className="h-2 w-2 rounded-full bg-green-400/70" />
      </div>
      <span className="text-[10px] text-muted-foreground ml-2">{title}</span>
    </div>
    <div className="p-3">{children}</div>
  </div>
);

const MockClientes = () => (
  <MockFrame title="/app/clientes">
    <div className="flex items-center gap-2 mb-3">
      <div className="flex-1 h-8 rounded-md bg-muted flex items-center gap-2 px-2">
        <Search className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">Buscar cliente…</span>
      </div>
      <div className="h-8 px-2 rounded-md bg-primary/90 flex items-center gap-1">
        <Plus className="h-3 w-3 text-primary-foreground" />
        <span className="text-[10px] text-primary-foreground">Adicionar</span>
      </div>
    </div>
    <div className="space-y-2">
      {["Padaria do João", "Ateliê Marina", "Auto Peças SP"].map((n) => (
        <div key={n} className="flex items-center gap-2 p-2 rounded-md bg-muted/40">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
            <Users className="h-3 w-3 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-medium">{n}</div>
            <div className="text-[9px] text-muted-foreground">(11) 9•••• ••••</div>
          </div>
        </div>
      ))}
    </div>
  </MockFrame>
);

const MockLeads = () => (
  <MockFrame title="/app/leads">
    <div className="grid grid-cols-3 gap-1 mb-3">
      {[
        { l: "Novos", v: "4" },
        { l: "Contatados", v: "7" },
        { l: "Ganho", v: "2" },
      ].map((k) => (
        <div key={k.l} className="rounded-md bg-muted/40 p-1.5 text-center">
          <div className="text-[9px] text-muted-foreground">{k.l}</div>
          <div className="text-sm font-semibold">{k.v}</div>
        </div>
      ))}
    </div>
    <div className="space-y-1.5">
      {[
        { n: "Maria da Silva", s: "novo", v: "R$ 1.800" },
        { n: "João Souza", s: "proposta", v: "R$ 3.400" },
      ].map((l) => (
        <div key={l.n} className="flex items-center justify-between p-2 rounded-md border bg-background">
          <div>
            <div className="text-[11px] font-medium">{l.n}</div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary">{l.s}</span>
          </div>
          <div className="text-[10px] font-semibold">{l.v}</div>
        </div>
      ))}
    </div>
  </MockFrame>
);

const MockFinanceiro = () => (
  <MockFrame title="/app  (Financeiro)">
    <div className="grid grid-cols-2 gap-1.5 mb-3">
      {[
        { l: "A receber", v: "R$ 12.400", i: <TrendingUp className="h-3 w-3 text-green-500" /> },
        { l: "Em atraso", v: "R$ 3.200", i: <AlertCircle className="h-3 w-3 text-red-500" /> },
        { l: "Recebido/mês", v: "R$ 8.900", i: <Wallet className="h-3 w-3 text-primary" /> },
        { l: "Faturamento", v: "R$ 24.100", i: <TrendingUp className="h-3 w-3 text-primary" /> },
      ].map((k) => (
        <div key={k.l} className="rounded-md border p-2">
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground">{k.i}{k.l}</div>
          <div className="text-[11px] font-semibold mt-0.5">{k.v}</div>
        </div>
      ))}
    </div>
    <div className="mb-1 text-[9px] text-muted-foreground">Progresso do mês</div>
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <div className="h-full w-[62%] bg-primary" />
    </div>
  </MockFrame>
);

const MockFluxo = () => (
  <MockFrame title="/app/fluxo-caixa">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-medium">Novembro 2026</span>
      <div className="text-[10px] text-primary font-medium">+ Novo</div>
    </div>
    <div className="grid grid-cols-3 gap-1 mb-2">
      <div className="rounded-md bg-green-500/10 p-1.5 text-center">
        <div className="text-[9px] text-muted-foreground">Entradas</div>
        <div className="text-[11px] font-semibold text-green-600">R$ 14.2k</div>
      </div>
      <div className="rounded-md bg-red-500/10 p-1.5 text-center">
        <div className="text-[9px] text-muted-foreground">Saídas</div>
        <div className="text-[11px] font-semibold text-red-600">R$ 6.1k</div>
      </div>
      <div className="rounded-md bg-primary/10 p-1.5 text-center">
        <div className="text-[9px] text-muted-foreground">Saldo</div>
        <div className="text-[11px] font-semibold text-primary">R$ 8.1k</div>
      </div>
    </div>
    <div className="space-y-1">
      {[
        { d: "07/nov", t: "Recebimento cliente A", v: "+R$ 1.200", cor: "text-green-600" },
        { d: "06/nov", t: "Fornecedor XYZ", v: "-R$ 480", cor: "text-red-600" },
      ].map((r) => (
        <div key={r.t} className="flex items-center justify-between text-[10px] border-b py-1">
          <div>
            <div className="font-medium">{r.t}</div>
            <div className="text-muted-foreground">{r.d}</div>
          </div>
          <div className={`font-semibold ${r.cor}`}>{r.v}</div>
        </div>
      ))}
    </div>
  </MockFrame>
);

const MockSimuladores = () => (
  <MockFrame title="/app/simuladores">
    <div className="grid grid-cols-2 gap-1.5 mb-2">
      {["Investimentos", "Financiamento", "Aposentadoria", "Aluguel × Casa"].map((n) => (
        <div key={n} className="rounded-md border p-2 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-medium">{n}</span>
        </div>
      ))}
    </div>
    <div className="rounded-md bg-muted/40 p-2">
      <div className="text-[9px] text-muted-foreground mb-1">Resultado</div>
      <div className="text-sm font-semibold text-primary">R$ 6.842,15</div>
      <div className="text-[9px] text-muted-foreground">12 meses · aporte R$ 500 · 0,9% a.m.</div>
    </div>
  </MockFrame>
);

const MockImportar = () => (
  <MockFrame title="/app/importar-pdf">
    <div className="rounded-md border-2 border-dashed p-3 text-center mb-2">
      <FileText className="h-5 w-5 text-primary mx-auto mb-1" />
      <div className="text-[10px] font-medium">Arraste o PDF aqui</div>
      <div className="text-[9px] text-muted-foreground">extrato, boleto ou nota</div>
    </div>
    <div className="grid grid-cols-3 gap-1 mb-2">
      <div className="rounded bg-green-500/10 p-1 text-center text-[9px]">
        <div className="text-muted-foreground">Receitas</div><b>12</b>
      </div>
      <div className="rounded bg-red-500/10 p-1 text-center text-[9px]">
        <div className="text-muted-foreground">Despesas</div><b>8</b>
      </div>
      <div className="rounded bg-yellow-500/10 p-1 text-center text-[9px]">
        <div className="text-muted-foreground">A revisar</div><b>3</b>
      </div>
    </div>
    <div className="rounded-md border bg-yellow-500/5 border-yellow-500/30 p-2 text-[10px]">
      <div className="flex items-center gap-1 text-yellow-700 font-medium mb-1">
        <AlertCircle className="h-3 w-3" /> Sem descrição
      </div>
      <div className="text-muted-foreground">Edite antes de salvar</div>
    </div>
  </MockFrame>
);

/* ---------- Content ---------- */

const SECOES: Secao[] = [
  {
    slug: "clientes",
    icone: Users,
    titulo: "Clientes",
    publico: "Todos",
    resumo: "Cadastre e organize a base de clientes que já contrataram seu serviço.",
    telas: [
      {
        nome: "Lista de clientes",
        descricao: "Tela principal com todos os clientes ativos.",
        elementos: [
          { label: "Barra de busca", texto: "Filtra por nome ou telefone em tempo real." },
          { label: "Botão Adicionar", texto: "Abre o formulário de novo cadastro." },
          { label: "Aba Ativos / Arquivados", texto: "Alterna entre clientes em uso e histórico." },
          { label: "Cartão de cliente", texto: "Toque para ver detalhes, editar ou arquivar." },
        ],
        mock: <MockClientes />,
      },
    ],
    passos: [
      { titulo: "Abrir Clientes", texto: "No menu inferior, toque em Clientes." },
      { titulo: "Adicionar cliente", texto: "Toque em “Adicionar cliente” no topo da tela." },
      { titulo: "Preencher dados", texto: "Nome (obrigatório), telefone, e-mail e observações. Salvar." },
      { titulo: "Buscar e filtrar", texto: "Barra de busca por nome/telefone. Alterne Ativos ↔ Arquivados." },
      { titulo: "Arquivar", texto: "Cliente inativo → arquivar (não excluir) para preservar o histórico." },
    ],
    exemplo:
      "Ex.: “Padaria do João” finalizou o contrato. Arquive em vez de excluir para manter o histórico financeiro.",
    dica: "Prefira arquivar a excluir — lançamentos antigos continuam vinculados ao cliente.",
    atalho: { label: "Abrir Clientes", to: "/app/clientes" },
  },
  {
    slug: "leads",
    icone: Inbox,
    titulo: "Leads",
    publico: "Todos",
    resumo: "Contatos que ainda não são clientes — funil de prospecção.",
    telas: [
      {
        nome: "Painel de leads",
        descricao: "KPIs por status e lista de oportunidades em andamento.",
        elementos: [
          { label: "Cartões de status", texto: "Contadores rápidos: novos, contatados, ganhos." },
          { label: "Filtros", texto: "Origem (Instagram, indicação, site…) e status." },
          { label: "Cartão de lead", texto: "Mostra nome, status e valor estimado." },
          { label: "Ações rápidas", texto: "Mudar status, converter em cliente ou arquivar." },
        ],
        mock: <MockLeads />,
      },
    ],
    passos: [
      { titulo: "Abrir Leads", texto: "Menu inferior → Mais → Leads." },
      { titulo: "Novo lead", texto: "“Adicionar lead”: nome, telefone, e-mail, origem, status e valor estimado." },
      { titulo: "Atualizar status", texto: "novo → contatado → qualificado → proposta → ganho/perdido." },
      { titulo: "Converter em cliente", texto: "Ao ganhar, cadastre em Clientes e comece a lançar receitas." },
      { titulo: "Arquivar leads frios", texto: "Sem retorno → Arquivados. Não some do histórico." },
    ],
    exemplo:
      "Ex.: “Maria da Silva” veio pelo Instagram (R$ 1.800). Cadastre com origem Instagram, status novo e valor 1800.",
    dica: "Filtre por origem para descobrir qual canal traz mais clientes ganhos.",
    atalho: { label: "Abrir Leads", to: "/app/leads" },
  },
  {
    slug: "financeiro",
    icone: Wallet,
    titulo: "Financeiro",
    publico: "Todos",
    resumo: "Painel com receitas a receber, atrasos, recebidos do mês e faturamento.",
    telas: [
      {
        nome: "Dashboard financeiro",
        descricao: "Tela inicial do app — visão executiva em 30 segundos.",
        elementos: [
          { label: "4 KPIs", texto: "A receber · Em atraso · Recebido no mês · Faturamento." },
          { label: "Barra de progresso", texto: "Quanto do previsto do mês já entrou no caixa." },
          { label: "Próximos vencimentos", texto: "Lista dos títulos que vencem nos próximos dias." },
        ],
        mock: <MockFinanceiro />,
      },
    ],
    passos: [
      { titulo: "Abrir Financeiro", texto: "É a tela inicial do app (menu → Financeiro)." },
      { titulo: "Ler os KPIs", texto: "A receber = pendente. Em atraso = vencido. Recebido = já entrou." },
      { titulo: "Progresso do mês", texto: "Barra mostra o quanto já foi recebido do previsto." },
      { titulo: "A receber até o fim do mês", texto: "Priorize a cobrança dos títulos listados." },
      { titulo: "Ir para Lançamentos", texto: "Para registrar receita/despesa manual." },
    ],
    exemplo: "Ex.: KPI “Em atraso: R$ 3.200” → toque para ver quais clientes cobrar hoje.",
    dica: "Confira o Financeiro toda manhã: em 30 segundos você sabe o que precisa cobrar.",
    atalho: { label: "Abrir Financeiro", to: "/app" },
  },
  {
    slug: "fluxo-caixa",
    icone: Calendar,
    titulo: "Fluxo de Caixa",
    publico: "Todos",
    resumo: "Entradas e saídas de cada dia, com resumo mensal e lançamento manual.",
    telas: [
      {
        nome: "Fluxo mensal",
        descricao: "Cronograma de entradas e saídas por dia.",
        elementos: [
          { label: "Seletor de mês", texto: "Navegue entre meses no topo." },
          { label: "Resumo do mês", texto: "Entradas, saídas e saldo consolidado." },
          { label: "Lista diária", texto: "Toque em um dia para ver todos os lançamentos." },
          { label: "Novo lançamento", texto: "Registre entrada ou saída manual." },
        ],
        mock: <MockFluxo />,
      },
    ],
    passos: [
      { titulo: "Abrir Fluxo de Caixa", texto: "Menu → Mais → Fluxo de Caixa." },
      { titulo: "Escolher o mês", texto: "Seletor de mês no topo." },
      { titulo: "Lançamento manual", texto: "“Novo lançamento” → entrada/saída, valor, data, categoria." },
      { titulo: "Ler o resumo", texto: "Totais de entradas, saídas e saldo do mês." },
      { titulo: "Detalhar o dia", texto: "Toque no dia para ver todos os lançamentos." },
    ],
    exemplo: "Ex.: Recebeu R$ 500 em dinheiro fora de contrato? Lance como entrada manual, categoria “Avulso”.",
    dica: "Lance saídas no mesmo dia do gasto — evita esquecer e distorcer o saldo do mês.",
    atalho: { label: "Abrir Fluxo de Caixa", to: "/app/fluxo-caixa" },
  },
  {
    slug: "simuladores",
    icone: Sparkles,
    titulo: "Simuladores",
    publico: "Todos",
    resumo: "Cinco calculadoras financeiras para decisões rápidas.",
    telas: [
      {
        nome: "Menu de simuladores",
        descricao: "Escolha a calculadora e informe os parâmetros.",
        elementos: [
          { label: "Cinco calculadoras", texto: "Investimentos, Financiamento, Aposentadoria, Aluguel × Casa, Financ. × Consórcio." },
          { label: "Formulário", texto: "Valor inicial, aporte, taxa e prazo em meses." },
          { label: "Resultado", texto: "Valor projetado + resumo mês a mês." },
        ],
        mock: <MockSimuladores />,
      },
    ],
    passos: [
      { titulo: "Abrir Simuladores", texto: "Menu → Mais → Simuladores." },
      { titulo: "Escolher a calculadora", texto: "Toque na calculadora desejada." },
      { titulo: "Preencher parâmetros", texto: "Valor inicial, aporte, taxa e prazo. Calcular." },
      { titulo: "Ler o resultado", texto: "Valor projetado e resumo mês a mês." },
      { titulo: "Comparar cenários", texto: "Rode duas simulações (6 vs. 12 meses) para comparar." },
    ],
    exemplo: "Ex.: Investir R$ 500/mês por 12 meses a 0,9% a.m. → total acumulado ao final.",
    dica: "Use Aluguel × Casa antes de decidir compra — considere entrada e juros reais.",
    atalho: { label: "Abrir Simuladores", to: "/app/simuladores" },
  },
  {
    slug: "importar-pdf",
    icone: FileText,
    titulo: "Importar PDF (IA)",
    publico: "Todos",
    resumo: "Envie um PDF e a IA extrai e classifica cada lançamento automaticamente.",
    telas: [
      {
        nome: "Importação inteligente",
        descricao: "Extrato ou boleto vira lançamento em segundos.",
        elementos: [
          { label: "Área de upload", texto: "Arraste ou selecione o PDF." },
          { label: "Resumo automático", texto: "Contadores de receitas, despesas e itens a revisar." },
          { label: "Cartão amarelo", texto: "Lançamentos sem descrição — edite antes de salvar." },
          { label: "Botão Salvar", texto: "Só habilita quando tudo tem descrição." },
        ],
        mock: <MockImportar />,
      },
    ],
    passos: [
      { titulo: "Abrir Importar PDF", texto: "Menu → Mais → Importar PDF (IA)." },
      { titulo: "Enviar arquivo", texto: "Arraste o PDF ou toque para selecionar." },
      { titulo: "Aguardar a IA", texto: "Extrai data, valor, tipo e sugere categoria." },
      { titulo: "Revisar destaques", texto: "Cartões amarelos = descrição obrigatória. Edite todos." },
      { titulo: "Salvar em lote", texto: "Insere tudo de uma vez no Fluxo de Caixa." },
    ],
    exemplo: "Ex.: Extrato bancário com 20 movimentações → 17 classificadas, 3 pendem descrição. Edite e salve.",
    dica: "Confira sempre a categoria sugerida — a IA acerta muito, mas você conhece o negócio.",
    atalho: { label: "Abrir Importar PDF", to: "/app/importar-pdf" },
  },
];

const NAVEGACAO = [
  { icone: Home, label: "Financeiro", texto: "Tela inicial. KPIs e cobranças do dia." },
  { icone: Users, label: "Clientes", texto: "Base ativa e arquivada." },
  { icone: Calendar, label: "Fluxo de Caixa", texto: "Entradas × saídas por dia." },
  { icone: MoreHorizontal, label: "Mais", texto: "Leads, Simuladores, Importar PDF, Manual, Admin." },
];

const PARA_FUNCIONARIOS = [
  "Sempre entrar com a mesma conta pelo botão Entrar",
  "Cadastrar contatos primeiro em Leads; migrar para Clientes só ao fechar",
  "Registrar toda receita/despesa no mesmo dia",
  "Nunca excluir clientes — arquivar preserva o histórico",
  "Conferir Financeiro no início do turno e Fluxo de Caixa no fim",
];

const PARA_ADMINS = [
  "Acessar o Painel Administrativo em Mais → Administração",
  "Acompanhar KPIs consolidados de todos os usuários",
  "Padronizar origens de leads com a equipe (Instagram, Indicação, Site…)",
  "Rodar simuladores mensais para projetar caixa 3/6/12 meses",
  "Revisar contas em atraso semanalmente",
];

export default function Manual() {
  const [aberto, setAberto] = useState<string | null>("clientes");
  return (
    <div className="space-y-6 pb-24">
      <div>
        <Link
          to="/app/mais"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-[26px] font-serif font-semibold tracking-tight">Manual de uso</h1>
            <p className="text-sm text-muted-foreground">
              Tela por tela, com prévia visual e passo a passo.
            </p>
          </div>
        </div>
      </div>

      {/* Mapa de navegação */}
      <Card className="p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Como o app está organizado (barra inferior)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {NAVEGACAO.map((n) => {
            const I = n.icone;
            return (
              <div key={n.label} className="rounded-md border p-3">
                <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center mb-2">
                  <I className="h-4 w-4 text-primary" />
                </div>
                <div className="text-sm font-medium">{n.label}</div>
                <div className="text-xs text-muted-foreground">{n.texto}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Perfis */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Para funcionários</div>
          <ul className="space-y-2 text-sm">
            {PARA_FUNCIONARIOS.map((t) => (
              <li key={t} className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Para administradores</div>
          <ul className="space-y-2 text-sm">
            {PARA_ADMINS.map((t) => (
              <li key={t} className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Módulos, tela a tela */}
      <div className="space-y-3">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Módulos — tela a tela</h2>
        {SECOES.map((s) => {
          const Icon = s.icone;
          const isOpen = aberto === s.slug;
          return (
            <Card key={s.slug} className="overflow-hidden">
              <button
                onClick={() => setAberto(isOpen ? null : s.slug)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-secondary/40 transition"
              >
                <div className="h-10 w-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{s.titulo}</div>
                  <div className="text-xs text-muted-foreground truncate">{s.resumo}</div>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-2">
                  {s.publico}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-5 border-t bg-muted/30">
                  {/* Telas com mock */}
                  {s.telas.map((t, idx) => (
                    <div key={idx} className="mt-4 grid gap-3 md:grid-cols-2 items-start">
                      <div>{t.mock}</div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-primary mb-1">
                          Tela: {t.nome}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{t.descricao}</p>
                        <ul className="space-y-2">
                          {t.elementos.map((el) => (
                            <li key={el.label} className="text-sm">
                              <span className="font-medium">{el.label}:</span>{" "}
                              <span className="text-muted-foreground">{el.texto}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}

                  {/* Passos */}
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
                      Passo a passo
                    </div>
                    <ol className="space-y-3">
                      {s.passos.map((p, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                            {i + 1}
                          </span>
                          <div>
                            <div className="text-sm font-medium">{p.titulo}</div>
                            <div className="text-xs text-muted-foreground">{p.texto}</div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="rounded-md bg-background border p-3 text-sm">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                      Exemplo prático
                    </div>
                    <p>{s.exemplo}</p>
                  </div>
                  {s.dica && (
                    <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-sm">
                      <div className="text-[11px] uppercase tracking-wider text-primary mb-1">Dica</div>
                      <p className="text-muted-foreground">{s.dica}</p>
                    </div>
                  )}
                  {s.atalho && (
                    <Link
                      to={s.atalho.to}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      {s.atalho.label} <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
