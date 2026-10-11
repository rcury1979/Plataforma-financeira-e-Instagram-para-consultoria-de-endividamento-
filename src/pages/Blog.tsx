import SiteLayout from "@/components/site/SiteLayout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calculator, BookOpen, ArrowRight, Clock } from "lucide-react";

const artigos = [
  { titulo: "Como sair das dívidas em 12 meses (passo a passo)", categoria: "Endividamento", tempo: "8 min", resumo: "Um guia completo, sem fórmulas mágicas, para você quitar tudo com paz." },
  { titulo: "5 conversas que todo casal precisa ter sobre dinheiro", categoria: "Família", tempo: "6 min", resumo: "O que ninguém te ensinou no relacionamento, mas faz toda a diferença." },
  { titulo: "Pequena empresa em crise: por onde começar?", categoria: "Empresarial", tempo: "10 min", resumo: "Diagnóstico, renegociação e plano de 90 dias para PMEs." },
  { titulo: "Reserva de emergência: quanto guardar de verdade?", categoria: "Planejamento", tempo: "5 min", resumo: "Esqueça as regras genéricas. O número certo depende de você." },
  { titulo: "Como falar de dinheiro na sua igreja sem culpa", categoria: "Igrejas", tempo: "7 min", resumo: "Uma abordagem pastoral e prática para tratar finanças nas comunidades." },
  { titulo: "MEI: separando vida pessoal e profissional", categoria: "MEI", tempo: "6 min", resumo: "O erro nº1 dos autônomos e como corrigir esta semana." },
];

const ferramentas = [
  { titulo: "Calculadora de Endividamento", desc: "Descubra em quanto tempo você quita tudo." },
  { titulo: "Simulador de Reserva de Emergência", desc: "Quanto guardar com base na sua realidade." },
  { titulo: "Planilha de Orçamento Familiar", desc: "Pronta para baixar e usar hoje." },
  { titulo: "Calculadora de Juros Compostos", desc: "Veja o poder de começar pequeno e cedo." },
];

export default function Blog() {
  return (
    <SiteLayout>
      <section className="py-16 lg:py-24 gradient-soft">
        <div className="container-prose text-center max-w-3xl mx-auto">
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Conteúdo & Ferramentas</span>
          <h1 className="font-display text-4xl lg:text-5xl mt-4 text-foreground">Aprenda gratuitamente. Aplique hoje.</h1>
          <p className="mt-5 text-muted-foreground text-lg">Artigos, calculadoras e materiais práticos para sua jornada financeira.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-prose">
          <h2 className="font-display text-2xl mb-8 flex items-center gap-2"><Calculator className="w-6 h-6 text-primary" /> Ferramentas grátis</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ferramentas.map((f) => (
              <Link key={f.titulo} to="/contato" className="group p-6 rounded-2xl gradient-warm text-primary-foreground shadow-warm hover:scale-[1.02] transition-transform">
                <Calculator className="w-7 h-7" />
                <h3 className="font-display text-lg mt-4">{f.titulo}</h3>
                <p className="text-xs text-primary-foreground/85 mt-2">{f.desc}</p>
                <span className="mt-4 inline-flex items-center text-xs font-semibold">Acessar <ArrowRight className="ml-1 w-3 h-3" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-secondary/40">
        <div className="container-prose">
          <h2 className="font-display text-2xl mb-8 flex items-center gap-2"><BookOpen className="w-6 h-6 text-sage" /> Últimos artigos</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {artigos.map((a) => (
              <article key={a.titulo} className="group p-7 rounded-3xl bg-card border border-border shadow-card hover:shadow-warm hover:-translate-y-1 transition-all cursor-pointer">
                <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-sage/10 text-sage">{a.categoria}</span>
                <h3 className="font-display text-xl mt-4 text-foreground group-hover:text-primary transition-colors">{a.titulo}</h3>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{a.resumo}</p>
                <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {a.tempo}</span>
                  <span className="text-primary font-medium inline-flex items-center group-hover:gap-2 transition-all">Ler <ArrowRight className="ml-1 w-3 h-3" /></span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
