import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { temAcessoApp } from "@/lib/acesso";

/** Volta do Stripe: espera o aviso do pagamento chegar ao servidor e libera a entrada no app. */
export default function PagamentoSucesso() {
  const [email, setEmail] = useState<string | null>(null);
  const [estado, setEstado] = useState<"conferindo" | "liberado" | "demorando">("conferindo");

  useEffect(() => {
    let vivo = true;
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    (async () => {
      // O Stripe avisa o servidor em poucos segundos; conferimos por até ~40 s.
      for (let i = 0; i < 20 && vivo; i++) {
        if (await temAcessoApp()) { if (vivo) setEstado("liberado"); return; }
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (vivo) setEstado("demorando");
    })();
    return () => { vivo = false; };
  }, []);

  return (
    <div className="cliente-area min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center rounded-2xl border bg-card p-8">
        {estado === "conferindo" && (
          <>
            <Loader2 className="w-14 h-14 text-gold mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold mb-2">Confirmando sua assinatura…</h1>
            <p className="text-muted-foreground">Leva só alguns segundos. Não feche esta página.</p>
          </>
        )}
        {estado === "liberado" && (
          <>
            <CheckCircle2 className="w-16 h-16 text-gold mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Assinatura confirmada!</h1>
            <p className="text-muted-foreground mb-6">Seu acesso ao app R&amp;M 360° está liberado. Bons começos!</p>
          </>
        )}
        {estado === "demorando" && (
          <>
            <Clock className="w-14 h-14 text-gold mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Pagamento recebido</h1>
            <p className="text-muted-foreground mb-6">
              A confirmação está demorando um pouco mais que o normal. Toque em <b>Entrar no app</b> em alguns minutos —
              se não abrir, fale com a gente pelo WhatsApp (21) 98600-0039.
            </p>
          </>
        )}

        {estado !== "conferindo" && (
          <>
            <div className="mb-6 rounded-xl border bg-secondary/40 p-4 text-left text-sm">
              <p className="font-semibold mb-1">Seu acesso ao app</p>
              <p className="text-muted-foreground">
                <b className="text-foreground">Login:</b> {email ?? "o e-mail que você cadastrou"}<br />
                <b className="text-foreground">Senha:</b> a que você criou no cadastro.
              </p>
              <p className="mt-2 text-muted-foreground">
                Esqueceu a senha? Na tela de entrada, toque em <b className="text-foreground">Esqueci minha senha</b>.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full rounded-full"><Link to="/cliente">Entrar no app</Link></Button>
              <Button asChild variant="outline" className="w-full rounded-full"><Link to="/">Voltar para o site</Link></Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
