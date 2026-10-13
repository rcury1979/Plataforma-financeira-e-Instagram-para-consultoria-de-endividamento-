/* Configurações → Plano: situação do acesso ao app, próxima cobrança, fidelidade e portal de pagamento. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Loader2, MessageCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelTitle, Pill } from "./_shared";
import { abrirPortal, minhaAssinatura, ROTULO_ORIGEM, ROTULO_STATUS, type MinhaAssinatura } from "@/lib/acesso";

const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");
const WHATS = "https://wa.me/5521986000039?text=" + encodeURIComponent("Olá, Marta! Preciso de ajuda com a minha assinatura do app R&M 360°.");

export function AssinaturaTab() {
  const [a, setA] = useState<MinhaAssinatura | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [abrindo, setAbrindo] = useState(false);

  useEffect(() => {
    minhaAssinatura().then((r) => { setA(r); setCarregando(false); });
  }, []);

  const portal = async () => {
    setAbrindo(true);
    const msg = await abrirPortal();
    if (msg) { toast.error(msg); setAbrindo(false); }
  };

  if (carregando) return <Panel><p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando…</p></Panel>;

  const naFidelidade = !!a?.fidelidade_ate && new Date(a.fidelidade_ate).getTime() > Date.now();
  const linhas: [string, string][] = [];
  if (a) {
    linhas.push(["Acesso ao app", a.tem_acesso ? "Liberado" : "Bloqueado"]);
    linhas.push(["Forma de acesso", ROTULO_ORIGEM[a.origem] ?? a.origem]);
    if (a.status) linhas.push(["Situação da assinatura", ROTULO_STATUS[a.status] ?? a.status]);
    if (a.contrato_meses) linhas.push(["Contrato", `${a.contrato_meses} meses`]);
    if (a.fidelidade_ate) linhas.push(["Fim do contrato", data(a.fidelidade_ate)]);
    if (a.proxima_cobranca && a.status !== "canceled") linhas.push([a.cancela_no_fim ? "Acesso até" : a.status === "trialing" ? "Fim do teste grátis" : "Próxima cobrança", data(a.proxima_cobranca)]);
    if (a.status === "canceled" && a.proxima_cobranca) linhas.push(["Acesso até", data(a.proxima_cobranca)]);
  }

  return (
    <div className="space-y-5">
      <Panel>
        <PanelTitle icon={ShieldCheck}>Seu plano</PanelTitle>
        <dl className="divide-y divide-border text-sm">
          {linhas.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right font-medium text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
        {a?.status === "past_due" && (
          <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            Não conseguimos cobrar seu cartão. Atualize a forma de pagamento para não perder o acesso.
          </p>
        )}
      </Panel>

      {a?.origem === "assinatura" && (
        <Panel>
          <PanelTitle icon={CreditCard}>Pagamento</PanelTitle>
          <p className="mb-4 text-sm text-muted-foreground">
            Troque o cartão, veja e baixe suas faturas no portal seguro do Stripe.
            {naFidelidade
              ? ` Durante o contrato (até ${data(a.fidelidade_ate)}), o cancelamento é feito pelo nosso atendimento.`
              : " Se quiser cancelar, o acesso continua até o fim do mês já pago."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Pill variant="solid" type="button" onClick={portal} disabled={abrindo}>
              {abrindo ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />} Gerenciar pagamento
            </Pill>
            <a href={WHATS} target="_blank" rel="noopener noreferrer">
              <Pill type="button"><MessageCircle className="h-4 w-4" /> Falar com o atendimento</Pill>
            </a>
          </div>
        </Panel>
      )}

      {a && (a.origem === "nenhum" || (a.status === "canceled" && !a.tem_acesso)) && (
        <Panel>
          <PanelTitle icon={CreditCard}>Assinar</PanelTitle>
          <p className="mb-4 text-sm text-muted-foreground">Escolha um plano para voltar a usar o app. Seus dados continuam guardados.</p>
          <Link to="/planos"><Pill variant="solid" type="button">Ver planos</Pill></Link>
        </Panel>
      )}

      {a?.origem === "mentoria" && (
        <p className="text-sm text-muted-foreground">O app está incluso na sua mentoria com a Marta Cury. Não há cobrança separada.</p>
      )}
    </div>
  );
}
