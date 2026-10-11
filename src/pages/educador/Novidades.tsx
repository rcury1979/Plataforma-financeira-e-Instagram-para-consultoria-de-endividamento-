/* Novidades do produto (últimos 30 dias), com marcação de lidas no navegador. */
import { Fragment, useMemo, useState } from "react";
import { CheckCheck, Megaphone, Sparkles, Wrench, Zap } from "lucide-react";
import { EmptyState, MESES, PageHeader, Pill } from "../cliente/_shared";
import { NOVIDADES, type TipoNovidade } from "./_novidades-data";

const LS_KEY = "rm-edu-novidades-lidas";
const lerLidas = (): string[] => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
};
const gravarLidas = (ids: string[]) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(ids)); } catch { /* navegador sem armazenamento: ignora */ }
};

const SELO: Record<TipoNovidade, { cls: string; icon: typeof Sparkles }> = {
  Novidade: { cls: "bg-gold-soft text-primary", icon: Sparkles },
  Melhoria: { cls: "bg-primary/10 text-primary", icon: Zap },
  Correção: { cls: "bg-success/10 text-success", icon: Wrench },
};

const dataExtenso = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} de ${MESES[m - 1].toLowerCase()} de ${y}`;
};

/** Converte "**trecho**" em negrito. */
function Paragrafo({ texto }: { texto: string }) {
  const partes = texto.split(/\*\*(.+?)\*\*/g);
  return (
    <p>
      {partes.map((p, i) => (i % 2 ? <strong key={i} className="font-semibold text-foreground">{p}</strong> : <Fragment key={i}>{p}</Fragment>))}
    </p>
  );
}

export default function EduNovidades() {
  const [lidas, setLidas] = useState<string[]>(lerLidas);
  const posts = useMemo(() => {
    const limite = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
    return NOVIDADES.filter((n) => n.data >= limite).sort((a, b) => b.data.localeCompare(a.data));
  }, []);
  const naoLidas = posts.filter((p) => !lidas.includes(p.id)).length;

  const marcar = (ids: string[]) => {
    const novo = [...new Set([...lidas, ...ids])];
    setLidas(novo);
    gravarLidas(novo);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Novidades"
        desc="Atualizações, melhorias e correções dos últimos 30 dias."
        right={
          <Pill onClick={() => marcar(posts.map((p) => p.id))} disabled={naoLidas === 0}>
            <CheckCheck className="h-4 w-4" /> Marcar tudo como lido
          </Pill>
        }
      />

      {posts.length === 0 ? (
        <EmptyState title="Nenhuma novidade nos últimos 30 dias" desc="Quando lançarmos algo novo, você fica sabendo por aqui." />
      ) : (
        <div className="space-y-5">
          {posts.map((n) => {
            const naoLida = !lidas.includes(n.id);
            const S = SELO[n.tipo];
            return (
              <article
                key={n.id}
                onClick={() => naoLida && marcar([n.id])}
                className="relative rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_hsl(222_47%_14%/0.06)] sm:p-7"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${S.cls}`}>
                    <S.icon className="h-3.5 w-3.5" /> {n.tipo}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {naoLida && <span className="h-2.5 w-2.5 rounded-full bg-gold" title="Não lida" aria-label="Não lida" />}
                    {dataExtenso(n.data)}
                  </span>
                </div>
                <h2 className="font-display text-xl leading-snug text-foreground">{n.titulo}</h2>
                <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
                  {n.corpo.map((p, i) => <Paragrafo key={i} texto={p} />)}
                </div>
              </article>
            );
          })}
          <p className="flex items-center justify-center gap-2 pb-4 text-xs text-muted-foreground">
            <Megaphone className="h-3.5 w-3.5" /> Isso é tudo dos últimos 30 dias.
          </p>
        </div>
      )}
    </div>
  );
}
