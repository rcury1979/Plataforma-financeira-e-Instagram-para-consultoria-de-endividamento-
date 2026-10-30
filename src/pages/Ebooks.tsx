/* E-books gratuitos — Coleção Liberdade Financeira 360° (5 livros, Método GCPM). */
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Download } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";

const arq = (f: string) => `${import.meta.env.BASE_URL}ebooks/${f}`;
const ESCURO = "bg-[hsl(222_47%_14%)]";

const LIVROS = [
  {
    n: 1, etapa: "Fundamento", titulo: "Mente Próspera", sub: "A psicologia que prende e liberta você das dívidas.",
    pdf: "livro1-mente-prospera.pdf", info: "5 capítulos · Plano de 21 dias",
    itens: ["Os 4 perfis emocionais do endividado e qual é o seu", "Como reescrever as crenças que te mantêm no vermelho", "Os 7 gatilhos de consumo mais caros e como desarmá-los"],
  },
  {
    n: 2, etapa: "Cuidar", titulo: "Raio-X e Saída das Dívidas", sub: "Diagnóstico, cortes e negociação passo a passo.",
    pdf: "livro2-saida-das-dividas.pdf", info: "5 capítulos · Plano de 90 dias",
    itens: ["Onde encontrar todas as suas dívidas, de graça", "Qual dívida pagar primeiro: avalanche ou bola de neve", "Roteiro de negociação e os direitos que a lei garante"],
  },
  {
    n: 3, etapa: "Cuidar", titulo: "Orçamento que Funciona", sub: "Organizar a casa, o casal e a família.",
    pdf: "livro3-orcamento.pdf", info: "4 capítulos · Plano de 30 dias",
    itens: ["As 4 caixas do Método GCPM para cada real que entra", "Modelo de orçamento mensal pronto para preencher", "Dinheiro a dois e o “café financeiro” semanal"],
  },
  {
    n: 4, etapa: "Gerar + Proteger", titulo: "Gerar e Proteger", sub: "Renda extra, reserva e proteção da família.",
    pdf: "livro4-gerar-e-proteger.pdf", info: "4 capítulos · Plano de 90 dias",
    itens: ["Os 4 caminhos para ganhar mais e como pedir aumento", "Renda extra de R$ 500 em 90 dias", "Reserva de emergência, seguros e defesa contra golpes"],
  },
  {
    n: 5, etapa: "Multiplicar", titulo: "Multiplicar e Prosperar", sub: "Investir, crescer e deixar legado.",
    pdf: "livro5-multiplicar.pdf", info: "4 capítulos · Plano de 12 meses",
    itens: ["Juros compostos a seu favor, com exemplo em reais", "A escada de investimentos, do degrau zero à renda variável", "Metas, independência financeira e prosperidade com propósito"],
  },
];

const GCPM = [
  ["G", "Gerar", "Aumentar a renda"],
  ["C", "Cuidar", "Sair das dívidas e organizar"],
  ["P", "Proteger", "Reserva e segurança"],
  ["M", "Multiplicar", "Investir e prosperar"],
];

export default function Ebooks() {
  return (
    <SiteLayout>
      <section className={`${ESCURO} text-white`}>
        <div className="container-prose grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">E-books gratuitos · Coleção Liberdade Financeira 360°</span>
            <h1 className="mt-4 font-display text-4xl lg:text-5xl">Da dívida à <em className="text-gold">prosperidade</em>, em cinco passos.</h1>
            <p className="mt-5 text-lg text-white/75">
              Cinco e-books completos e gratuitos, com exercícios práticos, planos de ação e mensagens de ânimo para cada etapa.
              Organizados pelo Método GCPM, de Marta Cury.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gradient-gold text-gold-foreground">
                <a href={arq(`pdf/${LIVROS[0].pdf}`)} download><Download className="mr-2 h-4 w-4" /> Começar pelo Livro 1</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <a href="#biblioteca"><BookOpen className="mr-2 h-4 w-4" /> Ver os 5 livros</a>
              </Button>
            </div>
          </div>
          <img src={arq("capas/capa_livro1.jpg")} alt="Capa do e-book Mente Próspera" className="w-full rounded-xl shadow-2xl" />
        </div>
      </section>

      <section className="border-b border-border py-10">
        <div className="container-prose grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GCPM.map(([l, t, d]) => (
            <div key={l} className="flex items-center gap-4">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${ESCURO} font-display text-2xl text-gold`}>{l}</span>
              <span><span className="block font-semibold text-foreground">{t}</span><span className="text-sm text-muted-foreground">{d}</span></span>
            </div>
          ))}
        </div>
      </section>

      <section id="biblioteca" className="scroll-mt-24 py-16 lg:py-20">
        <div className="container-prose">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">A biblioteca</span>
          <h2 className="mt-3 font-display text-4xl text-foreground">Os 5 livros</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">Leia na ordem. Cada livro termina com um plano de ação e um checklist para você saber quando avançar.</p>

          <div className="mt-10 space-y-10">
            {LIVROS.map((l, i) => (
              <article key={l.n} id={`livro-${l.n}`} className="grid scroll-mt-24 items-center gap-8 rounded-2xl border border-border bg-card p-5 sm:p-8 lg:grid-cols-2">
                <img src={arq(`capas/capa_livro${l.n}.jpg`)} alt={`Capa do e-book ${l.titulo}`} loading="lazy"
                  className={`w-full rounded-xl shadow-lg ${i % 2 ? "lg:order-2" : ""}`} />
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Livro {l.n} · {l.etapa}</span>
                  <h3 className="mt-2 font-display text-3xl text-foreground">{l.titulo}</h3>
                  <p className="mt-1 italic text-muted-foreground">{l.sub}</p>
                  <ul className="mt-5 space-y-2 text-foreground/85">
                    {l.itens.map((t) => <li key={t} className="flex gap-2"><span className="text-gold">✓</span>{t}</li>)}
                  </ul>
                  <p className="mt-4 text-sm text-muted-foreground">{l.info}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button asChild className="gradient-gold text-gold-foreground">
                      <a href={arq(`pdf/${l.pdf}`)} download><Download className="mr-2 h-4 w-4" /> Baixar grátis (PDF)</a>
                    </Button>
                    <Button asChild variant="outline">
                      <a href={arq(`pdf/${l.pdf}`)} target="_blank" rel="noreferrer">Ler online</a>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={`${ESCURO} py-16 text-white`}>
        <div className="container-prose text-center">
          <h2 className="font-display text-3xl lg:text-4xl">Quer um plano feito para a sua família?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/75">
            Na consultoria, Marta Cury monta o seu Diagnóstico Financeiro e acompanha cada etapa do Método GCPM com você.
          </p>
          <Button asChild size="lg" className="mt-8 gradient-gold text-gold-foreground">
            <Link to="/agendar">Falar com a Marta Cury <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <p className="mt-8 text-xs text-white/50">Conteúdo educativo. Não substitui recomendação individual de investimento.</p>
        </div>
      </section>
    </SiteLayout>
  );
}
