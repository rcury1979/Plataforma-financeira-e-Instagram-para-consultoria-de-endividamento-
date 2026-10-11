import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { ArrowRight, ArrowLeft, Sparkles, TrendingDown, AlertCircle, CheckCircle2, Heart } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

type Resposta = { id: string; pergunta: string; opcoes: { label: string; valor: number }[] };

const perguntas: Resposta[] = [
  { id: "renda", pergunta: "Sua renda mensal cobre as despesas básicas?", opcoes: [
    { label: "Sim, sobra dinheiro", valor: 3 }, { label: "Mal cobre", valor: 1 }, { label: "Não cobre", valor: 0 } ] },
  { id: "dividas", pergunta: "Qual o tamanho das suas dívidas em relação à renda?", opcoes: [
    { label: "Sem dívidas", valor: 3 }, { label: "Até 3 meses de renda", valor: 2 }, { label: "Entre 3 e 12 meses", valor: 1 }, { label: "Mais de 12 meses", valor: 0 } ] },
  { id: "reserva", pergunta: "Você tem reserva de emergência?", opcoes: [
    { label: "Sim, +6 meses", valor: 3 }, { label: "1 a 6 meses", valor: 2 }, { label: "Menos de 1 mês", valor: 1 }, { label: "Nenhuma", valor: 0 } ] },
  { id: "controle", pergunta: "Você sabe exatamente quanto gasta por mês?", opcoes: [
    { label: "Tudo anotado", valor: 3 }, { label: "Mais ou menos", valor: 1 }, { label: "Não faço ideia", valor: 0 } ] },
  { id: "metas", pergunta: "Tem metas financeiras claras?", opcoes: [
    { label: "Sim, com prazo", valor: 3 }, { label: "Tenho sonhos", valor: 1 }, { label: "Não tenho", valor: 0 } ] },
  { id: "estresse", pergunta: "Quanto dinheiro tira seu sono?", opcoes: [
    { label: "Quase nunca", valor: 3 }, { label: "Às vezes", valor: 1 }, { label: "Quase toda noite", valor: 0 } ] },
];

const leadSchema = z.object({
  nome: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  telefone: z.string().trim().min(8).max(20),
});

export default function Diagnostico() {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [finalizado, setFinalizado] = useState(false);
  const total = perguntas.length;

  function responder(valor: number) {
    const id = perguntas[step].id;
    setRespostas((r) => ({ ...r, [id]: valor }));
    if (step < total - 1) setStep(step + 1);
    else setStep(total);
  }

  const score = Object.values(respostas).reduce((a, b) => a + b, 0);
  const max = total * 3;
  const pct = Math.round((score / max) * 100);

  const diagnostico = pct >= 75
    ? { titulo: "Saúde financeira excelente", cor: "text-sage", icone: CheckCircle2, msg: "Parabéns! Seu controle está acima da média. Aprenda a fazer o dinheiro crescer.", recomendacao: "Curso: Próximo Nível Financeiro" }
    : pct >= 45
    ? { titulo: "Você está no caminho", cor: "text-gold", icone: Heart, msg: "Algumas áreas precisam de atenção. Com o Método GCPM, em 6 meses você muda de patamar.", recomendacao: "Curso: Recomeço Financeiro" }
    : { titulo: "Atenção: situação delicada", cor: "text-destructive", icone: AlertCircle, msg: "Você não está sozinho. Vamos juntos construir um plano de saída — passo a passo.", recomendacao: "Mentoria 1:1 com Marta Cury" };

  function enviarLead(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = leadSchema.safeParse(data);
    if (!parsed.success) {
      toast({ title: "Verifique seus dados", variant: "destructive" });
      return;
    }
    setFinalizado(true);
    toast({ title: "Plano enviado! 💛", description: "Confira seu e-mail nos próximos minutos." });
  }

  return (
    <SiteLayout>
      <section className="py-16 lg:py-24 gradient-soft min-h-[80vh]">
        <div className="container-prose max-w-3xl">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Gratuito • 2 minutos
            </span>
            <h1 className="font-display text-3xl lg:text-5xl mt-5 text-foreground">Diagnóstico financeiro</h1>
            <p className="mt-4 text-muted-foreground">Receba um plano inicial personalizado baseado em 6 perguntas simples.</p>
          </div>

          {step < total && (
            <div className="bg-card rounded-3xl p-8 lg:p-10 shadow-card border border-border">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs text-muted-foreground">Pergunta {step + 1} de {total}</span>
                <div className="flex-1 mx-4 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full gradient-warm transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} />
                </div>
                <span className="text-xs font-medium text-primary">{Math.round(((step + 1) / total) * 100)}%</span>
              </div>
              <h2 className="font-display text-2xl text-foreground">{perguntas[step].pergunta}</h2>
              <div className="mt-6 grid gap-3">
                {perguntas[step].opcoes.map((op) => (
                  <button
                    key={op.label}
                    onClick={() => responder(op.valor)}
                    className="w-full text-left p-5 rounded-2xl border border-border bg-secondary/30 hover:border-primary hover:bg-primary/5 transition-all group flex items-center justify-between"
                  >
                    <span className="font-medium text-foreground">{op.label}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="mt-6 text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                </button>
              )}
            </div>
          )}

          {step === total && !finalizado && (
            <div className="bg-card rounded-3xl p-8 lg:p-10 shadow-card border border-border animate-fade-in">
              <div className="text-center">
                <diagnostico.icone className={`w-14 h-14 mx-auto ${diagnostico.cor}`} />
                <h2 className={`font-display text-3xl mt-4 ${diagnostico.cor}`}>{diagnostico.titulo}</h2>
                <div className="mt-6 inline-flex items-baseline gap-1">
                  <span className="font-display text-6xl text-gradient-warm">{pct}</span>
                  <span className="text-xl text-muted-foreground">/100</span>
                </div>
                <p className="mt-4 text-muted-foreground max-w-lg mx-auto">{diagnostico.msg}</p>
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage/10 text-sage text-sm font-medium">
                  <TrendingDown className="w-4 h-4" /> Recomendação: {diagnostico.recomendacao}
                </div>
              </div>
              <form onSubmit={enviarLead} className="mt-10 pt-8 border-t border-border space-y-4 max-w-md mx-auto">
                <p className="text-center text-sm text-muted-foreground">Receba seu plano inicial completo por e-mail:</p>
                <div><Label htmlFor="nome">Nome</Label><Input id="nome" name="nome" required maxLength={100} /></div>
                <div><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" required maxLength={255} /></div>
                <div><Label htmlFor="telefone">WhatsApp</Label><Input id="telefone" name="telefone" required maxLength={20} /></div>
                <Button type="submit" className="w-full rounded-full h-12 gradient-warm text-primary-foreground border-0 shadow-warm">
                  Receber meu plano grátis <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </form>
            </div>
          )}

          {finalizado && (
            <div className="bg-card rounded-3xl p-10 shadow-card border border-border text-center animate-fade-in">
              <CheckCircle2 className="w-16 h-16 text-sage mx-auto" />
              <h2 className="font-display text-3xl mt-5">Pronto! Confira seu e-mail.</h2>
              <p className="mt-3 text-muted-foreground">Em alguns minutos você recebe seu plano personalizado e um convite para uma conversa de 15min com a Marta Cury.</p>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
