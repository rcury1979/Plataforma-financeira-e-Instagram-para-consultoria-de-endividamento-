import { useEffect, useState } from "react";
import { BookOpen, Download, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { canReceiveSignupGifts, SIGNUP_GIFT_BUCKET, SIGNUP_GIFTS } from "@/lib/signup-gifts";
import { toast } from "sonner";

export default function Brindes() {
  const [eligible, setEligible] = useState(false);
  const [ready, setReady] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) { setEligible(canReceiveSignupGifts(data.user)); setReady(true); }
    });
    return () => { mounted = false; };
  }, []);

  async function download(filename: string) {
    if (!eligible || downloading) return;
    setDownloading(filename);
    try {
      const { data, error } = await supabase.storage.from(SIGNUP_GIFT_BUCKET).download(filename);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = filename;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      toast.success("Seu e-book está pronto para guardar.");
    } catch {
      toast.error("Não foi possível baixar agora. Tente novamente em instantes.");
    } finally { setDownloading(null); }
  }

  if (!ready) return <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 pb-8">
      <header className="space-y-3">
        <Gift className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-display">Seus e-books de presente</h1>
        <p className="text-muted-foreground">Um primeiro passo para cuidar do seu dinheiro, com orientação de Marta Cury.</p>
      </header>
      {!eligible && <p role="status" className="border-l-2 border-primary pl-4 text-sm text-muted-foreground">Confirme seu e-mail para receber os dois e-books gratuitamente.</p>}
      <div className="grid sm:grid-cols-2 gap-5">
        {SIGNUP_GIFTS.map((gift, index) => (
          <article key={gift.id} className="rounded-lg border border-border bg-card overflow-hidden flex flex-col">
            <div className="aspect-[4/3] bg-secondary p-6 flex flex-col justify-between border-b border-border">
              <span className="text-xs text-primary">MARTA CURY · {String(index + 1).padStart(2, "0")}</span>
              <h2 className="font-display text-2xl">{gift.title}</h2>
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div className="p-5 flex-1 flex flex-col gap-4">
              <p className="text-sm text-muted-foreground flex-1">{gift.description}</p>
              <span className="text-xs text-muted-foreground">PDF · {gift.pages} páginas · Gratuito</span>
              <Button onClick={() => download(gift.filename)} disabled={!eligible || downloading !== null}>
                {downloading === gift.filename ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Baixar e-book
              </Button>
            </div>
          </article>
        ))}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">Materiais educativos gratuitos. Consultorias e planos pagos são contratados separadamente. Não há promessa de rendimento ou de quitação de dívidas.</p>
    </div>
  );
}