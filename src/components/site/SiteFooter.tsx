import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Sparkles, Mail, Instagram, MessageCircle, ShieldCheck, Lock } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export default function SiteFooter() {
  return (
    <footer className="public-footer">
      <div className="container-prose py-14 grid lg:grid-cols-2 gap-10 border-b border-border">
        <div><p className="text-primary text-xs uppercase mb-3">Vamos conversar</p><h2 className="font-display text-3xl">Seu próximo passo começa aqui.</h2><p className="mt-4 text-muted-foreground">Conte com uma orientação acolhedora para sua vida ou seu negócio.</p></div>
        <form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); window.open(buildWhatsAppLink(`Olá, Marta Cury! Meu nome é ${data.get("nome")}. Busco orientação financeira para ${data.get("perfil")}.`), "_blank", "noopener,noreferrer"); }} className="grid sm:grid-cols-2 gap-4">
          <div><Label htmlFor="footer-nome">Seu nome</Label><Input id="footer-nome" name="nome" required minLength={2} maxLength={100} className="mt-2 bg-card" /></div>
          <div><Label htmlFor="footer-perfil">Busco ajuda como</Label><select id="footer-perfil" name="perfil" className="mt-2 h-10 w-full border border-input rounded-md bg-card px-3 text-sm"><option>Pessoa Física</option><option>Pessoa Jurídica</option></select></div>
          <Button type="submit" className="sm:col-span-2 justify-between">Conversar no WhatsApp <MessageCircle className="w-4 h-4" /></Button>
        </form>
      </div>
      <div className="container-prose py-16 grid md:grid-cols-4 gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl gradient-warm grid place-items-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </span>
            <span className="font-display text-lg font-semibold text-foreground">RM Consultoria</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Educação financeira humana e prática para quem quer recomeçar — pessoas, famílias, igrejas e empresas.
          </p>
          <p className="text-xs text-muted-foreground">CNPJ • rmconsultoria.finance</p>
        </div>

        <div>
          <h4 className="font-display text-base text-foreground mb-4">Caminhos</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/cursos" className="hover:text-primary transition">Cursos online</Link></li>
            <li><Link to="/palestras" className="hover:text-primary transition">Palestras</Link></li>
            <li><Link to="/planilha-gratis" className="hover:text-primary transition">Planilha grátis</Link></li>
            <li><Link to="/quero-ajuda" className="hover:text-primary transition">Quero ser ajudado</Link></li>
            <li><Link to="/agendar" className="hover:text-primary transition">Agendar conversa</Link></li>

            <li><Link to="/diagnostico" className="hover:text-primary transition">Diagnóstico grátis</Link></li>
            <li><Link to="/blog" className="hover:text-primary transition">Conteúdo & ferramentas</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base text-foreground mb-4">Para quem</h4>
          <ul className="space-y-2.5 text-sm">
            <li>Pessoas endividadas</li>
            <li>Famílias em reconstrução</li>
            <li>Igrejas e comunidades</li>
            <li>Empresas em crise</li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base text-foreground mb-4">Fale com Marta Cury</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> contato@rmconsultoria.finance</li>
            <li>
              <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition">
                <MessageCircle className="w-4 h-4" /> (21) 98600-0039
              </a>
            </li>
            <li>
              <a href="https://www.instagram.com/marta_curyy" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition">
                <Instagram className="w-4 h-4" /> @marta_curyy
              </a>
            </li>
          </ul>
          <Link
            to="/contato"
            className="inline-block mt-5 px-5 py-2.5 rounded-full gradient-warm text-primary-foreground text-sm font-medium shadow-warm"
          >
            Agendar conversa
          </Link>
        </div>
      </div>
      <div className="border-t border-border bg-card">
        <div className="container-prose py-5 grid md:grid-cols-3 gap-4 items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>Seus dados são protegidos pela <strong className="text-foreground">LGPD (Lei nº 13.709/2018)</strong> e demais leis vigentes.</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-primary shrink-0" />
            <span>Ambiente com <strong className="text-foreground">criptografia SSL/TLS</strong> e pagamentos processados via <strong className="text-foreground">Stripe</strong>.</span>
          </div>
          <div className="flex items-center gap-2.5 md:justify-end">
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 font-medium">
              🔒 Site 100% seguro
            </span>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-prose py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} RM Consultoria — Marta Cury. Todos os direitos reservados.</span>
          <span>Feito com cuidado para quem quer recomeçar.</span>
        </div>
      </div>
    </footer>
  );
}
