import { useState } from "react";
import SiteLayout from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, Lock } from "lucide-react";

export default function Agendar() {
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [form, setForm] = useState({ nome_contato: "", telefone: "", email: "", inicio: "", assunto: "", observacoes: "" });

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    const { error } = await (supabase as any).from("agendamentos").insert({
      nome_contato: form.nome_contato.trim(),
      telefone: form.telefone || null,
      email: form.email || null,
      inicio: new Date(form.inicio).toISOString(),
      assunto: form.assunto || null,
      observacoes: form.observacoes || null,
      status: "solicitado",
      origem: "publico",
    });
    setEnviando(false);
    if (error) return toast.error("Não conseguimos registrar agora. Tente novamente em instantes.");
    setEnviado(true);
  };

  return (
    <SiteLayout>
      <section className="py-16 lg:py-24">
        <div className="container-prose max-w-2xl">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-full gradient-warm flex items-center justify-center shadow-warm">
              <CalendarDays className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl lg:text-4xl mt-6">Agendar uma conversa</h1>
            <p className="mt-4 text-muted-foreground">
              Escolha um horário que funcione para você. Confirmo o encontro pelo WhatsApp
              assim que receber o seu pedido.
            </p>
          </div>

          {enviado ? (
            <Card className="mt-10 p-8 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto text-[hsl(var(--success))]" />
              <h2 className="font-display text-2xl mt-4">Pedido enviado</h2>
              <p className="mt-3 text-muted-foreground">
                Seu horário está reservado como pedido. Você recebe a confirmação em breve.
              </p>
            </Card>
          ) : (
            <Card className="mt-10 p-6 lg:p-8">
              <form onSubmit={enviar} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Seu nome</Label>
                  <Input id="nome" required value={form.nome_contato} onChange={(e) => setForm({ ...form, nome_contato: e.target.value })} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tel">WhatsApp</Label>
                    <Input id="tel" inputMode="tel" required value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="inicio">Data e hora desejada</Label>
                  <Input id="inicio" type="datetime-local" required value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="assunto">Assunto</Label>
                  <Input id="assunto" placeholder="Ex.: primeira conversa sobre dívidas" value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="obs">Quer adiantar algo?</Label>
                  <Textarea id="obs" rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
                </div>
                <Button type="submit" size="lg" disabled={enviando} className="w-full rounded-full gradient-warm text-primary-foreground border-0 hover:opacity-95 shadow-warm">
                  {enviando ? "Enviando…" : "Pedir este horário"}
                </Button>
                <p className="text-xs text-muted-foreground flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Dados tratados com sigilo, conforme a LGPD.
                </p>
              </form>
            </Card>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
