import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Clock, Users, PlayCircle, Download, Star, ArrowRight } from "lucide-react";

const cursos = [
  {
    titulo: "Recomeço Financeiro",
    desc: "4 semanas de organização financeira, com aplicativo para controlar suas finanças na palma da mão, mentoria e acompanhamento.",
    duracao: "4 semanas",
    nivel: "Iniciante",
    destaque: true,
    modulos: ["Diagnóstico real", "Renegociação eficaz", "Orçamento sustentável", "Reserva de emergência"],
  },
  {
    titulo: "Família em Equilíbrio",
    desc: "Para casais que querem parar de brigar por dinheiro e construir juntos.",
    duracao: "4 semanas",
    nivel: "Iniciante",
    modulos: ["Diálogo financeiro", "Metas em casal", "Planejamento de filhos", "Sonhos compartilhados"],
  },
  {
    titulo: "Empresa de Pé",
    desc: "Reestruturação financeira para pequenos negócios em crise.",
    duracao: "12 semanas",
    nivel: "Intermediário",
    modulos: ["Caixa diário", "Renegociação fornecedores", "Precificação", "Plano de 90 dias"],
  },
  {
    titulo: "Liberdade do MEI",
    desc: "Para autônomos e MEIs que misturam vida pessoal e profissional.",
    duracao: "6 semanas",
    nivel: "Iniciante",
    modulos: ["Pró-labore", "Impostos sem susto", "Reserva de IR", "Crescimento saudável"],
  },
];

const materiais = [
  { titulo: "Planilha Orçamento Familiar", tipo: "Excel" },
  { titulo: "Guia: Renegociando Dívidas", tipo: "PDF" },
  { titulo: "Diário Financeiro 30 dias", tipo: "PDF" },
  { titulo: "Apostila Liberdade Financeira", tipo: "PDF" },
];

export default function Cursos() {
  return (
    <SiteLayout>
      <section className="py-16 lg:py-24 gradient-soft">
        <div className="container-prose text-center max-w-3xl mx-auto">
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Cursos & Materiais</span>
          <h1 className="font-display text-4xl lg:text-5xl mt-4 text-foreground">Aprender no seu tempo, com o Método GCPM e cuidado</h1>
          <p className="mt-5 text-muted-foreground text-lg">Trilhas práticas e materiais didáticos prontos para você aplicar essa semana.</p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="container-prose grid md:grid-cols-2 gap-6">
          {cursos.map((c) => (
            <div key={c.titulo} className={`p-8 rounded-3xl border ${c.destaque ? "gradient-warm text-primary-foreground border-transparent shadow-warm" : "bg-card border-border shadow-card"}`}>
              {c.destaque && <span className="inline-block text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full bg-white/20 mb-3">Mais procurado</span>}
              <h3 className={`font-display text-2xl ${c.destaque ? "text-primary-foreground" : "text-foreground"}`}>{c.titulo}</h3>
              <p className={`mt-2 text-sm ${c.destaque ? "text-primary-foreground/85" : "text-muted-foreground"}`}>{c.desc}</p>
              <div className="mt-5 flex flex-wrap gap-3 text-xs">
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${c.destaque ? "bg-white/20" : "bg-secondary"}`}><Clock className="w-3.5 h-3.5" /> {c.duracao}</span>
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${c.destaque ? "bg-white/20" : "bg-secondary"}`}><Users className="w-3.5 h-3.5" /> {c.nivel}</span>
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${c.destaque ? "bg-white/20" : "bg-secondary"}`}><Star className="w-3.5 h-3.5" /> 4.9</span>
              </div>
              <ul className="mt-6 space-y-2 text-sm">
                {c.modulos.map((m) => (
                  <li key={m} className="flex gap-2">
                    <span className={c.destaque ? "text-primary-foreground" : "text-sage"}>•</span>
                    <span className={c.destaque ? "text-primary-foreground/90" : "text-foreground/85"}>{m}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex items-center justify-end">
                <Button asChild variant={c.destaque ? "secondary" : "default"} className={`rounded-full ${!c.destaque ? "gradient-warm text-primary-foreground border-0" : ""}`}>
                  <Link to="/contato">Quero saber mais <ArrowRight className="ml-2 w-4 h-4" /></Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-secondary/40">
        <div className="container-prose">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs uppercase tracking-[0.2em] text-sage font-semibold">Materiais didáticos</span>
            <h2 className="font-display text-3xl mt-3">Recursos gratuitos para começar agora</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {materiais.map((m) => (
              <Link key={m.titulo} to="/contato" className="group p-6 rounded-2xl bg-card border border-border hover:shadow-warm hover:-translate-y-1 transition-all">
                <Download className="w-6 h-6 text-primary" />
                <h3 className="font-medium text-foreground mt-4">{m.titulo}</h3>
                <p className="text-xs text-muted-foreground mt-1">{m.tipo} • Grátis</p>
                <span className="mt-4 inline-flex items-center text-xs text-primary font-medium group-hover:gap-2 transition-all">Baixar <ArrowRight className="ml-1 w-3 h-3" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
