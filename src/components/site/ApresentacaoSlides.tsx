/* Visualizador de slides: setas, teclado, deslizar no celular e tela cheia. */
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

type Props = { slides: string[]; titulo: string; aberto: boolean; onAbrir: () => void; onFechar: () => void };

export default function ApresentacaoSlides({ slides, titulo, aberto, onAbrir, onFechar }: Props) {
  const [i, setI] = useState(0);
  const toque = useRef<number | null>(null);
  const total = slides.length;
  const ir = useCallback((d: number) => setI((n) => Math.min(total - 1, Math.max(0, n + d))), [total]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (!aberto) return;
      if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); ir(1); }
      if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); ir(-1); }
      if (e.key === "Escape") onFechar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aberto, ir, onFechar]);

  useEffect(() => {
    if (!aberto) return;
    document.body.style.overflow = "hidden";
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => {
      document.body.style.overflow = "";
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [aberto]);

  // Se a pessoa sair da tela cheia pelo navegador (Esc), fecha a apresentação também.
  useEffect(() => {
    const saiu = () => { if (aberto && !document.fullscreenElement) onFechar(); };
    document.addEventListener("fullscreenchange", saiu);
    return () => document.removeEventListener("fullscreenchange", saiu);
  }, [aberto, onFechar]);

  // Pré-carrega o próximo slide
  useEffect(() => { if (slides[i + 1]) new Image().src = slides[i + 1]; }, [i, slides]);

  const gestos = {
    onTouchStart: (e: React.TouchEvent) => { toque.current = e.touches[0].clientX; },
    onTouchEnd: (e: React.TouchEvent) => {
      if (toque.current === null) return;
      const dx = e.changedTouches[0].clientX - toque.current;
      if (Math.abs(dx) > 40) ir(dx < 0 ? 1 : -1);
      toque.current = null;
    },
  };

  const Botao = ({ d, claro }: { d: 1 | -1; claro?: boolean }) => (
    <button type="button" onClick={() => ir(d)} disabled={d < 0 ? i === 0 : i === total - 1}
      aria-label={d < 0 ? "Slide anterior" : "Próximo slide"}
      className={`grid h-11 w-11 place-items-center rounded-full transition disabled:opacity-30 ${claro ? "bg-white/15 text-white hover:bg-white/25" : "bg-secondary text-foreground hover:bg-secondary/70"}`}>
      {d < 0 ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
    </button>
  );

  if (aberto) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-black" role="dialog" aria-label={titulo} {...gestos}>
        <div className="flex flex-1 items-center justify-center p-2 sm:p-6" onClick={() => ir(1)}>
          <img src={slides[i]} alt={`${titulo} — slide ${i + 1} de ${total}`} className="max-h-full max-w-full select-none object-contain" draggable={false} />
        </div>
        <div className="flex items-center justify-between gap-3 px-4 pb-4 text-white">
          <button type="button" onClick={onFechar} className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm hover:bg-white/25">
            <X className="h-4 w-4" /> Sair
          </button>
          <div className="flex items-center gap-3">
            <Botao d={-1} claro />
            <span className="min-w-[4rem] text-center text-sm tabular-nums">{i + 1} / {total}</span>
            <Botao d={1} claro />
          </div>
          <span className="hidden w-[5.5rem] sm:block" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border border-border bg-black shadow-lg" {...gestos}>
        <img src={slides[i]} alt={`${titulo} — slide ${i + 1} de ${total}`} className="aspect-video w-full select-none object-contain" draggable={false} />
        <button type="button" onClick={onAbrir} aria-label="Tela cheia"
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80">
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 flex items-center justify-center gap-4">
        <Botao d={-1} />
        <span className="min-w-[4rem] text-center text-sm tabular-nums text-muted-foreground">{i + 1} / {total}</span>
        <Botao d={1} />
      </div>
    </div>
  );
}
