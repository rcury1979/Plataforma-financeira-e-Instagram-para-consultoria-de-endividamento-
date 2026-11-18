import SiteLayout from "@/components/site/SiteLayout";

/* Política de Privacidade (LGPD) — exigida pela Google Play e pela App Store para publicar o app R&M 360°. */
const ATUALIZADA_EM = "18 de novembro de 2026";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl text-foreground">{titulo}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-foreground/85">{children}</div>
    </section>
  );
}

export default function Privacidade() {
  return (
    <SiteLayout>
      <article className="container-prose max-w-3xl py-16 lg:py-24">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">LGPD · Lei nº 13.709/2018</span>
        <h1 className="mt-4 font-display text-4xl text-foreground lg:text-5xl">Política de Privacidade</h1>
        <p className="mt-3 text-sm text-muted-foreground">Última atualização: {ATUALIZADA_EM}</p>

        <p className="mt-8 leading-relaxed text-foreground/85">
          Esta política explica como a <strong>R&amp;M Consultoria e Finance</strong>, conduzida por Marta Cury, trata os dados pessoais de
          quem usa o site <strong>rmconsultoriaeducation.com</strong> e o aplicativo <strong>R&amp;M 360°</strong> (versões web, Android e iPhone).
        </p>

        <Secao titulo="1. Quem é a responsável pelos seus dados">
          <p>A R&amp;M Consultoria e Finance é a controladora dos dados. Para qualquer assunto de privacidade, fale com a gente pelo
            e-mail <a className="text-primary underline" href="mailto:contato@rmconsultoria.finance">contato@rmconsultoria.finance</a> ou pelo
            WhatsApp <a className="text-primary underline" href="https://wa.me/5521986000039">(21) 98600-0039</a>.</p>
        </Secao>

        <Secao titulo="2. Quais dados coletamos">
          <ul className="list-disc space-y-2 pl-6">
            <li><strong>Cadastro:</strong> nome, e-mail, senha (guardada de forma criptografada) e se você é Pessoa Física ou Jurídica.</li>
            <li><strong>Dados financeiros que você mesmo registra no app:</strong> receitas, despesas, categorias, contas, cartões, limites, dívidas, patrimônio, objetivos, tarefas e anotações de reuniões.</li>
            <li><strong>Arquivos que você envia</strong> em "Importar com IA" (faturas e extratos), usados só para ler os lançamentos.</li>
            <li><strong>Contato e formulários do site:</strong> nome, telefone/WhatsApp, e-mail e mensagem, quando você pede ajuda, diagnóstico, palestra ou participa de sorteios.</li>
            <li><strong>Assinatura:</strong> status do plano. Os dados do cartão são digitados direto na Stripe e <strong>não ficam com a gente</strong>.</li>
            <li><strong>Dados técnicos:</strong> registros de acesso e segurança (data, hora, endereço IP), como exige o Marco Civil da Internet.</li>
          </ul>
        </Secao>

        <Secao titulo="3. Lançar gastos falando (microfone)">
          <p>O botão <strong>"Falar gasto"</strong> usa o reconhecimento de voz do seu próprio celular ou navegador (Google ou Apple) para
            transformar a fala em texto. O app só usa o microfone quando você toca no botão. Não gravamos nem guardamos o áudio: guardamos apenas
            o lançamento que você conferiu e salvou, e a frase em texto no campo de observação.</p>
        </Secao>

        <Secao titulo="4. Para que usamos os dados">
          <ul className="list-disc space-y-2 pl-6">
            <li>Criar e manter sua conta e dar acesso ao app conforme seu plano.</li>
            <li>Mostrar seus números, gráficos, limites e objetivos e prestar a consultoria e a educação financeira contratadas.</li>
            <li>Enviar e-mails necessários (confirmação de cadastro, troca de senha, avisos da assinatura e e-books de presente).</li>
            <li>Responder seus contatos e organizar atendimentos, palestras e sorteios.</li>
            <li>Manter a segurança, evitar fraudes e cumprir obrigações legais.</li>
          </ul>
          <p>As bases legais são a execução do contrato, o cumprimento de obrigação legal, o legítimo interesse (segurança e melhoria do serviço)
            e o seu consentimento, quando ele for pedido.</p>
        </Secao>

        <Secao titulo="5. Com quem compartilhamos">
          <ul className="list-disc space-y-2 pl-6">
            <li><strong>Sua educadora financeira:</strong> se você é cliente de mentoria, ela vê os dados financeiros que você registra, para te orientar. Nenhuma outra educadora tem acesso.</li>
            <li><strong>Fornecedores que fazem o serviço funcionar:</strong> Supabase (banco de dados e login), Netlify (hospedagem do site), Stripe (pagamentos) e provedor de inteligência artificial usado para ler faturas e responder no chat.</li>
            <li><strong>Autoridades</strong>, apenas quando a lei exigir.</li>
          </ul>
          <p><strong>Não vendemos seus dados</strong> e não os usamos para publicidade de terceiros.</p>
        </Secao>

        <Secao titulo="6. Segurança e armazenamento">
          <p>Usamos conexão criptografada (HTTPS) e regras no banco de dados que fazem cada pessoa enxergar só os próprios dados. Alguns fornecedores
            podem guardar dados fora do Brasil, sempre com proteções adequadas, como prevê a LGPD.</p>
          <p>Guardamos seus dados enquanto sua conta existir. Depois, eles são apagados, exceto o que a lei manda guardar por mais tempo
            (por exemplo, registros de acesso por 6 meses e dados de pagamento pelo prazo fiscal).</p>
        </Secao>

        <Secao titulo="7. Seus direitos">
          <p>Você pode, a qualquer momento: confirmar se tratamos seus dados, acessar, corrigir, levar seus dados para outro serviço, pedir que
            apaguemos, revogar o consentimento e pedir informações sobre compartilhamento. Para isso, ou para <strong>excluir sua conta e todos os
            seus dados</strong>, escreva para <a className="text-primary underline" href="mailto:contato@rmconsultoria.finance">contato@rmconsultoria.finance</a> ou
            chame no WhatsApp. Respondemos em até 15 dias. Você também pode reclamar na ANPD (Autoridade Nacional de Proteção de Dados).</p>
        </Secao>

        <Secao titulo="8. Crianças">
          <p>O app é destinado a maiores de 18 anos. Não coletamos de propósito dados de crianças e adolescentes.</p>
        </Secao>

        <Secao titulo="9. Mudanças nesta política">
          <p>Podemos atualizar esta política. Quando a mudança for importante, avisaremos no app ou por e-mail. A data no topo mostra a versão em vigor.</p>
        </Secao>
      </article>
    </SiteLayout>
  );
}
