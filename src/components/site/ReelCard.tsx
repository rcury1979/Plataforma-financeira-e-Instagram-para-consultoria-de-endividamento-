import { Instagram, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, reelUrl, type Reel } from "./reels";

export function ReelCard({ reel }: { reel: Reel }) {
  return (
    <div className="rounded-3xl overflow-hidden bg-card border border-border shadow-card flex flex-col">
      <div className="relative w-full" style={{ aspectRatio: "9 / 16" }}>
        <iframe
          src={`https://www.instagram.com/reel/${reel.code}/embed`}
          title={reel.title}
          loading="lazy"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
      <div className="p-4 flex items-start justify-between gap-3">
        <p className="text-sm text-foreground/90">{reel.title}</p>
        <a
          href={reelUrl(reel.code)}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          aria-label={`Abrir no Instagram: ${reel.title}`}
        >
          Abrir <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

/** Faixa de chamada para seguir o perfil no Instagram. */
export function InstagramCTA({ texto = "Tem vídeo novo toda semana sobre dívidas, orçamento e planejamento." }: { texto?: string }) {
  return (
    <div className="mt-12 rounded-3xl border border-border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full gradient-warm">
        <Instagram className="h-6 w-6 text-primary-foreground" />
      </span>
      <div className="flex-1">
        <p className="font-display text-xl text-foreground">Siga {INSTAGRAM_HANDLE} no Instagram</p>
        <p className="mt-1 text-sm text-muted-foreground">{texto}</p>
      </div>
      <Button asChild size="lg" className="rounded-full gradient-warm text-primary-foreground border-0 shadow-warm hover:opacity-95">
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
          <Instagram className="mr-2 w-4 h-4" /> Seguir no Instagram
        </a>
      </Button>
    </div>
  );
}
