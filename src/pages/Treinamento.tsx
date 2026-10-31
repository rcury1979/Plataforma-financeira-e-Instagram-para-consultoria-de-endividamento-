/* Treinamento — palestra "Minha história: da origem à autonomia", de Marta Cury. */
import { Link } from "react-router-dom";
import { useState } from "react";
import { Download, Instagram, MessageCircle, ArrowRight, Presentation, Gift, Smartphone, Trophy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import ApresentacaoSlides from "@/components/site/ApresentacaoSlides";
import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";

// Mude VERSAO sempre que trocar slides, fotos ou o PDF: força o navegador a buscar os arquivos novos.
const VERSAO = "2026-10-30c";
const img = (f: string) => `${import.meta.env.BASE_URL}treinamento/${f}?v=${VERSAO}`;
const PDF = img("minha-historia-marta-cury.pdf");
const SLIDES = Array.from({ length: 14 }, (_, n) => img(`slides/${String(n + 1).padStart(2, "0")}.jpg`));
const WHATSAPP = "https://wa.me/5521986000039";
const INSTAGRAM = "https://www.instagram.com/marta_curyy/";

const Rotulo = ({ children, claro }: { children: React.ReactNode; claro?: boolean }) => (
  <span className={`text-xs font-semibold uppercase tracking-[0.25em] ${claro ? "text-gold" : "text-primary"}`}>{children}</span>
);

const Foto = ({ src, alt, className = "" }: { src: string; alt: string; className?: string }) => (
  <img src={img(src)} alt={alt} loading="lazy" className={`w-full rounded-xl object-cover shadow-lg ${className}`} />
);

export default function Treinamento() {
  const [apresentando, setApresentando] = useState(false);
  return (
    <SiteLayout>
      {/* Capa */}
      <section className="bg-[hsl(222_47%_14%)] text-white">
        <div className="container-prose grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <Rotulo claro>Treinamento · Palestra</Rotulo>
            <h1 className="mt-4 font-display text-5xl lg:text-6xl">Minha história</h1>
            <p className="mt-3 font-display text-2xl italic text-gold">Da origem à autonomia</p>
            <div className="my-6 h-0.5 w-20 bg-gold" />
            <p className="text-lg font-semibold">Marta Cury</p>
            <p className="text-white/70">Empreendedora · Consultora Financeira</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="gradient-gold text-gold-foreground" onClick={() => setApresentando(true)}>
                <Presentation className="mr-2 h-4 w-4" /> Ver como apresentação
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <a href={PDF} download>
                  <Download className="mr-2 h-4 w-4" /> Baixar PDF
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link to="/palestras">Levar esta palestra <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-gold bg-transparent text-gold hover:bg-white/10 hover:text-gold">
                <a href="#sorteio"><Gift className="mr-2 h-4 w-4" /> Sorteio ao vivo</a>
              </Button>
            </div>
          </div>
          <Foto src="marta-capa.jpg" alt="Marta Cury" className="max-h-[560px] object-top" />
        </div>
      </section>

      {/* Apresentação */}
      <section id="apresentacao" className="bg-secondary/50 py-12 lg:py-16">
        <div className="container-prose max-w-5xl">
          <div className="mb-6 text-center">
            <Rotulo>Apresentação</Rotulo>
            <h2 className="mt-2 font-display text-3xl text-foreground">Veja os slides da palestra</h2>
            <p className="mt-2 text-sm text-muted-foreground">Use as setas, deslize no celular ou toque em tela cheia.</p>
          </div>
          <ApresentacaoSlides slides={SLIDES} titulo="Minha história — Marta Cury" aberto={apresentando}
            onAbrir={() => setApresentando(true)} onFechar={() => setApresentando(false)} />
        </div>
      </section>

      {/* Sorteio ao vivo */}
      <section id="sorteio" className="scroll-mt-24 bg-gold py-12">
        <div className="container-prose grid items-center gap-8 text-[hsl(222_47%_14%)] md:grid-cols-[1fr_auto]">
          <div className="text-center md:text-left">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em]"><Gift className="h-4 w-4" /> Sorteio ao vivo</span>
            <h2 className="mt-2 font-display text-3xl lg:text-4xl">Está na palestra? Concorra a uma consultoria financeira gratuita</h2>
            <p className="mt-2">Aponte a câmera do celular para o QR Code, escolha seu bonequinho e preencha seus dados. O resultado sai ao vivo no telão. 🍀</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
              <Button asChild size="lg" className="rounded-full bg-[hsl(222_47%_14%)] px-8 text-white hover:bg-[hsl(222_47%_20%)]">
                <Link to="/sorteio#cadastro"><Smartphone className="mr-2 h-4 w-4" /> Participar do sorteio</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full border-[hsl(222_47%_14%)] bg-transparent px-8 text-[hsl(222_47%_14%)] hover:bg-white/30">
                <Link to="/sorteio#roleta"><Trophy className="mr-2 h-4 w-4" /> Girar a roleta</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs opacity-75">“Girar a roleta” abre a aba Sorteio — só a Marta, com o login dela, consegue girar.</p>
          </div>
          <div className="mx-auto rounded-2xl bg-white p-4 text-center shadow-lg">
            <QRCodeSVG value={`${window.location.origin}/sorteio#cadastro`} size={180} level="M" marginSize={0} fgColor="#13213c" />
            <p className="mt-2 text-xs font-semibold">Escaneie para participar</p>
          </div>
        </div>
      </section>

      {/* Raízes */}
      <section className="py-16 lg:py-20">
        <div className="container-prose grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Rotulo>Minhas raízes</Rotulo>
            <h2 className="mt-3 font-display text-4xl text-foreground">Tudo começou muito cedo</h2>
            <ul className="mt-6 space-y-3 text-muted-foreground">
              <li>• Filha mais velha de 8 irmãos</li>
              <li>• Pais separados desde a minha infância</li>
              <li>• Cresci com poucos recursos e sem referências acadêmicas</li>
            </ul>
            <blockquote className="mt-8 border-l-4 border-gold pl-5 font-display text-2xl italic text-foreground">
              Aprendi cedo a buscar meu próprio caminho.
            </blockquote>
          </div>
          <Foto src="raizes.jpg" alt="Marta Cury criança com a mãe e os irmãos" className="max-h-[520px]" />
        </div>
      </section>

      {/* Formação */}
      <section className="bg-secondary/50 py-16 lg:py-20">
        <div className="container-prose grid items-center gap-10 lg:grid-cols-2">
          <Foto src="formatura.jpg" alt="Marta Cury na formatura de Direito" className="order-2 max-h-[520px] lg:order-1" />
          <div className="order-1 lg:order-2">
            <Rotulo>Formação</Rotulo>
            <h2 className="mt-3 font-display text-4xl text-foreground">Eu investi em mim</h2>
            <p className="mt-4 text-muted-foreground">Paguei minha própria faculdade e construí minha formação com trabalho e dedicação.</p>
            <div className="mt-6 space-y-3">
              {["Direito", "Pós-graduação em Gestão de Pessoas", "Certificações ANBIMA"].map((t) => (
                <div key={t} className="border-l-4 border-gold bg-card px-5 py-3 font-semibold text-foreground">{t}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Autoridade */}
      <section className="bg-[hsl(222_47%_14%)] py-16 text-white lg:py-20">
        <div className="container-prose grid items-center gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <Rotulo claro>Autoridade</Rotulo>
            <p className="mt-3 font-display text-7xl font-bold text-gold">20+</p>
            <h2 className="font-display text-3xl">anos no mercado financeiro</h2>
            <p className="mt-3 font-semibold text-gold">Banco do Brasil | Itaú</p>
            <p className="mt-3 text-white/75">Atuação como gerente geral, liderança de equipes e experiência com as finanças de pessoas e empresas.</p>
          </div>
          <div className="grid grid-cols-[2fr_3fr] gap-4">
            <Foto src="itau-1.jpg" alt="Marta Cury no Itaú" className="h-full max-h-[440px]" />
            <Foto src="itau-2.jpg" alt="Marta Cury com a equipe" className="h-full max-h-[440px]" />
          </div>
        </div>
      </section>

      {/* A virada */}
      <section className="bg-gold py-16 lg:py-20">
        <div className="container-prose text-[hsl(222_47%_14%)]">
          <span className="text-xs font-semibold uppercase tracking-[0.25em]">A virada</span>
          <h2 className="mt-3 font-display text-4xl lg:text-6xl">Em 2023, decidi recomeçar</h2>
          <p className="mt-4 text-lg">Deixei o banco para investir na minha autonomia e construir um trabalho alinhado aos meus valores.</p>
          <div className="mt-8 flex flex-wrap items-center gap-2 text-sm font-semibold">
            {["20+ anos no banco", "Coragem de recomeçar", "Estudo, método e fé", "R&M Consultoria"].map((t, i, a) => (
              <span key={t} className="flex items-center gap-2">
                <span className={`rounded-lg border border-[hsl(222_47%_14%)] px-4 py-2 ${i === a.length - 1 ? "bg-[hsl(222_47%_14%)] text-white" : "bg-white/20"}`}>{t}</span>
                {i < a.length - 1 && <ArrowRight className="h-4 w-4" />}
              </span>
            ))}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Mais liberdade", "Trocar o crachá pelo direito de escolher meu tempo, meus clientes e o tamanho dos meus sonhos.", "Liberdade não é sair de algo — é ir em direção a quem você nasceu para ser."],
              ["Mais propósito", "Usar 20 anos de experiência a favor de quem mais precisa: as famílias.", "Cada dívida quitada é uma casa que volta a ter paz."],
              ["Mais independência", "Construir algo meu, com as minhas regras e os meus valores.", "Segurança de verdade não vem do emprego — vem do que você sabe e de quem você se torna."],
            ].map(([t, d, q], i) => (
              <div key={t} className="rounded-2xl bg-[hsl(222_47%_14%)] p-6 text-white">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-gold text-sm font-bold text-[hsl(222_47%_14%)]">{i + 1}</span>
                <h3 className="mt-3 font-display text-2xl text-gold">{t}</h3>
                <p className="mt-2 text-white/80">{d}</p>
                <p className="mt-3 border-l-2 border-gold pl-3 font-display italic">{q}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EUA */}
      <section className="py-16 lg:py-20">
        <div className="container-prose grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Rotulo>Novas experiências</Rotulo>
            <h2 className="mt-3 font-display text-4xl text-foreground">Uma visão além das fronteiras</h2>
            <p className="mt-3 font-display text-2xl text-primary">3 anos nos Estados Unidos</p>
            <p className="mt-4 text-muted-foreground">Uma experiência que ampliou minha visão sobre educação, crédito, planejamento e comportamento financeiro.</p>
          </div>
          <Foto src="eua.jpg" alt="Marta Cury na ponte do Brooklyn" className="max-h-[520px]" />
        </div>
      </section>

      {/* Negócio */}
      <section className="bg-[hsl(222_47%_14%)] py-16 text-white lg:py-20">
        <div className="container-prose">
          <Rotulo claro>Meu negócio</Rotulo>
          <h2 className="mt-3 font-display text-4xl">Transformei experiência em propósito</h2>
          <p className="mt-3 text-white/75">Hoje, na <strong className="text-gold">R&M Consultoria</strong>, ajudo famílias a:</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["Organizar as finanças", "Sair das dívidas", "Construir patrimônio", "Tomar decisões financeiras conscientes"].map((t, i) => (
              <div key={t} className="rounded-xl bg-white/5 p-6">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gold font-bold text-[hsl(222_47%_14%)]">{i + 1}</span>
                <p className="mt-4 text-lg font-semibold">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O que faço hoje */}
      <section className="py-16 lg:py-20">
        <div className="container-prose">
          <Rotulo>O que faço hoje</Rotulo>
          <h2 className="mt-3 font-display text-4xl text-foreground">Educação financeira na prática</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              ["Consultoria individual", "Atendimento a famílias e pessoas que querem organizar o dinheiro e sair das dívidas."],
              ["Diagnóstico Financeiro", "Um retrato completo da situação: dívidas por credor, valores por instituição e meu parecer."],
              ["Método GCPM", "Gerar, Cuidar, Proteger e Multiplicar: o caminho que conduzo com cada cliente."],
              ["App R&M 360°", "Aplicativo para o cliente acompanhar as finanças e manter a evolução no dia a dia."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl bg-secondary/60 p-6">
                <h3 className="text-xl font-semibold text-foreground">{t}</h3>
                <p className="mt-2 text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mapa do Bem-Estar */}
      <section className="bg-secondary/50 py-16 lg:py-20">
        <div className="container-prose">
          <Rotulo>Bem-estar financeiro</Rotulo>
          <h2 className="mt-3 font-display text-4xl text-foreground">O Mapa do Bem-Estar</h2>
          <p className="mt-3 text-muted-foreground">Quatro dimensões que combinam segurança e liberdade — hoje e amanhã.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              ["Segurança · Hoje", "Controle", "renda e despesas sob comando — as contas fecham e você sabe para onde vai cada real.", "fornecedores, equipe e casa pagos em dia, sem recorrer ao cartão ou ao cheque especial.", "Quem controla o dinheiro deixa de ser controlada por ele."],
              ["Liberdade · Hoje", "Escolha", "viver o presente com consciência — gastar com o que importa, sem culpa e sem comprometer o amanhã.", "investir em você, viajar com a família ou celebrar uma conquista com o valor já previsto.", "Prosperidade não é privação: é decidir com intenção."],
              ["Segurança · Amanhã", "Proteção", "uma estrutura que resiste aos imprevistos — reserva de emergência, seguros e capital de giro.", "atravessar um mês fraco de vendas ou uma doença na família sem contrair novas dívidas.", "Tempestades chegam para todas. Preparada, você não afunda."],
              ["Liberdade · Amanhã", "Rumo", "patrimônio construído com propósito — metas claras e investimentos que trabalham por você.", "expandir o negócio, conquistar a casa própria ou planejar a aposentadoria com data marcada.", "Sonho com plano e prazo deixa de ser sonho: vira projeto."],
            ].map(([q, t, o, pr, frase], i) => {
              const escuro = i === 1 || i === 2;
              return (
                <div key={t} className={`rounded-xl p-6 ${escuro ? "bg-[hsl(222_47%_14%)] text-white" : "bg-card"}`}>
                  <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${escuro ? "text-gold" : "text-primary"}`}>{q}</span>
                  <h3 className={`mt-2 font-display text-3xl ${escuro ? "text-gold" : "text-foreground"}`}>{t}</h3>
                  <p className={`mt-2 ${escuro ? "text-white/85" : "text-foreground/85"}`}><strong>O que é:</strong> {o}</p>
                  <p className={`mt-2 ${escuro ? "text-white/85" : "text-foreground/85"}`}><strong>Na prática:</strong> {pr}</p>
                  <p className={`mt-4 border-l-2 border-gold pl-3 font-display text-lg italic ${escuro ? "text-white" : "text-foreground"}`}>{frase}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mensagem final */}
      <section className="bg-[hsl(222_47%_14%)] text-white">
        <div className="container-prose grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-20">
          <Foto src="familia.jpg" alt="Marta Cury com a família" className="max-h-[520px]" />
          <div>
            <Rotulo claro>Mensagem final</Rotulo>
            <h2 className="mt-3 font-display text-4xl">Nossa origem não precisa determinar nosso futuro.</h2>
            <p className="mt-5 text-white/75">Conhecimento, planejamento e coragem para fazer escolhas podem abrir novos caminhos.</p>
            <blockquote className="mt-8 border-l-4 border-gold pl-5">
              <p className="font-display text-2xl italic">“Examina uma propriedade e adquire-a; planta uma vinha com as rendas do seu trabalho.”</p>
              <p className="mt-2 font-semibold text-gold">Provérbios 31:16</p>
            </blockquote>
            <p className="mt-8 text-lg font-semibold">Marta Cury</p>
            <p className="text-gold">R&M Consultoria</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="gradient-gold text-gold-foreground">
                <a href={WHATSAPP} target="_blank" rel="noreferrer"><MessageCircle className="mr-2 h-4 w-4" /> (21) 98600-0039</a>
              </Button>
              <Button asChild variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <a href={INSTAGRAM} target="_blank" rel="noreferrer"><Instagram className="mr-2 h-4 w-4" /> @marta_curyy</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
