import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import {
  Wallet, Calendar, Shield, ChevronRight, Settings, CreditCard, LogOut, Inbox, Sparkles, BookOpen, FileText,
  Package, Truck, Boxes, ShoppingCart, ShoppingBag, Repeat, Wrench, Target, ListTree, Building2,
  PiggyBank, TrendingUp, HeartHandshake, Repeat as SwitchIcon, Database, Gauge, CalendarDays, Users2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useTipoPessoa } from "@/hooks/useTipoPessoa";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Item = { icon: any; titulo: string; desc: string; to: string };

// ============================ PJ ============================
const PJ_COMERCIAL_ADMIN: Item[] = [
  { icon: Inbox, titulo: "Leads", desc: "Funil de prospecção (admin)", to: "/app/leads" },
];
const PJ_COMERCIAL: Item[] = [
  { icon: Users2, titulo: "Funil de captação", desc: "Contatos, etapas e link público", to: "/app/crm" },
  { icon: CalendarDays, titulo: "Agenda", desc: "Atendimentos e link de agendamento", to: "/app/agenda" },
  { icon: ShoppingCart, titulo: "Vendas", desc: "Orçamentos, pedidos e faturamento", to: "/app/vendas" },
  { icon: Repeat, titulo: "Contratos", desc: "Recorrências e assinaturas", to: "/app/contratos" },
  { icon: Wrench, titulo: "Ordens de serviço", desc: "Kanban de execução", to: "/app/ordens-servico" },
];
const PJ_ESTOQUE: Item[] = [
  { icon: Package, titulo: "Produtos & Serviços", desc: "Catálogo com preço e custo", to: "/app/produtos" },
  { icon: Boxes, titulo: "Estoque", desc: "Saldos, movimentações e alertas", to: "/app/estoque" },
  { icon: ShoppingBag, titulo: "Compras", desc: "Ordens de compra e recebimento", to: "/app/compras" },
  { icon: Truck, titulo: "Fornecedores", desc: "Cadastro e condição de pagamento", to: "/app/fornecedores" },
];
const PJ_FINANCEIRO: Item[] = [
  { icon: Wallet, titulo: "Lançamentos", desc: "Receitas e despesas com histórico", to: "/app/lancamentos" },
  { icon: Calendar, titulo: "Fluxo de Caixa", desc: "Entradas × saídas por dia", to: "/app/fluxo-caixa" },
  { icon: Target, titulo: "Metas", desc: "Previsto × realizado", to: "/app/metas" },
  { icon: Sparkles, titulo: "Ler extrato com IA", desc: "Extrato, fatura ou comprovante", to: "/app/importar-pdf" },
  { icon: FileText, titulo: "Simuladores", desc: "Investimentos, financiamento e mais", to: "/app/simuladores" },
  { icon: Database, titulo: "Biblioteca Inteligente", desc: "Gestão e automação de queries", to: "/app/biblioteca" },
];
const PJ_CADASTROS: Item[] = [
  { icon: ListTree, titulo: "Plano de Contas", desc: "Estrutura de receitas e despesas", to: "/app/plano-contas" },
  { icon: Building2, titulo: "Centros de Custo", desc: "Áreas para DRE gerencial", to: "/app/centros-custo" },
  { icon: BookOpen, titulo: "Manual de uso", desc: "Passo a passo tela a tela", to: "/app/manual" },
];

// ============================ PF ============================
const PF_ORGANIZAR: Item[] = [
  { icon: Wallet, titulo: "Meus lançamentos", desc: "Entradas e gastos do dia a dia", to: "/app/pf/transacoes" },
  { icon: HeartHandshake, titulo: "Minhas dívidas", desc: "Coragem para enfrentar e sair", to: "/app/pf/dividas" },
  { icon: Target, titulo: "Sonhos & Metas", desc: "O que você quer conquistar", to: "/app/pf/metas" },
];
const PF_EVOLUCAO: Item[] = [
  { icon: PiggyBank, titulo: "Patrimônio", desc: "O que é seu de verdade", to: "/app/pf/patrimonio" },
  { icon: TrendingUp, titulo: "Evolução", desc: "Sua jornada mês a mês", to: "/app/pf/evolucao" },
  { icon: Gauge, titulo: "Limites de gasto", desc: "Combine um teto por categoria", to: "/app/pf/limites" },
];
const PF_FERRAMENTAS: Item[] = [
  { icon: FileText, titulo: "Simuladores", desc: "Juros, financiamento e aposentadoria", to: "/app/simuladores" },
  { icon: Sparkles, titulo: "Ler extrato com IA", desc: "Traga seus lançamentos do banco", to: "/app/importar-pdf" },
  { icon: BookOpen, titulo: "Manual de uso", desc: "Passo a passo tela a tela", to: "/app/manual" },
];

