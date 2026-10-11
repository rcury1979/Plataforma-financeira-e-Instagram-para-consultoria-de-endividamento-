import SiteLayout from "@/components/site/SiteLayout";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

type Plano = {
  id: string;
  nome: string;
  preco: string;
  priceId: string;
  destaque?: boolean;
  descricao: string;
  recursos: string[];
};

// Assinatura do app R&M 360°: 6 meses a R$ 25,99/mês ou 12 meses a R$ 21,99/mês, com 7 dias grátis.
// priceId = lookup key do preço no Stripe (crie os dois preços recorrentes mensais com estas chaves e valores).
const RECURSOS = [
  "Área do cliente completa com o Método GCPM",
  "Extrato com contas e cartões, limites por categoria e análises",
  "Dívidas, patrimônio e planejamento de futuro",
  "Importação de extrato e fatura com IA",
  "Tarefas e diário de reuniões com sua educadora",
  "App no celular (Android e iPhone) e no computador",
];

const PLANOS: Plano[] = [
  {
    id: "6m",
    nome: "Contrato de 6 meses",
    preco: "R$ 25,99",
    priceId: "rm360_mensal_6m",
    descricao: "6 mensalidades de R$ 25,99 (total de R$ 155,94). Depois, renova mês a mês pelo mesmo valor.",
    recursos: RECURSOS,
  },
  {
    id: "12m",
    nome: "Contrato de 12 meses",
    preco: "R$ 21,99",
    priceId: "rm360_mensal_12m",
    destaque: true,
    descricao: "12 mensalidades de R$ 21,99 (total de R$ 263,88). Economia de R$ 48 no ano em relação ao plano de 6 meses.",
    recursos: RECURSOS,
  },
];

export default function Planos() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [selected, setSelected] = useState<Plano | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setUser({ id: data.user.id, email: data.user.email ?? undefined });
      // Voltou do cadastro com um plano escolhido: abre direto o pagamento.
      const escolhido = params.get("plano");
      const p = PLANOS.find((x) => x.nome === escolhido);
      if (p) setSelected(p);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const escolher = (p: Plano) => {
    if (!user) {
      // Passo 1: criar login e senha; depois volta aqui para pagar com o plano já escolhido.
      navigate(`/app/auth?mode=signup&next=${encodeURIComponent(`/planos?plano=${p.nome}`)}`);
      return;
    }
    setSelected(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (selected && user) {
    return (
      <div className="min-h-screen bg-background">
        <PaymentTestModeBanner />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Button variant="ghost" onClick={() => setSelected(null)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar aos planos
          </Button>
          <h1 className="text-2xl font-bold mb-2">Pagamento — Plano {selected.nome}</h1>
          <p className="text-muted-foreground mb-6">
            {selected.preco}/mês · {selected.nome.toLowerCase()}.
          </p>
          <div className="rounded-lg border bg-card p-4">
            <StripeEmbeddedCheckout
              priceId={selected.priceId}
              customerEmail={user.email}
              userId={user.id}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <SiteLayout>
      <PaymentTestModeBanner />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">Assine o app R&amp;M 360°</h1>
          <p className="text-muted-foreground text-lg">
            A partir de R$ 21,99 por mês. Comece com 7 dias grátis — a primeira cobrança só acontece depois do teste.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {PLANOS.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border p-6 flex flex-col bg-card ${
                p.destaque ? "border-primary shadow-lg ring-2 ring-primary/20 scale-[1.02]" : ""
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
                {p.recursos.map((r) => (
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
              >
                Assinar {p.id === "6m" ? "6 meses" : "12 meses"}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Pagamento seguro processado pela Stripe. 7 dias grátis; depois, cobrança mensal durante o prazo do contrato, que renova mês a mês pelo mesmo valor ao final. Cancelamento conforme os Termos de Uso.
        </p>
      </div>
    </SiteLayout>
  );
}
