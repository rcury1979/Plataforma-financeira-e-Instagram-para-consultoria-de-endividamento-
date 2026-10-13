import SiteLayout from "@/components/site/SiteLayout";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Check, Loader2, Lock, ShieldCheck, CreditCard, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { abrirPagamento, temAcessoApp } from "@/lib/acesso";

type PlanoId = "6m" | "12m";
type Plano = {
  id: PlanoId;
  nome: string;
  preco: string;
  destaque?: boolean;
  descricao: string;
};

// Combinado: contrato de 6 meses a R$ 25,99/mês ou de 12 meses a R$ 21,99/mês, com 7 dias grátis.
// Os valores cobrados ficam no servidor (função create-checkout); aqui é só a vitrine.
const RECURSOS = [
  "Área do cliente completa com o Método GCPM",
  "Extrato com contas e cartões, limites por categoria e análises",
  "Dívidas, patrimônio e planejamento de futuro",
  "Importação de extrato e fatura",
  "Tarefas e diário de reuniões com sua consultora",
  "App no celular (Android e iPhone) e no computador",
];

const PLANOS: Plano[] = [
  {
    id: "6m",
    nome: "Contrato de 6 meses",
    preco: "R$ 25,99",
    descricao: "6 mensalidades de R$ 25,99 (total de R$ 155,94). Depois, renova mês a mês pelo mesmo valor.",
  },
  {
    id: "12m",
    nome: "Contrato de 12 meses",
    preco: "R$ 21,99",
    destaque: true,
    descricao: "12 mensalidades de R$ 21,99 (total de R$ 263,88). Economia de R$ 48 no ano em relação ao plano de 6 meses.",
  },
];

const WHATS = "https://wa.me/5521986000039?text=" + encodeURIComponent("Olá, Marta! Sou cliente da mentoria e quero liberar meu acesso ao app R&M 360°.");

export default function Planos() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [logado, setLogado] = useState<boolean | null>(null);
  const [jaTemAcesso, setJaTemAcesso] = useState(false);
  const [abrindo, setAbrindo] = useState<PlanoId | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const autoIniciou = useRef(false);

  const pagar = async (id: PlanoId) => {
    setErro(null);
    setAbrindo(id);
    const msg = await abrirPagamento(id); // redireciona para o Stripe quando dá certo
    if (msg) { setErro(msg); setAbrindo(null); }
  };

  useEffect(() => {
    document.title = "Planos do app R&M 360° | RM Consultoria";
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { setLogado(false); return; }
      setLogado(true);
      const acesso = await temAcessoApp();
      setJaTemAcesso(acesso);
      // Voltou do cadastro com um plano escolhido: abre direto o pagamento.
      const escolhido = params.get("plano") as PlanoId | null;
      if (!acesso && (escolhido === "6m" || escolhido === "12m") && !autoIniciou.current) {
        autoIniciou.current = true;
        void pagar(escolhido);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const escolher = (p: Plano) => {
    if (!logado) {
      // Passo 1: criar login e senha; depois volta aqui e abre o pagamento do plano escolhido.
      navigate(`/app/auth?mode=signup&next=${encodeURIComponent(`/planos?plano=${p.id}`)}`);
      return;
    }
    void pagar(p.id);
  };

  return (
    <SiteLayout>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">Assine o app R&amp;M 360°</h1>
          <p className="text-muted-foreground text-lg">
            A partir de R$ 21,99 por mês. Comece com 7 dias grátis — a primeira cobrança só acontece depois do teste.
          </p>
        </div>

        {params.get("acesso") === "1" && !jaTemAcesso && (
          <div className="max-w-3xl mx-auto mb-8 rounded-xl border border-primary/40 bg-primary/5 p-5 flex gap-4">
            <Lock className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">Para usar o app, escolha um plano.</p>
              <p className="mt-1 text-muted-foreground">
                Seus dados continuam guardados. Assim que a assinatura começar, o acesso é liberado na hora.
                É cliente da mentoria da Marta Cury? O app já vem incluso —{" "}
                <a href={WHATS} target="_blank" rel="noopener noreferrer" className="text-primary underline">peça a liberação pelo WhatsApp</a>.
              </p>
            </div>
          </div>
        )}

        {params.get("cancelado") === "1" && !jaTemAcesso && (
          <div className="max-w-3xl mx-auto mb-8 rounded-xl border bg-card p-4 text-sm text-muted-foreground text-center">
            O pagamento não foi concluído e nada foi cobrado. Quando quiser, é só escolher o plano de novo.
          </div>
        )}

        {jaTemAcesso && (
          <div className="max-w-3xl mx-auto mb-8 rounded-xl border border-primary/40 bg-primary/5 p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
            <p className="flex-1 text-sm text-foreground">Seu acesso ao app já está liberado.</p>
            <Button asChild><Link to="/cliente">Entrar no app</Link></Button>
          </div>
        )}

        {erro && (
          <div role="alert" className="max-w-3xl mx-auto mb-8 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive text-center">
            {erro}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {PLANOS.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border p-6 flex flex-col bg-card ${
                p.destaque ? "border-primary shadow-lg ring-2 ring-primary/20 md:scale-[1.02]" : ""
              }`}
            >
              {p.destaque && (
                <span className="self-start text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                  Mais vantajoso
                </span>
              )}
              <h2 className="text-2xl font-bold">{p.nome}</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-4">{p.descricao}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">{p.preco}</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {RECURSOS.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => escolher(p)}
                variant={p.destaque ? "default" : "outline"}
                className="w-full"
                size="lg"
                disabled={jaTemAcesso || abrindo !== null || logado === null}
              >
                {abrindo === p.id ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Abrindo pagamento seguro…</>
                ) : logado === false ? (
                  `Começar 7 dias grátis — ${p.id === "6m" ? "6 meses" : "12 meses"}`
                ) : (
                  `Assinar ${p.id === "6m" ? "6 meses" : "12 meses"}`
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto mt-10 grid sm:grid-cols-3 gap-4 text-sm">
          <div className="rounded-xl border bg-card p-4 flex gap-3">
            <span className="font-display text-xl text-primary">1</span>
            <p className="text-muted-foreground"><b className="text-foreground">Crie seu login e senha</b> com seu e-mail. Eles serão o seu acesso ao app.</p>
          </div>
          <div className="rounded-xl border bg-card p-4 flex gap-3">
            <CreditCard className="w-5 h-5 text-primary shrink-0" />
            <p className="text-muted-foreground"><b className="text-foreground">Cadastre o cartão</b> na página segura do Stripe. Nada é cobrado nos 7 dias grátis.</p>
          </div>
          <div className="rounded-xl border bg-card p-4 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
            <p className="text-muted-foreground"><b className="text-foreground">Acesso liberado na hora</b>, no celular e no computador.</p>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8 max-w-3xl mx-auto">
          Pagamento com cartão de crédito, processado com segurança pela Stripe. Depois dos 7 dias grátis, a cobrança é mensal
          durante o prazo do contrato e, ao final, renova mês a mês pelo mesmo valor. Durante o contrato, o cancelamento é feito
          pelo nosso atendimento; depois dele, você mesmo cancela em Configurações → Minha assinatura.
        </p>
        <p className="text-center text-sm mt-3">
          <a href={WHATS} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
            <MessageCircle className="w-4 h-4" /> Dúvidas? Fale com a gente no WhatsApp
          </a>
        </p>
      </div>
    </SiteLayout>
  );
}