function Secao({ titulo, items }: { titulo: string; items: Item[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{titulo}</h2>
      <div className="space-y-2">
        {items.map(s => {
          const Icon = s.icon;
          return (
            <Link key={s.titulo} to={s.to}>
              <Card className="p-4 flex items-center gap-3 hover:bg-secondary/40 transition">
                <div className="h-10 w-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{s.titulo}</div>
                  <div className="text-xs text-muted-foreground truncate">{s.desc}</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function Mais() {
  const navigate = useNavigate();
  const { tipo, loading } = useTipoPessoa();
  const [isAdmin, setIsAdmin] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await (supabase as any).rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      setIsAdmin(!!data);
    })();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/app/auth", { replace: true });
  };

  const trocarPerfil = async () => {
    if (!tipo) return;
    const novo = tipo === "PF" ? "PJ" : "PF";
    const label = novo === "PF" ? "Pessoal" : "Empresa";
    if (!confirm(`Deseja alternar para o modo ${label}?`)) return;
    setSwitching(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSwitching(false); return; }
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ tipo_pessoa: novo })
      .eq("user_id", u.user.id);
    setSwitching(false);
    if (error) return toast.error(error.message);
    toast.success(`Alternado para modo ${label}`);
    // reload para o layout reler o tipo e navegar corretamente
    window.location.href = novo === "PF" ? "/app/pf" : "/app";
  };

  if (loading || !tipo) {
    return <div className="min-h-[40vh]" />;
  }

  const isPF = tipo === "PF";

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-serif font-semibold">Mais</h1>
        <p className="text-sm text-muted-foreground">
          {isPF
            ? "Sua jornada pessoal, organizada com carinho."
            : "Todos os módulos do ERP em um só lugar."}
        </p>
      </div>

      {isPF ? (
        <>
          <Secao titulo="Organizar minha vida" items={PF_ORGANIZAR} />
          <Secao titulo="Ver minha evolução" items={PF_EVOLUCAO} />
          <Secao titulo="Ferramentas" items={PF_FERRAMENTAS} />
        </>
      ) : (
        <>
          <Secao titulo="Comercial" items={isAdmin ? [...PJ_COMERCIAL_ADMIN, ...PJ_COMERCIAL] : PJ_COMERCIAL} />
          <Secao titulo="Estoque & Compras" items={PJ_ESTOQUE} />
          <Secao titulo="Financeiro" items={PJ_FINANCEIRO} />
          <Secao titulo="Cadastros & Ajuda" items={PJ_CADASTROS} />
        </>
      )}

      {isAdmin && !isPF && (
        <div>
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Administração</h2>
          <Link to="/app/admin">
            <Card className="p-4 flex items-center gap-3 hover:bg-secondary/40 transition border-primary/30">
              <div className="h-10 w-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Painel Administrativo</div>
                <div className="text-xs text-muted-foreground">Visão consolidada de todos os usuários</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Card>
          </Link>
          <Link to="/app/admin/reels">
            <Card className="mt-2 p-4 flex items-center gap-3 hover:bg-secondary/40 transition border-primary/30">
              <div className="h-10 w-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Vídeos em destaque</div>
                <div className="text-xs text-muted-foreground">Adicionar, remover e ordenar os reels do site</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Card>
          </Link>
        </div>

      )}

      {isAdmin && <Secao titulo="Assistente administrativa" items={[{ icon: Shield, titulo: "Assistente R&M", desc: "Sua conversa privada de apoio à gestão", to: "/app/admin/assistente" }]} />}

      <Secao titulo="Seu presente" items={[{ icon: BookOpen, titulo: "Meus e-books", desc: "Seus dois materiais educativos gratuitos", to: "/app/brindes" }]} />

      <div>
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Conta</h2>
        <div className="space-y-2">
          <button onClick={trocarPerfil} disabled={switching} className="w-full">
            <Card className="p-4 flex items-center gap-3 hover:bg-secondary/40 transition text-left">
              <div className="h-10 w-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                <SwitchIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Alternar para modo {isPF ? "Empresa" : "Pessoal"}</div>
                <div className="text-xs text-muted-foreground">
                  {isPF
                    ? "Se você também tem empresa, alterne para a visão PJ."
                    : "Se quiser cuidar das suas finanças pessoais, alterne para a visão PF."}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Card>
          </button>
          <Card className="p-4 flex items-center gap-3">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 text-sm">Preferências</div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Card>
          <Card className="p-4 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 text-sm">Plano e cobrança</div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Card>
          <button onClick={logout} className="w-full">
            <Card className="p-4 flex items-center gap-3 hover:bg-destructive/10 transition">
              <LogOut className="h-5 w-5 text-destructive" />
              <div className="flex-1 text-sm text-left text-destructive">Sair</div>
            </Card>
          </button>
        </div>
      </div>
    </div>
  );
}
