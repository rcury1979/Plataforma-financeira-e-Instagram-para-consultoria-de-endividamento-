import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Início" },
  { to: "/cursos", label: "Cursos" },
  { to: "/palestras", label: "Palestras" },
  { to: "/planilha-gratis", label: "Planilha Grátis" },
  { to: "/diagnostico", label: "Diagnóstico Grátis" },
  { to: "/videos", label: "Vídeos" },
  { to: "/blog", label: "Conteúdo" },
  { to: "/sobre", label: "Sobre" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="public-header sticky top-0 z-50 border-b border-border">
      <div className="container-prose flex flex-wrap items-center justify-between gap-4 py-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="font-display text-2xl text-primary border border-primary px-2 py-1">R&M</span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-lg font-semibold text-foreground">RM Consultoria</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Educação & Mentoria · 360°</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center justify-between gap-1 order-3 w-full border-t border-border pt-3">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `px-2 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/75 hover:text-foreground hover:bg-secondary"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/app/auth">Entrar</Link>
          </Button>
          <Button asChild className="rounded-full gradient-warm text-primary-foreground border-0 shadow-warm hover:opacity-95">
            <Link to="/app/auth">Criar conta</Link>
          </Button>
        </div>


        <Button
          variant="ghost"
          size="icon"
          aria-expanded={open}
          aria-controls="public-mobile-menu"
          aria-label="Abrir menu"
          className="lg:hidden p-2 rounded-xl hover:bg-secondary"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {open && (
        <div id="public-mobile-menu" className="lg:hidden border-t border-border bg-background">
          <div className="container-prose py-4 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-xl text-sm font-medium ${
                    isActive ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-secondary"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Button asChild variant="outline" className="mt-2 rounded-full">
              <Link to="/app/auth" onClick={() => setOpen(false)}>Entrar</Link>
            </Button>
            <Button asChild className="rounded-full gradient-warm text-primary-foreground border-0">
              <Link to="/app/auth" onClick={() => setOpen(false)}>Criar conta</Link>
            </Button>

          </div>
        </div>
      )}
    </header>
  );
}
