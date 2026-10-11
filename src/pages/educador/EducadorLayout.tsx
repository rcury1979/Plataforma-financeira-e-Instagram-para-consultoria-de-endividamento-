/* Layout da Área da Educadora: menu lateral (desktop) / gaveta (celular). Acesso: admin ou educador. */
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Wallet, Users, KanbanSquare, CalendarDays, ListChecks, Calculator, Megaphone, Settings,
  LogOut, Menu, X, ArrowLeft, PanelLeftClose, PanelLeftOpen, ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db, MesProvider } from "../cliente/_shared";

export const EDUCADOR_NAV = [
  { to: "/educador", label: "Início", icon: Home, end: true },
  { to: "/educador/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/educador/clientes", label: "Clientes", icon: Users },
  { to: "/educador/crm", label: "CRM", icon: KanbanSquare },
  { to: "/educador/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/educador/tarefas", label: "Tarefas", icon: ListChecks },
  { to: "/educador/simuladores", label: "Simuladores", icon: Calculator },
  { to: "/educador/novidades", label: "Novidades", icon: Megaphone },
  { to: "/educador/configuracoes", label: "Configurações", icon: Settings },
];

function Brand({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <NavLink to="/educador" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold">
        <span className="font-display text-[11px] italic leading-none text-primary">R&amp;M</span>
      </span>
      {!collapsed && (
        <span className="leading-none">
          <span className="font-display block text-[19px] text-primary">R&amp;M <span className="text-gold">360°</span></span>
          <span className="mt-0.5 block text-[9px] uppercase tracking-[0.22em] text-gold">Método GCPM</span>
        </span>
      )}
    </NavLink>
  );
}

function NavList({ collapsed = false, admin = false, onNavigate }: { collapsed?: boolean; admin?: boolean; onNavigate?: () => void }) {
  const items = admin ? [...EDUCADOR_NAV, { to: "/app/admin", label: "Admin do site", icon: ShieldCheck, end: false }] : EDUCADOR_NAV;
  return (
    <nav className="space-y-0.5">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-full px-3 py-2 text-[14px] transition ${
              isActive ? "bg-gold-soft font-semibold text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            } ${collapsed ? "justify-center px-0" : ""}`
          }
        >
          <Icon className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

export default function EducadorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [nome, setNome] = useState("");
  const [admin, setAdmin] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.body.classList.add("cliente-area");
    return () => document.body.classList.remove("cliente-area");
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate(`/app/auth?next=${encodeURIComponent(location.pathname)}`, { replace: true }); return; }
      const uid = session.user.id;
      const [isAdmin, isEdu, prof] = await Promise.all([
        supabase.rpc("has_role", { _user_id: uid, _role: "admin" }),
        db.rpc("has_role", { _user_id: uid, _role: "educador" }),
        db.from("profiles").select("full_name").eq("user_id", uid).maybeSingle(),
      ]);
      if (!alive) return;
      if (isAdmin.data !== true && isEdu.data !== true) { navigate("/app", { replace: true }); return; }
      setAdmin(isAdmin.data === true);
      setNome(prof.data?.full_name || session.user.email || "");
      setReady(true);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => setDrawer(false), [location.pathname]);

  const sair = async () => { await supabase.auth.signOut(); navigate("/app/auth", { replace: true }); };
  const path = location.pathname.replace(/\/+$/, "");
  const isHome = path === "/educador";
  // Dentro da ficha de um cliente o cabeçalho próprio da ficha cuida da navegação.
  const naFichaCliente = /^\/educador\/clientes\/[^/]+/.test(path);
  const atual = EDUCADOR_NAV.find((n) => (n.end ? path === n.to : path.startsWith(n.to)));

  if (!ready) return <div className="cliente-area min-h-screen" />;

  const userFooter = (c = false) => (
    <div className={`flex items-center gap-2 border-t border-border pt-3 ${c ? "flex-col" : ""}`}>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-soft text-xs font-semibold text-primary">
        {(nome || "?").trim().charAt(0).toUpperCase()}
      </span>
      {!c && (
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13px] text-foreground">{nome}</span>
          <span className="block text-[11px] text-muted-foreground">Educadora financeira</span>
        </span>
      )}
      <button type="button" onClick={sair} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Sair" title="Sair">
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <MesProvider>
      <div className="cliente-area min-h-screen lg:flex">
        <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card p-4 lg:flex ${collapsed ? "w-[76px]" : "w-[250px]"}`}>
          <div className={`mb-6 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
            <Brand collapsed={collapsed} />
            {!collapsed && (
              <button type="button" onClick={() => setCollapsed(true)} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary" aria-label="Recolher menu">
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
          </div>
          {collapsed ? (
            <button type="button" onClick={() => setCollapsed(false)} className="mx-auto mb-3 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary" aria-label="Abrir menu">
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          ) : (
            <p className="mb-2 px-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">Educadora financeira</p>
          )}
          <div className="-mx-1 flex-1 overflow-y-auto px-1"><NavList collapsed={collapsed} admin={admin} /></div>
          {userFooter(collapsed)}
        </aside>

        {!naFichaCliente && (
          <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/90 px-3 py-2.5 backdrop-blur lg:hidden">
            {isHome ? (
              <button type="button" onClick={() => setDrawer(true)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary" aria-label="Abrir menu"><Menu className="h-5 w-5" /></button>
            ) : (
              <button type="button" onClick={() => navigate("/educador")} className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary" aria-label="Voltar"><ArrowLeft className="h-5 w-5" /></button>
            )}
            <div className="min-w-0 flex-1">{isHome ? <Brand /> : <span className="block truncate font-medium">{atual?.label}</span>}</div>
            {!isHome && (
              <button type="button" onClick={() => setDrawer(true)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-secondary" aria-label="Abrir menu"><Menu className="h-5 w-5" /></button>
            )}
          </header>
        )}

        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            <button type="button" className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} aria-label="Fechar menu" />
            <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-[300px] flex-col bg-card p-4 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <Brand />
                <button type="button" onClick={() => setDrawer(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary" aria-label="Fechar menu"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto"><NavList admin={admin} onNavigate={() => setDrawer(false)} /></div>
              {userFooter()}
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10">
          <div className="mx-auto max-w-[1100px]">
            <Outlet context={{ abrirMenu: () => setDrawer(true) }} />
          </div>
        </main>
      </div>
    </MesProvider>
  );
}
