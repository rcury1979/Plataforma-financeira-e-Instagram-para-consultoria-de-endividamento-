import { useState } from "react";
import SiteLayout from "@/components/site/SiteLayout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import {
  Smartphone, Apple, Share, Plus, Download, ShieldCheck, Wifi, Bell,
  ArrowRight, HelpCircle, CheckCircle2, MessageCircle, AlertCircle
} from "lucide-react";

type OS = "android" | "iphone";

export default function ComoInstalar() {
  const [os, setOs] = useState<OS>("android");
  const url = typeof window !== "undefined" ? window.location.origin + "/app" : "https://rmconsultoriaeducation.com/app";

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="pt-16 pb-10 lg:pt-24 lg:pb-14 bg-secondary/40">
        <div className="container-prose text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
            <HelpCircle className="w-3.5 h-3.5" /> Guia rápido
          </div>
          <h1 className="font-display text-4xl lg:text-5xl leading-tight">
            Como instalar o <span className="text-gradient-warm">app R&M 360°</span>
          </h1>
          <p className="mt-4 text-muted-foreground text-lg">
            Em menos de 30 segundos o app fica no seu celular como qualquer outro. Sem app store, sem cadastro extra.
          </p>
        </div>
      </section>

      {/* SELETOR OS */}
      <section className="pt-8 pb-16">
        <div className="container-prose">
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-muted rounded-full p-1">
              <button
                onClick={() => setOs("android")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition ${
                  os === "android" ? "bg-background shadow text-foreground" : "text-muted-foreground"
                }`}
              >
                <Smartphone className="w-4 h-4" /> Android
              </button>
              <button
                onClick={() => setOs("iphone")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition ${
                  os === "iphone" ? "bg-background shadow text-foreground" : "text-muted-foreground"
                }`}
              >
                <Apple className="w-4 h-4" /> iPhone
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8 items-start">
            {/* QR fixo */}
            <div className="lg:sticky lg:top-24">
              <div className="rounded-3xl gradient-warm p-6 text-primary-foreground shadow-warm text-center">
                <div className="bg-white p-4 rounded-2xl inline-block shadow-xl">
                  <QRCodeSVG value={url} size={170} level="M" marginSize={0} fgColor="#1a1a1a" />
                </div>
                <p className="mt-4 font-display text-lg">Escaneie no celular</p>
                <p className="text-xs text-primary-foreground/80 mt-1">Câmera → aponte → toque no link</p>
                <div className="mt-4 pt-4 border-t border-white/20 text-xs text-primary-foreground/80 break-all">
                  ou acesse: <span className="font-mono">{url.replace(/^https?:\/\//, "")}</span>
                </div>
              </div>
            </div>

            {/* Passos */}
            <div>
              {os === "android" ? <PassosAndroid /> : <PassosIphone />}

              {/* Confirmação de sucesso */}
              <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Deu certo?</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    O ícone R&M 360° deve aparecer na tela inicial. Ao abrir, o app carrega em <b className="text-foreground">tela cheia</b>, sem a barra do navegador.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Depois de instalar */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="font-display text-2xl mb-6 text-center">Depois de instalar</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <InfoCard icon={ShieldCheck} title="Login uma vez só" text="Entre com e-mail e senha. O app lembra do login." />
              <InfoCard icon={Wifi} title="Funciona sem internet" text="Consulta seus últimos lançamentos mesmo offline." />
              <InfoCard icon={Bell} title="Recebe lembretes" text="Notificações de contas a vencer e metas." />
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="font-display text-2xl mb-6 text-center">Perguntas rápidas</h2>
            <div className="space-y-3">
              <Faq q="Não apareceu o banner 'Instalar app' no Android">
                Toque no menu <b>⋮</b> (canto superior direito do Chrome) → <b>"Instalar aplicativo"</b> ou <b>"Adicionar à tela inicial"</b>.
              </Faq>
              <Faq q="No iPhone não vejo 'Adicionar à Tela de Início'">
                Confira se está no <b>Safari</b> (não funciona no Chrome do iPhone). Role o menu Compartilhar para baixo se preciso.
              </Faq>
              <Faq q="Preciso pagar alguma coisa?">
                Não. A instalação é grátis. Você usa o mesmo plano da sua conta do sistema.
              </Faq>
              <Faq q="Vou perder meus dados?">
                Não. É o mesmo sistema — todos os lançamentos, metas e clientes continuam iguais.
              </Faq>
              <Faq q="Como desinstalar?">
                No Android: pressione o ícone e arraste para "Desinstalar". No iPhone: pressione o ícone e escolha "Remover App".
              </Faq>
            </div>
          </div>

          {/* Ajuda humana */}
          <div className="mt-16 rounded-3xl gradient-warm p-8 lg:p-10 text-primary-foreground text-center max-w-3xl mx-auto shadow-warm">
            <MessageCircle className="w-10 h-10 mx-auto mb-3" />
            <h3 className="font-display text-2xl">Ficou com dúvida?</h3>
            <p className="mt-2 text-primary-foreground/90">
              A equipe da Marta Cury ajuda você a instalar em 2 minutos pelo WhatsApp.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-5 rounded-full h-12 px-7 bg-white text-primary hover:bg-white/90">
              <Link to="/contato">Falar com o suporte <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

/* ---------------- Passos ---------------- */

function PassosAndroid() {
  return (
    <ol className="space-y-4">
      <Passo n={1} titulo="Abra o Chrome no celular">
        Acesse <b className="text-foreground">rmconsultoriaeducation.com</b> pelo navegador Chrome.
      </Passo>
      <Passo n={2} titulo="Toque em 'Instalar app'">
        Um banner amarelo aparece na parte de baixo. Toque nele.
      </Passo>
      <Passo n={3} titulo="Se o banner não aparecer">
        Abra o menu <b className="text-foreground">⋮</b> no canto superior direito → escolha <b className="text-foreground">"Instalar aplicativo"</b>.
      </Passo>
      <Passo n={4} titulo="Confirme">
        Toque em <b className="text-foreground">"Instalar"</b>. O app baixa em segundos.
      </Passo>
      <Passo n={5} titulo="Pronto!" ok>
        O ícone <b className="text-foreground">R&M 360°</b> aparece na tela inicial. Toque para abrir.
      </Passo>
    </ol>
  );
}

function PassosIphone() {
  return (
    <ol className="space-y-4">
      <Passo n={1} titulo="Abra no Safari">
        Precisa ser o <b className="text-foreground">Safari</b> (não funciona no Chrome do iPhone). Acesse <b className="text-foreground">rmconsultoriaeducation.com</b>.
      </Passo>
      <Passo n={2} titulo="Toque no botão Compartilhar">
        <span className="inline-flex items-center gap-1.5">
          É o ícone <Share className="w-4 h-4 inline text-blue-600" /> na barra inferior (quadrado com seta para cima).
        </span>
      </Passo>
      <Passo n={3} titulo="Escolha 'Adicionar à Tela de Início'">
        <span className="inline-flex items-center gap-1.5">
          Role o menu até ver <Plus className="w-4 h-4 inline" /> <b className="text-foreground">"Adicionar à Tela de Início"</b>.
        </span>
      </Passo>
      <Passo n={4} titulo="Toque em 'Adicionar'">
        No canto superior direito. Pode manter o nome <b className="text-foreground">R&M 360°</b>.
      </Passo>
      <Passo n={5} titulo="Pronto!" ok>
        O ícone aparece na tela do iPhone como qualquer outro aplicativo.
      </Passo>
    </ol>
  );
}

/* ---------------- Componentes ---------------- */

function Passo({ n, titulo, ok, children }: { n: number; titulo: string; ok?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex gap-4 rounded-2xl bg-card border border-border p-4 hover:shadow-md transition">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-display text-base shrink-0 ${
        ok ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary"
      }`}>
        {ok ? <CheckCircle2 className="w-5 h-5" /> : n}
      </div>
      <div className="min-w-0 pt-0.5">
        <div className="font-medium text-foreground">{titulo}</div>
        <div className="text-sm text-muted-foreground mt-1 leading-relaxed">{children}</div>
      </div>
    </li>
  );
}

function InfoCard({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 text-center">
      <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{text}</div>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl bg-card border border-border p-4 open:shadow-md transition">
      <summary className="flex items-start gap-3 cursor-pointer list-none font-medium">
        <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <span className="flex-1">{q}</span>
        <span className="text-muted-foreground group-open:rotate-180 transition text-xs mt-1">▾</span>
      </summary>
      <div className="text-sm text-muted-foreground mt-3 pl-7 leading-relaxed">{children}</div>
    </details>
  );
}
