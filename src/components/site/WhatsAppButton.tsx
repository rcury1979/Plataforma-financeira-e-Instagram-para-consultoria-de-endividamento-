import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export default function WhatsAppButton() {
  const href = buildWhatsAppLink();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-6 right-6 z-50 group flex items-center gap-3"
    >
      <span className="hidden sm:flex items-center px-4 py-2 rounded-full bg-card text-foreground text-sm font-medium shadow-card border border-border opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
        Fale com a Marta Cury
      </span>
      <span className="whatsapp-symbol relative flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-card transition-transform hover:scale-105">
        <MessageCircle className="w-7 h-7 relative" />
      </span>
    </a>
  );
}
