import SiteLayout from "@/components/site/SiteLayout";
import VideosDestaque from "@/components/site/VideosDestaque";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Sparkles, ShieldCheck, Heart, Church, Building2, Users,
  CheckCircle2, Star, BookOpen, Calendar, PlayCircle, TrendingDown, Quote,
  Target, LineChart, Rocket, AlertTriangle, Smartphone, Share, Plus, Download, Apple, HelpCircle
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { QRCodeSVG } from "qrcode.react";
import heroImg from "@/assets/fotos/martiniana-corda-samambaia.jpg";
import palestraImg from "@/assets/palestra-igreja.jpg";
import martinianaImg from "@/assets/fotos/martiniana-blazer-retrato.jpg";

const stats = [
  { value: "+1.200", label: "Pessoas atendidas" },
  { value: "+80", label: "Palestras realizadas" },
  { value: "20 anos", label: "De experiência" },
  { value: "94%", label: "Saem das dívidas em 12 meses" },
];

const personas = [
  { icon: Heart, title: "Pessoas endividadas", desc: "Recomeçar com um plano simples, humano e sem julgamentos." },
  { icon: Users, title: "Famílias", desc: "Reorganizar o orçamento e parar de brigar por dinheiro em casa." },
  { icon: Church, title: "Igrejas e comunidades", desc: "Palestras e cursos que trazem clareza e mudam hábitos." },
  { icon: Building2, title: "Empresas em crise", desc: "Fluxo de caixa, capital de giro e planejamento." },
];

const programas = [
  {
    tag: "Mais procurado",
    title: "Recomeço Financeiro",
    desc: "Programa de 4 semanas para organização financeira, aplicativo para controlar suas finanças na palma da mão, mentoria e acompanhamento.",
    bullets: ["Plano de quitação personalizado", "Planilhas didáticas inclusas", "Mentorias em grupo ao vivo"],
  },
  {
    tag: "Para empresas",
    title: "Reestruturação Empresarial",
    desc: "Diagnóstico, renegociação e plano de ação para empresas que perderam o controle do caixa.",
    bullets: ["Análise de fluxo de caixa", "Criação de plano de capital de giro", "Indicadores semanais"],
  },
  {
    tag: "Estratégia",
    title: "Plano de Negócios",
    desc: "Construção de planos de negócio sob medida para curto, médio e longo prazo, com metas claras e indicadores reais.",
    bullets: ["Curto prazo (até 1 ano)", "Médio prazo (1 a 3 anos)", "Longo prazo (3 a 10 anos)"],
  },
];

const horizontes = [
  {
    icon: Target,
    prazo: "Curto prazo",
    periodo: "até 12 meses",
    desc: "Estabilizar caixa, organizar dívidas e definir metas operacionais imediatas para resultados rápidos.",
  },
  {
    icon: LineChart,
    prazo: "Médio prazo",
    periodo: "1 a 3 anos",
    desc: "Estruturar crescimento sustentável, expandir receitas e consolidar processos com indicadores mensais.",
  },
  {
    icon: Rocket,
    prazo: "Longo prazo",
    periodo: "3 a 10 anos",
    desc: "Construir patrimônio, perpetuar o negócio e preparar sucessão com visão estratégica de mercado.",
  },
];

const depoimentos = [
  { nome: "Carla M.", role: "Mãe de 2 filhos", text: "Eu chorava todo mês olhando boletos. Em 6 meses paguei 70% das dívidas e voltei a dormir tranquila." },
  { nome: "Thaina e Lucas", role: "Consultoria familiar", text: "Com a consultoria da Marta Cury passamos de endividados para investidores. Estava na nossa frente, mas não enxergávamos." },
  { nome: "Dra. Francine", role: "Consultoria PF e PJ", text: "Misturava minha conta pessoa física com a conta pessoa jurídica e nunca sabia se realmente tinha lucro. Hoje tenho clareza e controle para tomar decisões financeiras." },
];

