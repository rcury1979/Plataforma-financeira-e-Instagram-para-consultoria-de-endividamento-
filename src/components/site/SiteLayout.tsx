import { useEffect } from "react";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import WhatsAppButton from "./WhatsAppButton";
import ChatAssistente from "./ChatAssistente";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (document.querySelector("link[data-public-fonts]")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.dataset.publicFonts = "true";
    link.href = "https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600&family=Manrope:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
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
