import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageCircle, Instagram, Send } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  nome: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  mensagem: z.string().trim().min(10).max(1000),
});

export default function Contato() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      toast({ title: "Verifique o formulário", description: parsed.error.issues[0]?.message, variant: "destructive" });
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    toast({ title: "Mensagem enviada! 💛", description: "Em breve a Marta Cury entra em contato." });
    (e.target as HTMLFormElement).reset();
  }

  return (
    <SiteLayout>
      <section className="py-16 lg:py-24 gradient-soft">
        <div className="container-prose grid lg:grid-cols-2 gap-12">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Fale conosco</span>
            <h1 className="font-display text-4xl lg:text-5xl mt-4 text-foreground">Vamos conversar.</h1>
            <p className="mt-5 text-muted-foreground text-lg">Preencha o formulário ou fale direto pelos nossos canais. Respondemos em até 24h.</p>
            <div className="mt-10 space-y-5">
              {[
                { icon: Mail, label: "E-mail", value: "contato@rmconsultoria.finance", href: "mailto:contato@rmconsultoria.finance" },
                { icon: MessageCircle, label: "WhatsApp", value: "(21) 98600-0039", href: "https://wa.me/5521986000039" },
                { icon: Instagram, label: "Instagram", value: "@marta_curyy", href: "https://www.instagram.com/marta_curyy" },
              ].map((c) => (
                <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl gradient-warm grid place-items-center shadow-warm group-hover:scale-105 transition-transform">
                    <c.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">{c.value}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
          <form onSubmit={onSubmit} className="p-8 rounded-3xl bg-card border border-border shadow-card space-y-4 h-fit">
            <div><Label htmlFor="nome">Seu nome</Label><Input id="nome" name="nome" required maxLength={100} /></div>
            <div><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" required maxLength={255} /></div>
            <div><Label htmlFor="mensagem">Mensagem</Label><Textarea id="mensagem" name="mensagem" rows={6} required maxLength={1000} /></div>
            <Button type="submit" disabled={loading} className="w-full rounded-full h-12 gradient-warm text-primary-foreground border-0 shadow-warm hover:opacity-95">
              <Send className="mr-2 w-4 h-4" /> {loading ? "Enviando..." : "Enviar mensagem"}
            </Button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
