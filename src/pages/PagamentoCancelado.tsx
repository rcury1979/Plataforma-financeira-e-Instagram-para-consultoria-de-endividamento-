import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PagamentoCancelado() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center rounded-xl border bg-card p-8">
        <XCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Pagamento cancelado</h1>
        <p className="text-muted-foreground mb-6">
          Nenhuma cobrança foi feita. Você pode escolher outro plano quando quiser.
        </p>
        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link to="/planos">Ver planos novamente</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/">Voltar para o site</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
