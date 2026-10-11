import { useState } from "react";
import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Heart, ShieldCheck, CheckCircle2, Lock } from "lucide-react";

export default function QueroAjuda() {
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", tipo_pessoa: "Pessoa física", mensagem: "" });

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    const { error } = await (supabase as any).from("captacao_publica").insert({
      nome: form.nome.trim(),
      telefone: form.telefone || null,
      email: form.email || null,
      tipo_pessoa: form.tipo_pessoa,
      mensagem: form.mensagem || null,
      origem: "pagina-publica",
    });
    setEnviando(false);
    if (error) return toast.error("Não conseguimos enviar agora. Tente novamente em instantes.");
    setEnviado(true);
  };

  return (
    <SiteLayout>
      <section className="py-16 lg:py-24">
        <div className="container-prose max-w-2xl">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-full gradient-warm flex items-center justify-center shadow-warm">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl lg:text-4xl mt-6 text-foreground">
              Quero organizar minha vida financeira
            </h1>
            <p className="mt-4 text-muted-foreground">
              Sem julgamento, sem vergonha e sem promessa mágica. Conte sua situação em poucas linhas —
              eu leio pessoalmente e te respondo com o próximo passo possível.
            </p>
          </div>

          {enviado ? (
            <Card className="mt-10 p-8 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto text-[hsl(var(--success))]" />
              <h2 className="font-display text-2xl mt-4">Recebi seu contato</h2>
              <p className="mt-3 text-muted-foreground">
                Você deu o passo mais difícil, que é pedir ajuda. Vou te responder no WhatsApp
                ou no e-mail que você deixou.
              </p>
            </Card>
          ) : (
            <Card className="mt-10 p-6 lg:p-8">
              <form onSubmit={enviar} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Seu nome</Label>
                  <Input id="nome" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telefone">WhatsApp</Label>
                    <Input id="telefone" inputMode="tel" placeholder="(21) 90000-0000" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="perfil">Você quer ajuda para…</Label>
                  <select
                    id="perfil"
                    className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.tipo_pessoa}
                    onChange={(e) => setForm({ ...form, tipo_pessoa: e.target.value })}
                  >
                    <option value="Pessoa física">Minha vida pessoal / da minha família</option>
                    <option value="Pessoa jurídica">Minha empresa</option>
                    <option value="Os dois">Os dois</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="mensagem">O que mais te aperta hoje?</Label>
                  <Textarea
                    id="mensagem"
                    rows={4}
                    placeholder="Ex.: estou com o nome negativado e não sei por onde começar."
                    value={form.mensagem}
                    onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
                  />
                </div>
                <Button type="submit" size="lg" disabled={enviando} className="w-full rounded-full gradient-warm text-primary-foreground border-0 hover:opacity-95 shadow-warm">
                  {enviando ? "Enviando…" : "Quero ser ajudado"}
                </Button>
                <p className="text-xs text-muted-foreground flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Seus dados são tratados de forma confidencial, em conformidade com a LGPD, e usados
                  apenas para entrar em contato com você.
                </p>
              </form>
            </Card>
          )}

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4" /> Conexão protegida · Dados sob sigilo profissional
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
