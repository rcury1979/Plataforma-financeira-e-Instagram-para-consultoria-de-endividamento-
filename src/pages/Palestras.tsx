import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Church, Building2, Mic, CheckCircle2, MapPin } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import palestraImg from "@/assets/palestra-igreja.jpg";

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(100),
  organizacao: z.string().trim().min(2, "Informe a organização").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  telefone: z.string().trim().min(8, "Informe o telefone").max(20),
  cidade: z.string().trim().min(2).max(100),
  data: z.string().min(1, "Informe a data desejada"),
  publico: z.string().trim().min(1, "Informe o número de pessoas").max(20),
  mensagem: z.string().trim().max(1000).optional(),
});

const tipos = [
  { icon: Church, titulo: "Igrejas e ministérios", desc: "Palestra 100% gratuita, com apostila e dinâmica para grupos de apoio. Nossa missão é servir a comunidade da fé.", gratis: true },
  { icon: Building2, titulo: "Empresas", desc: "Workshop in-company sobre saúde financeira dos colaboradores.", gratis: false },
  { icon: Mic, titulo: "Eventos e congressos", desc: "Talk de alta performance com slides cinematográficos.", gratis: false },
];

export default function Palestras() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form) as Record<string, string>;
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      toast({ title: "Verifique o formulário", description: parsed.error.issues[0]?.message, variant: "destructive" });
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    toast({ title: "Pedido enviado! 🙌", description: "Entraremos em contato em até 24h para alinhar sua palestra." });
    (e.target as HTMLFormElement).reset();
  }

  return (
    <SiteLayout>
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 gradient-soft" />
        <div className="container-prose relative grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Palestras</span>
            <h1 className="font-display text-4xl lg:text-5xl mt-4 text-foreground">Toque corações. Mude hábitos. Liberte famílias.</h1>
            <p className="mt-5 text-muted-foreground text-lg">Palestras de alta performance com apresentação visual impecável e material didático impresso para cada participante.</p>
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-gold text-gold-foreground text-sm font-semibold shadow-gold">
              <Church className="w-4 h-4" /> Palestras em igrejas são 100% gratuitas
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" /> Atendemos todo o Brasil — presencial e online
            </div>
          </div>
          <img src={palestraImg} alt="Palestra em igreja" width={1400} height={900} loading="lazy" className="rounded-3xl shadow-warm w-full" />
        </div>
      </section>

      <section className="py-16">
        <div className="container-prose grid md:grid-cols-3 gap-5">
          {tipos.map((t) => (
            <div key={t.titulo} className="relative p-7 rounded-3xl bg-card border border-border shadow-card">
              {t.gratis && (
                <span className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider gradient-gold text-gold-foreground shadow-gold">
                  Gratuito
                </span>
              )}
              <div className="w-12 h-12 rounded-2xl gradient-gold grid place-items-center">
                <t.icon className="w-6 h-6 text-gold-foreground" />
              </div>
              <h3 className="font-display text-xl mt-5">{t.titulo}</h3>
              <p className="text-sm text-muted-foreground mt-2">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-secondary/40">
        <div className="container-prose grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Contratar palestra</span>
            <h2 className="font-display text-3xl mt-3">Vamos conversar sobre o seu evento</h2>
            <p className="mt-4 text-muted-foreground">Conte para a Marta Cury sobre seu público e objetivo. Em até 24h ela responde com um plano sob medida.</p>
            <ul className="mt-8 space-y-3 text-sm">
              {["Slides profissionais inclusos", "Apostila personalizada", "Acompanhamento pós-evento", "Gratuito para igrejas e ministérios"].map((b) => (
                <li key={b} className="flex gap-2 items-start"><CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" /> {b}</li>
              ))}
            </ul>
          </div>
          <form onSubmit={onSubmit} className="lg:col-span-3 p-8 rounded-3xl bg-card border border-border shadow-card space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label htmlFor="nome">Seu nome *</Label><Input id="nome" name="nome" required maxLength={100} /></div>
              <div><Label htmlFor="organizacao">Igreja / Empresa *</Label><Input id="organizacao" name="organizacao" required maxLength={100} /></div>
              <div><Label htmlFor="email">E-mail *</Label><Input id="email" name="email" type="email" required maxLength={255} /></div>
              <div><Label htmlFor="telefone">WhatsApp *</Label><Input id="telefone" name="telefone" required maxLength={20} /></div>
              <div><Label htmlFor="cidade">Cidade / UF *</Label><Input id="cidade" name="cidade" required maxLength={100} /></div>
              <div><Label htmlFor="data">Data desejada *</Label><Input id="data" name="data" type="date" required /></div>
              <div className="sm:col-span-2"><Label htmlFor="publico">Público estimado *</Label><Input id="publico" name="publico" placeholder="Ex: 80 pessoas" required maxLength={20} /></div>
              <div className="sm:col-span-2"><Label htmlFor="mensagem">Conte um pouco sobre o evento</Label><Textarea id="mensagem" name="mensagem" rows={4} maxLength={1000} /></div>
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-full h-12 gradient-warm text-primary-foreground border-0 shadow-warm hover:opacity-95">
              <Calendar className="mr-2 w-4 h-4" /> {loading ? "Enviando..." : "Solicitar palestra"}
            </Button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
