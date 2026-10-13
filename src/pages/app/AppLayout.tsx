import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { temAcessoApp } from "@/lib/acesso";
import { ArrowLeft, Wallet, Users, CheckSquare, Menu, LogOut, Bell, WifiOff, Sun, Moon, Sparkles, Share, Plus, X, Download, PiggyBank, Target, TrendingDown, TrendingUp, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnline } from "@/pwa/offline";
import type { Session } from "@supabase/supabase-js";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function useAndroidInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("aurea:android-install-dismissed")) return;
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (standalone) { setInstalled(true); return; }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "dismissed") {
      localStorage.setItem("aurea:android-install-dismissed", String(Date.now()));
    }
    setDeferred(null);
  };
  const dismiss = () => {
    localStorage.setItem("aurea:android-install-dismissed", String(Date.now()));
    setDeferred(null);
  };
  return { available: !!deferred && !installed, install, dismiss };
}

const navItemsPJ = [
  { to: "/app", label: "Financeiro", icon: Wallet, end: true },
  { to: "/app/clientes", label: "Clientes", icon: Users },
  { to: "/app/crm", label: "Funil", icon: Users },
  { to: "/app/tarefas", label: "Tarefas", icon: CheckSquare },
  { to: "/app/mais", label: "Mais", icon: Menu },
];

const navItemsPF = [
  { to: "/app/pf", label: "Painel", icon: PiggyBank, end: true },
  { to: "/app/pf/transacoes", label: "Lançar", icon: Wallet },
  { to: "/app/pf/limites", label: "Limites", icon: Gauge },
  { to: "/app/mais", label: "Mais", icon: Menu },
];



function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof localStorage === "undefined") return "dark";
    return (localStorage.getItem("aurea:theme") as any) || "dark";
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("aurea:theme", theme);
  }, [theme]);
  return { theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) };
}

function useIosInstallPrompt() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const dismissed = localStorage.getItem("aurea:ios-install-dismissed");
    if (dismissed) return;
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isStandalone = (window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    if (isIos && !isStandalone) {
      const t = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);
  const dismiss = (persist = true) => {
    if (persist) localStorage.setItem("aurea:ios-install-dismissed", "1");
    setShow(false);
  };
  return { show, dismiss };
}

