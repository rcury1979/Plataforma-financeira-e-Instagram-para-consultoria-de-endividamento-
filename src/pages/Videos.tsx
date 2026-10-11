import { useEffect, useMemo, useState } from "react";
import SiteLayout from "@/components/site/SiteLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Instagram, Search, Video as VideoIcon } from "lucide-react";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, useReels } from "@/components/site/reels";
import { ReelCard, InstagramCTA } from "@/components/site/ReelCard";

/** Temas simples para filtrar por palavras-chave presentes no título. */
const TEMAS: { label: string; termos: string[] }[] = [
  { label: "Todos", termos: [] },
  { label: "Dívidas", termos: ["dívida", "divida", "negocia", "juros"] },
  { label: "Organização", termos: ["organiz", "conta", "planilha", "controle"] },
  { label: "Planejamento", termos: ["plano", "planej", "meta", "orçamento", "orcamento"] },
  { label: "Investir", termos: ["invest", "reserva", "poupar", "patrimônio", "patrimonio"] },
];

export default function Videos() {
  const { reels, carregando } = useReels();
  const [busca, setBusca] = useState("");
  const [tema, setTema] = useState("Todos");

  useEffect(() => {
    document.title = "Vídeos sobre organização financeira | RM Consultoria";
    const desc = document.querySelector('meta[name="description"]');
    desc?.setAttribute(
      "content",
      "Assista aos vídeos curtos da mentoria: como organizar as contas, sair das dívidas e recomeçar com um plano possível.",
    );
  }, []);


  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const termosTema = TEMAS.find((t) => t.label === tema)?.termos ?? [];
    return reels.filter((r) => {
      const titulo = r.title.toLowerCase();
      const passaBusca = !termo || titulo.includes(termo);
      const passaTema = termosTema.length === 0 || termosTema.some((t) => titulo.includes(t));
      return passaBusca && passaTema;
    });
  }, [reels, busca, tema]);

  return (
    <SiteLayout>
      <section className="py-16 lg:py-24">
        <div className="container-prose">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">
              Conteúdo gratuito
            </span>
            <h1 className="font-display text-3xl lg:text-5xl mt-3 text-foreground">Vídeos</h1>
            <p className="mt-4 text-muted-foreground">
              Os vídeos mais assistidos da Marta Cury reunidos em um só lugar. Use a busca ou escolha um tema
              para encontrar o que você precisa agora.
            </p>
            <Button asChild className="mt-6 rounded-full gradient-warm text-primary-foreground border-0 shadow-warm hover:opacity-95">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                <Instagram className="mr-2 w-4 h-4" /> Seguir {INSTAGRAM_HANDLE} no Instagram
              </a>
            </Button>
          </div>

          <div className="mt-10 max-w-3xl mx-auto space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por assunto (ex.: dívidas, orçamento)"
                aria-label="Buscar vídeos"
                className="pl-11 rounded-full h-12"
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {TEMAS.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setTema(t.label)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    tema === t.label
                      ? "bg-primary/10 text-primary border-primary/40"
                      : "text-foreground/75 border-border hover:bg-secondary"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {carregando
                ? "Carregando vídeos…"
                : filtrados.length === 1
                  ? "1 vídeo encontrado"
                  : `${filtrados.length} vídeos encontrados`}
            </p>
          </div>

          <div className="mt-12">
            {filtrados.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtrados.map((reel) => <ReelCard key={reel.code} reel={reel} />)}
              </div>
            ) : (
              !carregando && (
                <div className="max-w-xl mx-auto p-8 rounded-3xl bg-card border border-border shadow-card text-center">
                  <div className="w-12 h-12 mx-auto rounded-full gradient-warm flex items-center justify-center">
                    <VideoIcon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <p className="mt-5 text-foreground/90">
                    Nenhum vídeo encontrado com esse filtro.
                  </p>
                  <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setBusca("");
                        setTema("Todos");
                      }}
                    >
                      Limpar filtros
                    </Button>
                    <Button
                      asChild
                      className="rounded-full gradient-warm text-primary-foreground border-0 shadow-warm hover:opacity-95"
                    >
                      <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                        <Instagram className="mr-2 w-4 h-4" /> Ver o perfil
                      </a>
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
          <InstagramCTA />
        </div>
      </section>
    </SiteLayout>
  );
}