export default function Index() {
  return (
    <SiteLayout>
      <section className="institutional-hero relative overflow-hidden">
        <img src={heroImg} alt="Marta Cury, consultora financeira" className="hero-photo absolute inset-0 w-full h-full object-cover" fetchPriority="high" />
        <div className="hero-shade absolute inset-0" />
        <div className="container-prose relative hero-content">
          <p className="text-sm text-primary font-semibold mb-5">CONSULTORIA · TREINAMENTO · MENTORIA FINANCEIRA</p>
          <h1 className="font-display text-5xl sm:text-6xl leading-tight max-w-2xl">RM Consultoria<span className="block text-primary mt-2 text-3xl sm:text-4xl">R&M 360°</span></h1>
          <p className="mt-6 text-lg max-w-lg text-muted-foreground leading-relaxed">Sua história merece um recomeço. Orientação humana para sair das dívidas, cuidar do orçamento e construir um futuro com mais tranquilidade.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg"><Link to="/diagnostico">Fazer diagnóstico grátis <ArrowRight className="ml-2 w-4 h-4" /></Link></Button>
            <Button asChild variant="outline" size="lg"><Link to="/palestras">Quero uma palestra</Link></Button>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">Com Marta Cury · Pessoas, famílias e empresas</p>
        </div>
      </section>
      <section className="border-b border-border bg-card">
        <div className="container-prose grid md:grid-cols-2">
          {[{to:"/diagnostico?tipo=PF",label:"Pessoa Física",desc:"Um novo caminho para suas finanças e sua família.",icon:Heart},{to:"/diagnostico?tipo=PJ",label:"Pessoa Jurídica",desc:"Clareza e planejamento para cuidar do seu negócio.",icon:Building2}].map(({to,label,desc,icon:Icon}) => <Link key={label} to={to} className="flex items-center gap-5 py-8 md:px-8 border-border first:md:border-r group"><Icon className="w-8 h-8 text-primary shrink-0"/><div><h2 className="font-display text-2xl">{label}</h2><p className="text-sm text-muted-foreground mt-1">{desc}</p></div><ArrowRight className="ml-auto w-5 h-5 text-primary shrink-0 group-hover:translate-x-1 transition-transform"/></Link>)}
        </div>
      </section>
      <section className="py-16 border-b border-border" id="metodo">
        <div className="container-prose grid lg:grid-cols-[1fr_2fr] gap-10">
          <div><p className="text-xs text-primary uppercase">Nossa metodologia</p><h2 className="font-display text-3xl mt-3">Método GCPM</h2><p className="text-muted-foreground mt-3 leading-relaxed">Gerar, Cuidar, Proteger e Multiplicar. Um passo de cada vez.</p></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">{[{n:"G",t:"Gerar",d:"Organizar e ampliar a renda que entra todo mês."},{n:"C",t:"Cuidar",d:"Controlar gastos, dívidas e o orçamento, sem julgamento."},{n:"P",t:"Proteger",d:"Construir reserva e se proteger dos imprevistos."},{n:"M",t:"Multiplicar",d:"Fazer o dinheiro crescer com metas e investimentos."}].map(x=><div key={x.n}><span className="text-primary text-sm">{x.n}</span><h3 className="font-display text-xl mt-3">{x.t}</h3><p className="text-muted-foreground text-sm mt-2 leading-relaxed">{x.d}</p></div>)}</div>
        </div>
      </section>

      {/* PARA QUEM */}
      <section className="py-20 lg:py-28">
        <div className="container-prose">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Para quem</span>
            <h2 className="font-display text-3xl lg:text-4xl mt-3 text-foreground">Cuidamos de gente real, em situações reais</h2>
            <p className="mt-4 text-muted-foreground">Sem julgamento, sem termos complicados. Um caminho e uma saída para cada história.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {personas.map((p) => (
              <div key={p.title} className="group p-7 rounded-3xl bg-card border border-border hover:shadow-warm hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 grid place-items-center group-hover:gradient-warm transition-all">
                  <p.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="mt-5 font-display text-xl text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROGRAMAS */}
      <section className="py-20 lg:py-28 bg-secondary/40">
        <div className="container-prose">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-4">
            <div className="max-w-xl">
              <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Programas</span>
              <h2 className="font-display text-3xl lg:text-4xl mt-3 text-foreground">Caminhos para recomeçar com clareza</h2>
            </div>
            <Button asChild variant="ghost" className="rounded-full self-start lg:self-auto">
              <Link to="/cursos">Ver todos os cursos <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            {programas.map((p, i) => (
              <div key={p.title} className={`p-8 rounded-3xl border ${i === 0 ? "gradient-warm text-primary-foreground border-transparent shadow-warm" : "bg-card border-border"}`}>
                <span className={`inline-block text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full ${i === 0 ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"}`}>{p.tag}</span>
                <h3 className={`mt-5 font-display text-2xl ${i === 0 ? "text-primary-foreground" : "text-foreground"}`}>{p.title}</h3>
                <p className={`mt-3 text-sm leading-relaxed ${i === 0 ? "text-primary-foreground/85" : "text-muted-foreground"}`}>{p.desc}</p>
                <ul className="mt-6 space-y-2.5">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${i === 0 ? "text-primary-foreground" : "text-sage"}`} />
                      <span className={i === 0 ? "text-primary-foreground/90" : "text-foreground/85"}>{b}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild variant={i === 0 ? "secondary" : "outline"} className="mt-7 rounded-full w-full">
                  <Link to={i === 2 ? "/palestras" : "/cursos"}>Saber mais</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANO DE NEGÓCIOS — CURTO, MÉDIO E LONGO PRAZO */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container-prose">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Plano de Negócios</span>
            <h2 className="font-display text-3xl lg:text-4xl mt-3 text-foreground">
              Estratégia para <span className="text-gradient-warm">curto, médio e longo prazo</span>
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Elaboramos planos de negócio sob medida — do diagnóstico imediato à visão de uma década — com indicadores claros, metas mensuráveis e acompanhamento técnico de quem já passou por todos os ciclos do mercado.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {horizontes.map((h) => (
              <div key={h.prazo} className="p-8 rounded-3xl bg-card border border-border hover:shadow-gold hover:-translate-y-1 transition-all">
                <div className="w-14 h-14 rounded-2xl gradient-warm grid place-items-center shadow-gold">
                  <h.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <p className="mt-6 text-[11px] uppercase tracking-wider text-primary font-bold">{h.periodo}</p>
                <h3 className="mt-1 font-display text-2xl text-foreground">{h.prazo}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>

          {/* Por que profissional capacitado — dados Sebrae */}
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-card to-secondary/40 p-8 lg:p-12">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/15 grid place-items-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-2xl lg:text-3xl text-foreground">
                  Por que sua empresa precisa de um profissional capacitado
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">Dados oficiais do Sebrae mostram o real impacto do planejamento estratégico no Brasil.</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-background/60 border border-border">
                <p className="font-display text-4xl text-gradient-warm">29%</p>
                <p className="mt-2 text-sm text-foreground/85 leading-relaxed">
                  das micro e pequenas empresas <strong>fecham antes de completar 5 anos</strong> no Brasil — a falta de planejamento é uma das principais causas.
                </p>
                <p className="mt-3 text-[11px] text-muted-foreground">Fonte: Sebrae</p>
              </div>
              <div className="p-6 rounded-2xl bg-background/60 border border-border">
                <p className="font-display text-4xl text-gradient-warm">60%</p>
                <p className="mt-2 text-sm text-foreground/85 leading-relaxed">
                  dos empreendedores <strong>não possuem plano de negócios formal</strong>, segundo levantamentos do Sebrae sobre PMEs.
                </p>
                <p className="mt-3 text-[11px] text-muted-foreground">Fonte: Sebrae</p>
              </div>
              <div className="p-6 rounded-2xl bg-background/60 border border-border">
                <p className="font-display text-4xl text-gradient-warm">3x</p>
                <p className="mt-2 text-sm text-foreground/85 leading-relaxed">
                  mais chances de sobrevivência têm os negócios que <strong>seguem um plano estruturado</strong> com acompanhamento profissional.
                </p>
                <p className="mt-3 text-[11px] text-muted-foreground">Fonte: Sebrae</p>
              </div>
            </div>

            <div className="mt-8 p-6 rounded-2xl bg-primary/10 border border-primary/30">
              <p className="text-foreground/90 leading-relaxed">
                <strong className="text-primary">A diferença está na expertise.</strong> Um plano de negócios bem elaborado exige conhecimento técnico em finanças, mercado, projeções e gestão — competências construídas em <strong>20 anos de atuação</strong> ao lado de famílias e empresas reais. Não basta planilha: é preciso método, leitura de cenário e estratégia.
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="rounded-full gradient-warm shadow-gold">
                <Link to="/contato">Solicitar meu plano de negócios <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link to="/cursos">Conhecer os programas</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* PALESTRAS EM IGREJAS */}
      <section className="py-20 lg:py-28">
        <div className="container-prose grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="hidden" />
            <img src={palestraImg} alt="Palestra de Marta Cury em igreja" width={1400} height={900} loading="lazy" className="relative rounded-3xl shadow-card w-full" />
          </div>
          <div className="order-1 lg:order-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> 100% Gratuito para igrejas
            </span>
            <h2 className="font-display text-3xl lg:text-4xl mt-4 text-foreground">Palestras gratuitas de educação financeira e mudança de mentalidade</h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Levamos para a sua congregação uma experiência transformadora — sem custo. Educação financeira prática, princípios bíblicos e uma nova mentalidade sobre dinheiro, prosperidade e propósito.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                "Gratuita para igrejas, ministérios e grupos de fé",
                "Conteúdo de mudança de mentalidade e quebra de crenças limitantes",
                "Apostila personalizada com a identidade da igreja",
                "Acompanhamento pós-evento e plano de grupos de apoio",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground/85">{item}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-8 rounded-full gradient-warm text-primary-foreground border-0 hover:opacity-95 shadow-warm">
              <Link to="/palestras">Solicitar palestra grátis <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-20 lg:py-28 bg-secondary/40">
        <div className="container-prose">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Histórias reais</span>
            <h2 className="font-display text-3xl lg:text-4xl mt-3 text-foreground">Quem caminhou conosco, voltou a sorrir</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {depoimentos.map((d) => (
              <div key={d.nome} className="p-7 rounded-3xl bg-card border border-border shadow-card">
                <Quote className="w-8 h-8 text-primary/40" />
                <p className="mt-4 text-foreground/90 leading-relaxed">"{d.text}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-warm" />
                  <div>
                    <p className="font-medium text-foreground text-sm">{d.nome}</p>
                    <p className="text-xs text-muted-foreground">{d.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VÍDEOS EM DESTAQUE */}
      <VideosDestaque />



      {/* SOBRE MARTINIANA */}
      <section className="py-20 lg:py-28">
        <div className="container-prose grid lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-2 relative">
            <div className="hidden" />
            <img src={martinianaImg} alt="Marta Cury" width={1066} height={1600} loading="lazy" className="relative rounded-lg shadow-card w-full" />
          </div>
          <div className="lg:col-span-3">
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Sobre</span>
            <h2 className="font-display text-3xl lg:text-4xl mt-3 text-foreground">Marta Cury</h2>
            <p className="mt-2 text-muted-foreground italic">Experiência que transforma conhecimento em resultados.</p>
            <div className="mt-6 space-y-4 text-foreground/85 leading-relaxed">
              <p>
                Com mais de 20 anos de experiência no mercado financeiro, construí minha trajetória no Banco do Brasil e no Itaú, onde atuei como gerente geral, liderando equipes e acompanhando de perto os desafios financeiros de pessoas e empresas.
              </p>
              <p>
                Advogada por formação e pós-graduada em Gestão de Pessoas, decidi, em 2023, empreender com um propósito claro: levar a Educação Financeira para além dos interesses das instituições financeiras, oferecendo orientação independente, personalizada e alinhada aos objetivos de cada cliente.
              </p>
              <p>
                Hoje, à frente da R&amp;M Consultoria Financeira, ajudo famílias a organizar suas finanças, sair das dívidas, construir patrimônio e tomar decisões mais conscientes para conquistar segurança e liberdade financeira.
              </p>
            </div>
            <div className="mt-8 grid sm:grid-cols-3 gap-4">
              {[
                { icon: BookOpen, label: "Educadora Financeira" },
                { icon: Users, label: "Consultora 1:1 e em grupo" },
                { icon: Sparkles, label: "Palestrante de impacto" },
              ].map((b) => (
                <div key={b.label} className="p-4 rounded-2xl bg-secondary/60 border border-border">
                  <b.icon className="w-5 h-5 text-primary" />
                  <p className="mt-2 text-sm font-medium text-foreground">{b.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BAIXE O APP */}
      <section className="py-20 lg:py-28 bg-secondary/40">
        <div className="container-prose">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <Smartphone className="w-3.5 h-3.5" /> Aplicativo mobile
            </div>
            <h2 className="font-display text-3xl lg:text-5xl leading-tight">
              Sua vida financeira <span className="text-gradient-warm">no seu bolso</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Instale o app R&M 360° em segundos. Lance despesas, acompanhe metas e receba lembretes — tudo sincronizado com o sistema web em tempo real.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8 items-stretch">
            {/* QR Code card */}
            <div className="relative overflow-hidden rounded-[2rem] gradient-warm p-8 text-primary-foreground shadow-warm flex flex-col items-center justify-center text-center">
              <div className="hidden" />
              <div className="relative">
                <div className="bg-card p-4 rounded-2xl shadow-2xl inline-block">
                  <QRCodeSVG
                    value={typeof window !== "undefined" ? window.location.origin + "/app" : "https://rmconsultoriaeducation.com/app"}
                    size={180}
                    level="M"
                    marginSize={0}
                    fgColor="#1a1a1a"
                  />
                </div>
                <p className="mt-6 font-display text-xl">Aponte a câmera</p>
                <p className="mt-1 text-sm text-primary-foreground/80">
                  Abra a câmera do celular e escaneie o código
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-primary-foreground/80">
                  <ShieldCheck className="w-4 h-4" /> 100% seguro · não precisa de loja
                </div>
                <Link to="/como-instalar" className="mt-4 inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4 hover:text-foreground">
                  Ver passo a passo completo <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Instruções */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Android */}
              <div className="rounded-3xl bg-card border border-border p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Instalar no</div>
                    <div className="font-display text-lg leading-tight">Android</div>
                  </div>
                </div>
                <ol className="space-y-3 text-sm text-muted-foreground flex-1">
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span>Abra o site no <b className="text-foreground">Chrome</b> do celular</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span>Aparece o banner <b className="text-foreground">"Instalar app"</b> — toque nele</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span>Ou toque no menu <b className="text-foreground">⋮</b> → <b className="text-foreground">"Instalar aplicativo"</b></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      <Download className="w-3 h-3" />
                    </span>
                    <span>Pronto! O ícone R&M 360° aparece na tela inicial</span>
                  </li>
                </ol>
              </div>

              {/* iPhone */}
              <div className="rounded-3xl bg-card border border-border p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <Apple className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Instalar no</div>
                    <div className="font-display text-lg leading-tight">iPhone</div>
                  </div>
                </div>
                <ol className="space-y-3 text-sm text-muted-foreground flex-1">
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                    <span>Abra o site no <b className="text-foreground">Safari</b></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      Toque em <Share className="w-3.5 h-3.5 inline text-blue-600" /> <b className="text-foreground">Compartilhar</b>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                    <span className="flex items-center gap-1.5 flex-wrap">
                      Escolha <Plus className="w-3.5 h-3.5 inline" /> <b className="text-foreground">"Adicionar à Tela de Início"</b>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      <Download className="w-3 h-3" />
                    </span>
                    <span>Confirme — o app aparece como qualquer outro no iPhone</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Benefícios rápidos */}
          <div className="mt-10 grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { icon: LineChart, t: "Sincroniza automático", d: "Lançou no celular, aparece no sistema web" },
              { icon: ShieldCheck, t: "Sem app store", d: "Não passa por Google Play nem Apple Store" },
              { icon: Rocket, t: "Abre em 1 segundo", d: "Funciona em tela cheia como app nativo" },
            ].map((b) => (
              <div key={b.t} className="text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <b.icon className="w-5 h-5" />
                </div>
                <div className="text-sm font-medium">{b.t}</div>
                <div className="text-xs text-muted-foreground mt-1">{b.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 lg:py-28">
        <div className="container-prose max-w-3xl">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" /> Perguntas frequentes
            </span>
            <h2 className="font-display text-3xl lg:text-4xl mt-4 text-foreground">
              Dúvidas comuns de quem quer <span className="text-gradient-warm">recomeçar</span>
            </h2>
            <p className="mt-4 text-muted-foreground">Respostas diretas para você dar o próximo passo com confiança.</p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {[
              { q: "Como funciona a mentoria financeira da Marta Cury?", a: "A mentoria começa com um diagnóstico gratuito. Depois, você recebe um plano personalizado de quitação e reorganização do orçamento, com encontros ao vivo e materiais de apoio — no seu ritmo, sem julgamento." },
              { q: "As palestras para igrejas são realmente gratuitas?", a: "Sim. Palestras para igrejas, ministérios e grupos de fé são 100% gratuitas, incluindo apostila personalizada com a identidade da sua igreja e acompanhamento pós-evento." },
              { q: "Vocês atendem empresas em crise?", a: "Sim. O programa de Reestruturação Empresarial faz diagnóstico de caixa, plano de capital de giro e um plano de ação para recolocar a empresa em rota de recuperação — com indicadores semanais." },
              { q: "Preciso pagar para fazer o diagnóstico financeiro?", a: "Não. O diagnóstico é 100% gratuito, leva menos de 5 minutos e já entrega um plano inicial personalizado. É a melhor forma de entender por onde começar." },
              { q: "Como uso o aplicativo R&M 360° no celular?", a: "Basta abrir rmconsultoriaeducation.com/app no navegador do celular e tocar em 'Adicionar à tela inicial'. Não passa por Google Play nem Apple Store e sincroniza com o sistema web em tempo real." },
              { q: "Em quanto tempo eu vejo resultado?", a: "94% das pessoas saem das dívidas em até 12 meses seguindo o método. A dívida média cai 68% já nos primeiros ciclos — mas o mais importante é reconquistar a paz financeira desde a primeira semana." },
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border">
                <AccordionTrigger className="text-left font-display text-base lg:text-lg text-foreground hover:text-primary">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="pb-24">
        <div className="container-prose">
          <div className="relative overflow-hidden rounded-[2.5rem] gradient-warm p-10 lg:p-16 text-primary-foreground shadow-warm">
            <div className="hidden" />
            <div className="hidden" />
            <div className="relative max-w-2xl">
              <h2 className="font-display text-3xl lg:text-5xl leading-tight">
                Seu próximo capítulo começa com um passo simples.
              </h2>
              <p className="mt-4 text-primary-foreground/90 text-lg">
                Faça o diagnóstico financeiro gratuito e receba um plano inicial personalizado em menos de 5 minutos.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" variant="secondary" className="rounded-full h-12 px-7 bg-card text-primary hover:bg-secondary">
                  <Link to="/diagnostico">Começar diagnóstico grátis <ArrowRight className="ml-2 w-4 h-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="rounded-full h-12 px-7 text-primary-foreground hover:bg-primary-foreground/15">
                  <Link to="/contato"><PlayCircle className="mr-2 w-4 h-4" /> Falar com Marta Cury</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
