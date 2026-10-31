import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import WhatsAppButton from "./WhatsAppButton";
import ChatAssistente from "./ChatAssistente";

const TITULOS: Record<string, string> = {
  "/": "R&M Consultoria Financeira | Marta Cury",
  "/cursos": "Cursos",
  "/palestras": "Palestras",
  "/treinamento": "Treinamento: Minha história",
  "/ebooks": "E-books grátis",
  "/sorteio": "Sorteio ao vivo",
  "/planilha-gratis": "Planilha grátis",
  "/diagnostico": "Diagnóstico financeiro grátis",
  "/blog": "Conteúdo",
  "/sobre": "Sobre Marta Cury",
  "/contato": "Contato",
  "/agendar": "Agendar conversa",
  "/quero-ajuda": "Quero ajuda",
  "/como-instalar": "Como instalar o app",
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (document.querySelector("link[data-public-fonts]")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.dataset.publicFonts = "true";
    link.href = "https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=Manrope:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
  const { pathname } = useLocation();
  useEffect(() => {
    const t = TITULOS[pathname];
    if (t) document.title = pathname === "/" ? t : `${t} | R&M Consultoria`;
  }, [pathname]);
  return (
    <div className="public-site min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <WhatsAppButton />
      <ChatAssistente />
    </div>
  );
}
