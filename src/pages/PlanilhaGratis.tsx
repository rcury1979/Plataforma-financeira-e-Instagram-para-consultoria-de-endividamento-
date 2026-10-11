import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  FileSpreadsheet, CheckCircle2, Download, MessageCircle, Mail, Sparkles, Lock,
} from "lucide-react";
import { Link } from "react-router-dom";

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().email("E-mail inválido").max(200),
  telefone: z.string().trim().max(30).optional(),
});

const beneficios = [
  "Orçamento mensal com receitas, despesas e saldo automático",
  "Lançamentos diários — registre tudo que entra e sai",
  "Mapa das dívidas — enxergue o quadro completo",
  "Metas e sonhos com % de progresso automático",
  "Aba de suporte direto com a Marta Cury",
  "Pronta para usar no Excel, Google Sheets ou LibreOffice",
];

export default function PlanilhaGratis() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ download: string; whats: string; nome: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd) as Record<string, string>;
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      toast({ title: "Verifique o formulário", description: parsed.error.issues[0]?.message, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("registrar-lead-planilha", {
        body: parsed.data,
      });
      if (error || !res?.ok) throw error || new Error("Erro");
      setSuccess({ download: res.downloadUrl, whats: res.whatsappUrl, nome: parsed.data.nome });
      toast({ title: "Sua planilha está pronta! 💛", description: "O download começou automaticamente." });
      // Disparar download
      const link = document.createElement("a");
      link.href = res.downloadUrl;
      link.download = "planilha-controle-financeiro-rm.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      toast({ title: "Não foi possível enviar", description: "Tente novamente em instantes.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteLayout>
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 gradient-soft" />
        <div className="container-prose relative grid lg:grid-cols-2 gap-12 items-start">
          {/* Lado esquerdo */}
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> 100% gratuito
            </span>
            <h1 className="mt-6 font-display text-4xl lg:text-5xl text-foreground leading-tight">
              Planilha de <span className="text-gradient-warm">Liberdade Financeira</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              Receba grátis a planilha que a Marta Cury usa nas mentorias para ajudar pessoas e famílias a saírem das dívidas e organizarem a vida financeira em poucos dias.
            </p>

            <ul className="mt-8 space-y-3">
              {beneficios.map((b) => (
                <li key={b} className="flex items-start gap-3 text-foreground/85">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 p-5 rounded-2xl bg-card border border-border flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-warm grid place-items-center shrink-0">
                <FileSpreadsheet className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">6 abas profissionais, prontas para usar</p>
                <p className="text-sm text-muted-foreground">Compatível com Excel, Google Sheets e LibreOffice.</p>
              </div>
            </div>
          </div>

          {/* Formulário ou Sucesso */}
          <div className="lg:sticky lg:top-24">
            {!success ? (
              <form
                onSubmit={onSubmit}
                className="p-8 rounded-3xl bg-card border border-border shadow-warm space-y-5"
              >
                <div className="text-center">
                  <h2 className="font-display text-2xl text-foreground">Receba agora a sua planilha</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Preencha seus dados — o download começa na hora.
                  </p>
                </div>

                <div>
                  <Label htmlFor="nome">Seu nome *</Label>
                  <Input id="nome" name="nome" required maxLength={120} placeholder="Como podemos te chamar?" />
                </div>
                <div>
                  <Label htmlFor="email">Seu melhor e-mail *</Label>
                  <Input id="email" name="email" type="email" required maxLength={200} placeholder="voce@email.com" />
                </div>
                <div>
                  <Label htmlFor="telefone">WhatsApp (opcional)</Label>
                  <Input id="telefone" name="telefone" maxLength={30} placeholder="(00) 00000-0000" />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-full gradient-warm text-primary-foreground border-0 shadow-warm hover:opacity-95"
                >
                  <Download className="mr-2 w-4 h-4" />
                  {loading ? "Preparando sua planilha..." : "Quero a planilha grátis"}
                </Button>

                <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1.5">
                  <Lock className="w-3 h-3" /> Seus dados estão seguros. Nada de spam.
                </p>
              </form>
            ) : (
              <div className="p-8 rounded-3xl bg-card border border-border shadow-warm text-center space-y-5">
                <div className="w-16 h-16 mx-auto rounded-full gradient-warm grid place-items-center">
                  <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-display text-2xl text-foreground">Pronto, {success.nome.split(" ")[0]}! 💛</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    O download começou automaticamente. Se não baixou, clique abaixo.
                  </p>
                </div>

                <Button asChild className="w-full h-12 rounded-full gradient-warm text-primary-foreground border-0">
                  <a href={success.download} download>
                    <Download className="mr-2 w-4 h-4" /> Baixar planilha novamente
                  </a>
                </Button>

                <div className="pt-4 border-t border-border space-y-3">
                  <p className="text-sm font-medium text-foreground">Precisa de ajuda para começar?</p>
                  <Button asChild variant="outline" className="w-full h-12 rounded-full border-primary/30">
                    <a href={success.whats} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-2 w-4 h-4 text-primary" /> Falar com a Marta Cury no WhatsApp
                    </a>
                  </Button>
                  <Button asChild variant="ghost" className="w-full h-11 rounded-full">
                    <Link to="/contato">
                      <Mail className="mr-2 w-4 h-4" /> Outras formas de contato
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Suporte */}
      <section className="py-16 bg-secondary/40">
        <div className="container-prose text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl text-foreground">
            Receber a planilha é só o começo
          </h2>
          <p className="mt-4 text-muted-foreground">
            Se quiser ir além, a Marta Cury e a equipe da RM Consultoria estão prontas para te acompanhar — pessoalmente, no WhatsApp ou em uma mentoria personalizada.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="rounded-full h-12 px-7 gradient-warm text-primary-foreground border-0 shadow-warm">
              <a href="https://wa.me/5521986000039" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 w-4 h-4" /> WhatsApp da Marta Cury
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-full h-12 px-7">
              <Link to="/diagnostico">Fazer diagnóstico grátis</Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
