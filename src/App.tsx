import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as WebRouter, HashRouter, Routes, Route } from "react-router-dom";

// Build de teste (VITE_TEST_SITE=1) usa rotas com # para funcionar em qualquer endereço.
const BrowserRouter = import.meta.env.VITE_TEST_SITE === "1" ? HashRouter : WebRouter;
import Home from "./pages/Home";
const Cursos = lazy(() => import("./pages/Cursos"));
const Palestras = lazy(() => import("./pages/Palestras"));
const Videos = lazy(() => import("./pages/Videos"));
const Diagnostico = lazy(() => import("./pages/Diagnostico"));
const Blog = lazy(() => import("./pages/Blog"));
const Sobre = lazy(() => import("./pages/Sobre"));
const Contato = lazy(() => import("./pages/Contato"));
const PlanilhaGratis = lazy(() => import("./pages/PlanilhaGratis"));
const ComoInstalar = lazy(() => import("./pages/ComoInstalar"));
const QueroAjuda = lazy(() => import("./pages/QueroAjuda"));
const Agendar = lazy(() => import("./pages/Agendar"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Diag = lazy(() => import("./pages/Diag"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));
const Planos = lazy(() => import("./pages/Planos"));
const PagamentoSucesso = lazy(() => import("./pages/PagamentoSucesso"));
const PagamentoCancelado = lazy(() => import("./pages/PagamentoCancelado"));
import AppLayout from "./pages/app/AppLayout";
const AppAuth = lazy(() => import("./pages/app/Auth"));
const Financeiro = lazy(() => import("./pages/app/Financeiro"));
const Clientes = lazy(() => import("./pages/app/Clientes"));
const Tarefas = lazy(() => import("./pages/app/Tarefas"));
const Lancamentos = lazy(() => import("./pages/app/Lancamentos"));
const FluxoCaixa = lazy(() => import("./pages/app/FluxoCaixa"));
const Simuladores = lazy(() => import("./pages/app/Simuladores"));
const Leads = lazy(() => import("./pages/app/Leads"));
const Manual = lazy(() => import("./pages/app/Manual"));
const ImportarPdf = lazy(() => import("./pages/app/ImportarPdf"));
const Produtos = lazy(() => import("./pages/app/Produtos"));
const Fornecedores = lazy(() => import("./pages/app/Fornecedores"));
const Estoque = lazy(() => import("./pages/app/Estoque"));
const Vendas = lazy(() => import("./pages/app/Vendas"));
const Compras = lazy(() => import("./pages/app/Compras"));
const Contratos = lazy(() => import("./pages/app/Contratos"));
const OrdensServico = lazy(() => import("./pages/app/OrdensServico"));
const Metas = lazy(() => import("./pages/app/Metas"));
const PlanoContas = lazy(() => import("./pages/app/PlanoContas"));
const CentrosCusto = lazy(() => import("./pages/app/CentrosCusto"));
const BibliotecaInteligente = lazy(() => import("./pages/app/BibliotecaInteligente"));

const Admin = lazy(() => import("./pages/app/Admin"));
const AdminReels = lazy(() => import("./pages/app/AdminReels"));
const Mais = lazy(() => import("./pages/app/Mais"));
const AppIndex = lazy(() => import("./pages/app/AppIndex"));
const PFDashboard = lazy(() => import("./pages/app/pf/PFDashboard"));
const PFTransacoes = lazy(() => import("./pages/app/pf/PFTransacoes"));
const PFDividas = lazy(() => import("./pages/app/pf/PFDividas"));
const PFPatrimonio = lazy(() => import("./pages/app/pf/PFPatrimonio"));
const PFMetas = lazy(() => import("./pages/app/pf/PFMetas"));
const PFEvolucao = lazy(() => import("./pages/app/pf/PFEvolucao"));
const PFLimites = lazy(() => import("./pages/app/pf/PFLimites"));
const Crm = lazy(() => import("./pages/app/Crm"));
const Agenda = lazy(() => import("./pages/app/Agenda"));
const Brindes = lazy(() => import("./pages/app/Brindes"));
const AssistenteAdmin = lazy(() => import("./pages/app/AssistenteAdmin"));
const ClienteLayout = lazy(() => import("./pages/cliente/ClienteLayout"));
const CliDashboard = lazy(() => import("./pages/cliente/Dashboard"));
const CliExtrato = lazy(() => import("./pages/cliente/Extrato"));
const CliLimites = lazy(() => import("./pages/cliente/Limites"));
const CliAnalises = lazy(() => import("./pages/cliente/Analises"));
const CliTarefas = lazy(() => import("./pages/cliente/Tarefas"));
const CliObjetivos = lazy(() => import("./pages/cliente/Objetivos"));
const CliImportar = lazy(() => import("./pages/cliente/Importar"));
const CliDividas = lazy(() => import("./pages/cliente/Dividas"));
const CliPatrimonio = lazy(() => import("./pages/cliente/Patrimonio"));
const CliNaoRecorrentes = lazy(() => import("./pages/cliente/NaoRecorrentes"));
const CliReunioes = lazy(() => import("./pages/cliente/Reunioes"));
const CliConfiguracoes = lazy(() => import("./pages/cliente/Configuracoes"));
const EducadorLayout = lazy(() => import("./pages/educador/EducadorLayout"));
const EduInicio = lazy(() => import("./pages/educador/Inicio"));
const EduClientes = lazy(() => import("./pages/educador/Clientes"));
const EduTarefas = lazy(() => import("./pages/educador/Tarefas"));
const EduNovidades = lazy(() => import("./pages/educador/Novidades"));
const EduConfiguracoes = lazy(() => import("./pages/educador/Configuracoes"));
const ClienteFicha = lazy(() => import("./pages/educador/ClienteFicha"));
import { TipoPessoaGuard } from "./pages/app/TipoPessoaGuard";



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/index" element={<Home />} />
          <Route path="/diag" element={<Diag />} />
          <Route path="/cursos" element={<Cursos />} />
          <Route path="/palestras" element={<Palestras />} />
          <Route path="/diagnostico" element={<Diagnostico />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/planilha-gratis" element={<PlanilhaGratis />} />
          <Route path="/como-instalar" element={<ComoInstalar />} />
          <Route path="/quero-ajuda" element={<QueroAjuda />} />
          <Route path="/agendar" element={<Agendar />} />
          <Route path="/app/auth" element={<AppAuth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
          <Route path="/planos" element={<Planos />} />
          <Route path="/pagamento/sucesso" element={<PagamentoSucesso />} />
          <Route path="/pagamento/cancelado" element={<PagamentoCancelado />} />
          <Route path="/educador" element={<EducadorLayout />}>
            <Route index element={<EduInicio />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="clientes" element={<EduClientes />} />
            <Route path="clientes/:clienteUserId" element={<ClienteFicha />}>
              <Route index element={<CliDashboard />} />
              <Route path="extrato" element={<CliExtrato />} />
              <Route path="limites" element={<CliLimites />} />
              <Route path="analises" element={<CliAnalises />} />
              <Route path="tarefas" element={<CliTarefas />} />
              <Route path="objetivos" element={<CliObjetivos />} />
              <Route path="importar" element={<CliImportar />} />
              <Route path="dividas" element={<CliDividas />} />
              <Route path="patrimonio" element={<CliPatrimonio />} />
              <Route path="nao-recorrentes" element={<CliNaoRecorrentes />} />
              <Route path="reunioes" element={<CliReunioes />} />
              <Route path="configuracoes" element={<CliConfiguracoes />} />
            </Route>
            <Route path="crm" element={<Crm />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="tarefas" element={<EduTarefas />} />
            <Route path="simuladores" element={<Simuladores />} />
            <Route path="novidades" element={<EduNovidades />} />
            <Route path="configuracoes" element={<EduConfiguracoes />} />
          </Route>
          <Route path="/cliente" element={<ClienteLayout />}>
            <Route index element={<CliDashboard />} />
            <Route path="extrato" element={<CliExtrato />} />
            <Route path="limites" element={<CliLimites />} />
            <Route path="analises" element={<CliAnalises />} />
            <Route path="tarefas" element={<CliTarefas />} />
            <Route path="objetivos" element={<CliObjetivos />} />
            <Route path="importar" element={<CliImportar />} />
            <Route path="dividas" element={<CliDividas />} />
            <Route path="patrimonio" element={<CliPatrimonio />} />
            <Route path="nao-recorrentes" element={<CliNaoRecorrentes />} />
            <Route path="reunioes" element={<CliReunioes />} />
            <Route path="configuracoes" element={<CliConfiguracoes />} />
          </Route>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<AppIndex />} />
            <Route path="pf" element={<TipoPessoaGuard allow="PF"><PFDashboard /></TipoPessoaGuard>} />
            <Route path="pf/transacoes" element={<TipoPessoaGuard allow="PF"><PFTransacoes /></TipoPessoaGuard>} />
            <Route path="pf/dividas" element={<TipoPessoaGuard allow="PF"><PFDividas /></TipoPessoaGuard>} />
            <Route path="pf/patrimonio" element={<TipoPessoaGuard allow="PF"><PFPatrimonio /></TipoPessoaGuard>} />
            <Route path="pf/metas" element={<TipoPessoaGuard allow="PF"><PFMetas /></TipoPessoaGuard>} />
            <Route path="pf/limites" element={<TipoPessoaGuard allow="PF"><PFLimites /></TipoPessoaGuard>} />
            <Route path="pf/evolucao" element={<TipoPessoaGuard allow="PF"><PFEvolucao /></TipoPessoaGuard>} />
            <Route path="clientes" element={<TipoPessoaGuard allow="PJ"><Clientes /></TipoPessoaGuard>} />
            <Route path="tarefas" element={<Tarefas />} />
            <Route path="lancamentos" element={<TipoPessoaGuard allow="PJ"><Lancamentos /></TipoPessoaGuard>} />
            <Route path="fluxo-caixa" element={<TipoPessoaGuard allow="PJ"><FluxoCaixa /></TipoPessoaGuard>} />
            <Route path="simuladores" element={<Simuladores />} />
            <Route path="leads" element={<TipoPessoaGuard allow="PJ"><Leads /></TipoPessoaGuard>} />
            <Route path="crm" element={<Crm />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="manual" element={<Manual />} />
            <Route path="importar-pdf" element={<ImportarPdf />} />
            <Route path="produtos" element={<TipoPessoaGuard allow="PJ"><Produtos /></TipoPessoaGuard>} />
            <Route path="fornecedores" element={<TipoPessoaGuard allow="PJ"><Fornecedores /></TipoPessoaGuard>} />
            <Route path="estoque" element={<TipoPessoaGuard allow="PJ"><Estoque /></TipoPessoaGuard>} />
            <Route path="vendas" element={<TipoPessoaGuard allow="PJ"><Vendas /></TipoPessoaGuard>} />
            <Route path="compras" element={<TipoPessoaGuard allow="PJ"><Compras /></TipoPessoaGuard>} />
            <Route path="contratos" element={<TipoPessoaGuard allow="PJ"><Contratos /></TipoPessoaGuard>} />
            <Route path="ordens-servico" element={<TipoPessoaGuard allow="PJ"><OrdensServico /></TipoPessoaGuard>} />
            <Route path="metas" element={<TipoPessoaGuard allow="PJ"><Metas /></TipoPessoaGuard>} />
            <Route path="plano-contas" element={<TipoPessoaGuard allow="PJ"><PlanoContas /></TipoPessoaGuard>} />
            <Route path="centros-custo" element={<TipoPessoaGuard allow="PJ"><CentrosCusto /></TipoPessoaGuard>} />


            <Route path="admin" element={<Admin />} />
            <Route path="admin/assistente" element={<AssistenteAdmin />} />
            <Route path="admin/reels" element={<AdminReels />} />
            <Route path="biblioteca" element={<BibliotecaInteligente />} />
            <Route path="mais" element={<Mais />} />
            <Route path="brindes" element={<Brindes />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
