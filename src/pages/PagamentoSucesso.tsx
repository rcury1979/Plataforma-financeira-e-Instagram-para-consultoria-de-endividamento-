import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PagamentoSucesso() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center rounded-xl border bg-card p-8">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Pagamento confirmado!</h1>
        <p className="text-muted-foreground mb-6">
          Sua assinatura está ativa. Já liberamos o acesso completo à plataforma.
        </p>
        <div className="mb-6 rounded-lg border bg-muted/40 p-4 text-left text-sm">
          <p className="font-semibold mb-1">Seu acesso ao app</p>
          <p className="text-muted-foreground">
            <b className="text-foreground">Login:</b> {email ?? "o e-mail que você cadastrou"}<br />
            <b className="text-foreground">Senha:</b> a que você criou no cadastro.
          </p>
          <p className="mt-2 text-muted-foreground">
            Esqueceu a senha? Na tela de entrada, toque em <b className="text-foreground">Esqueci minha senha</b> e enviamos um link para criar outra.
          </p>
        </div>
        {sessionId && (
          <p className="text-xs text-muted-foreground mb-6 break-all">
            Ref: {sessionId}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link to="/app">Ir para o painel</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/">Voltar para o site</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
