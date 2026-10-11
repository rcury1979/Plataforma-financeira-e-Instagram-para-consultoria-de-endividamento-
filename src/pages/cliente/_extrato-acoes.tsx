/* Botões Receita / Despesa / Transferência + diálogo de lançamento (Dashboard e Extrato). */
import { useState } from "react";
import { ArrowLeftRight, TrendingDown, TrendingUp, ThumbsUp } from "lucide-react";
import { LancamentoDialog, type TipoLanc } from "./_LancamentoDialog";
import { Pill, type Cartao, type Categoria, type Conta, type Lancamento } from "./_shared";

type Cad = { contas: Conta[]; cartoes: Cartao[]; categorias: Categoria[] };

/** Estado do diálogo: novo de um tipo, ou edição de um lançamento. */
export function useLancDialog() {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<TipoLanc>("despesa");
  const [editing, setEditing] = useState<Lancamento | null>(null);
  return {
    open, setOpen, tipo, editing,
    novo: (t: TipoLanc) => { setEditing(null); setTipo(t); setOpen(true); },
    editar: (l: Lancamento) => { setEditing(l); setTipo(l.tipo); setOpen(true); },
  };
}

export function BotoesLancamento({ onNovo, className = "" }: { onNovo: (t: TipoLanc) => void; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Pill onClick={() => onNovo("receita")}><TrendingUp className="h-4 w-4 text-success" /> Receita</Pill>
      <Pill onClick={() => onNovo("despesa")}><TrendingDown className="h-4 w-4 text-destructive" /> Despesa</Pill>
      <Pill onClick={() => onNovo("transferencia")}><ArrowLeftRight className="h-4 w-4 text-gold" /> Transferência</Pill>
    </div>
  );
}

export function DialogoLancamento({ d, userId, cad, onSaved }: { d: ReturnType<typeof useLancDialog>; userId: string | null; cad: Cad; onSaved: () => void }) {
  if (!userId) return null;
  return (
    <LancamentoDialog
      open={d.open} onOpenChange={d.setOpen} tipo={d.tipo} editing={d.editing} userId={userId}
      contas={cad.contas} cartoes={cad.cartoes} categorias={cad.categorias} onSaved={onSaved}
    />
  );
}

/** Botão de status: polegar para cima = pago; cinza = pendente. */
export function BotaoPago({ pago, tipo, onClick }: { pago: boolean; tipo: string; onClick: () => void }) {
  const rotulo = pago ? (tipo === "receita" ? "Recebido" : "Pago") : "Pendente — clique para marcar como " + (tipo === "receita" ? "recebido" : "pago");
  return (
    <button
      type="button"
      title={rotulo}
      aria-label={rotulo}
      aria-pressed={pago}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition ${
        pago ? "bg-success/10 text-success hover:bg-success/20" : "bg-secondary text-muted-foreground/60 hover:text-foreground"
      }`}
    >
      <ThumbsUp className="h-4 w-4" />
    </button>
  );
}
