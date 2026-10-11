import { Link } from "react-router-dom";
import { ArrowRight, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { INSTAGRAM_URL, useReels } from "./reels";
import { ReelCard, InstagramCTA } from "./ReelCard";

export { REELS_PADRAO as REELS } from "./reels";

/** Seção da página inicial: os 6 vídeos mais assistidos e chamada para o Instagram. */
export default function VideosDestaque() {
  const { reels } = useReels();
  const destaque = reels.slice(0, 6);

  return (
    <section className="py-20 lg:py-28" id="videos">
      <div className="container-prose">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">Instagram</span>
          <h2 className="font-display text-3xl lg:text-4xl mt-3 text-foreground">Vídeos mais assistidos</h2>
          <p className="mt-4 text-muted-foreground">
            Conteúdos curtos sobre organizar as contas, sair das dívidas e recomeçar com um plano possível.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destaque.map((reel) => <ReelCard key={reel.code} reel={reel} />)}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <Link to="/videos">Ver todos os vídeos <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
          <Button asChild size="lg" className="rounded-full gradient-warm text-primary-foreground border-0 shadow-warm hover:opacity-95">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              <Instagram className="mr-2 w-4 h-4" /> Seguir no Instagram
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

export { InstagramCTA };