export default function AppLayout() {
  const navigate = useNavigate();
  const online = useOnline();
  const { theme, toggle } = useTheme();
  const ios = useIosInstallPrompt();
  const android = useAndroidInstallPrompt();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [trialLeft, setTrialLeft] = useState<number | null>(null);
  const [plano, setPlano] = useState<string>("trial");
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ">("PJ");
  const navItems = tipoPessoa === "PF" ? navItemsPF : navItemsPJ;
  const location = useLocation();
  const currentPath = location.pathname.replace(/\/+$/, "") || "/app";
  // Seta de voltar: aparece em toda tela que não está na barra de navegação de baixo.
  const showBack = currentPath !== "/app" && !navItems.some((item) => item.to === currentPath);
  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate("/app/mais");
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setReady(true);
      if (!session) { navigate("/app/auth", { replace: true }); return; }
      const role = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
      setIsAdmin(role.data === true);
      // Educadora (admin) começa pela Área da Educadora; as telas antigas de /app continuam acessíveis.
      if (role.data === true && window.location.hash.replace(/^#/, "").replace(/\/+$/, "") === "/app" || role.data === true && window.location.pathname.replace(/\/+$/, "") === "/app") { navigate("/educador", { replace: true }); return; }
      const { data: prof } = await (supabase as any)
        .from("profiles")
        .select("plano,trial_ends_at,tipo_pessoa")
        .eq("user_id", session.user.id)
        .maybeSingle();
      const p = prof?.plano ?? "trial";
      setPlano(p);
      setTipoPessoa((prof?.tipo_pessoa as "PF" | "PJ") ?? "PJ");
      // Cliente Pessoa Física usa a nova Área do Cliente.
      if (prof?.tipo_pessoa === "PF" && role.data !== true) { navigate("/cliente", { replace: true }); return; }
      // Sem assinatura, mentoria ou cortesia: vai para os planos.
      if (role.data !== true && !(await temAcessoApp())) { navigate("/planos?acesso=1", { replace: true }); return; }
      if (p === "trial" && prof?.trial_ends_at) {
        const ms = new Date(prof.trial_ends_at).getTime() - Date.now();
        setTrialLeft(Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24))));
      } else {
        setTrialLeft(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/app/auth", { replace: true });
  };

  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Trial banner — para automaticamente quando trial_ends_at expira */}
      {plano === "trial" && trialLeft !== null && trialLeft > 0 && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="mx-auto max-w-2xl px-4 py-2 flex items-center justify-center gap-2 text-[13px]">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">
              Avaliação gratuita, <span className="text-foreground font-medium">{trialLeft} {trialLeft === 1 ? "dia restante" : "dias restantes"}</span>.
            </span>
            <NavLink to="/app/mais" className="text-primary font-medium hover:underline">
              Assinar um plano
            </NavLink>
          </div>
        </div>
      )}
      {plano === "trial" && trialLeft === 0 && (
        <div className="bg-destructive/10 border-b border-destructive/30">
          <div className="mx-auto max-w-2xl px-4 py-2 flex items-center justify-center gap-2 text-[13px]">
            <span className="text-destructive font-medium">Sua avaliação gratuita terminou.</span>
            <NavLink to="/app/mais" className="text-primary font-medium hover:underline">Assinar agora</NavLink>
          </div>
        </div>
      )}

      {/* Android/Chrome install banner */}
      {android.available && (
        <div className="bg-secondary border-b">
          <div className="mx-auto max-w-2xl px-4 py-2 flex items-center gap-2 text-[13px]">
            <Download className="h-3.5 w-3.5 text-primary" />
            <span className="flex-1 text-muted-foreground">Instale o R&amp;M 360° no seu celular para acesso rápido.</span>
            <Button size="sm" className="h-7 px-3" onClick={android.install}>Instalar app</Button>
            <button onClick={android.dismiss} aria-label="Dispensar" className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-1 min-w-0">
          {showBack && (
            <Button variant="ghost" size="icon" className="h-9 w-9 -ml-2 shrink-0" onClick={goBack} aria-label="Voltar" title="Voltar">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <NavLink to="/app" className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="absolute inset-0 h-full w-full">
                <circle cx="18" cy="18" r="16" fill="none" stroke="hsl(var(--primary) / 0.35)" strokeWidth="0.8" strokeDasharray="1.5 2.2" />
                <circle cx="18" cy="18" r="12" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" />
              </svg>
              <span className="sr-only">R&amp;M 360°</span>
              <span aria-hidden className="relative font-serif italic text-[11px] leading-none text-primary tracking-tight" style={{ transform: "translateY(-1px)" }}>R&amp;M</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-serif text-[19px] tracking-tight text-foreground">R&amp;M <span className="text-primary">360°</span></span>
              <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground mt-0.5">RM Consultoria</span>
            </div>
          </NavLink>
          </div>
          <div className="flex items-center gap-0.5">
            {isAdmin && <Button asChild variant="ghost" size="icon" title="Assistente R&M"><NavLink to="/app/admin/assistente" aria-label="Abrir assistente administrativa"><Users className="h-[18px] w-[18px]" /></NavLink></Button>}
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Notificações">
              <Bell className="h-[18px] w-[18px]" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggle} aria-label="Alternar tema">
              {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleLogout} aria-label="Sair">
              <LogOut className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </div>
      </header>

      {!online && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-700 dark:text-amber-300">
          <div className="mx-auto max-w-2xl px-4 py-2 flex items-center gap-2 text-xs">
            <WifiOff className="h-3.5 w-3.5" />
            <span>Modo offline — exibindo os últimos dados salvos. Alterações ficam indisponíveis até reconectar.</span>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 pb-28 pt-4">
        <NavLink to="/app/brindes" className="mb-5 flex items-center justify-between gap-3 border-b border-border pb-3 text-sm text-primary"><span>Seus dois e-books de presente</span><Download className="h-4 w-4 shrink-0" /></NavLink>
        <Outlet />
      </main>

      {/* Bottom nav — pill flutuante */}
      <nav className="fixed bottom-3 inset-x-0 z-30 px-4 pointer-events-none">
        <div className="pointer-events-auto mx-auto max-w-md rounded-full border border-primary/25 bg-card/95 backdrop-blur shadow-[0_10px_30px_-12px_hsl(0_0%_0%/0.55)] px-1.5 py-1.5 grid grid-cols-4 gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center justify-center gap-1.5 rounded-full py-2 text-[11px] font-medium transition ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-[15px] w-[15px]" />
                  <span className={isActive ? "inline" : "hidden sm:inline"}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* iOS install prompt */}
      {ios.show && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-card rounded-2xl p-5 shadow-2xl border">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Instale no iPhone</h3>
              </div>
              <button onClick={() => ios.dismiss(false)} aria-label="Fechar">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pra receber notificações, o iPhone precisa do app na tela de início.
            </p>
            <ol className="mt-4 space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold shrink-0">1</span>
                <div>
                  Toque em <strong>Compartilhar</strong> <Share className="inline h-3.5 w-3.5" />
                  <div className="text-xs text-muted-foreground">O ícone fica na barra de baixo do Safari.</div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold shrink-0">2</span>
                <div>
                  Toque em <strong>Adicionar à Tela de Início</strong> <Plus className="inline h-3.5 w-3.5" />
                  <div className="text-xs text-muted-foreground">Pode aparecer depois de rolar pra baixo no menu.</div>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold shrink-0">3</span>
                <div>
                  Abra o <strong>R&amp;M 360°</strong> pelo ícone novo
                  <div className="text-xs text-muted-foreground">A permissão de notificação é pedida automaticamente.</div>
                </div>
              </li>
            </ol>
            <div className="mt-5 space-y-2">
              <Button className="w-full" onClick={() => ios.dismiss(true)}>Entendi</Button>
              <button onClick={() => ios.dismiss(true)} className="w-full text-xs text-muted-foreground hover:text-foreground py-2">
                Não quero notificações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
