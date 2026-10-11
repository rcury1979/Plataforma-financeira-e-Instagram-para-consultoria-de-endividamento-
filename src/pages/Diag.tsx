import * as React from "react";
import * as ReactDOM from "react-dom";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";

function Row({ k, v, ok }: { k: string; v: React.ReactNode; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border/60 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className={ok === undefined ? "" : ok ? "text-green-600" : "text-red-600"}>
        {typeof v === "boolean" ? (v ? "✓ presente" : "✗ ausente") : v}
      </span>
    </div>
  );
}

function QueryClientProbe() {
  try {
    const qc = useQueryClient();
    return <Row k="QueryClientProvider" v={!!qc} ok={!!qc} />;
  } catch (e: any) {
    return <Row k="QueryClientProvider" v={`erro: ${e?.message ?? e}`} ok={false} />;
  }
}

export default function Diag() {
  const [state, setState] = React.useState(0);
  const reactOk = !!React && typeof React.useState === "function";
  const domOk = !!ReactDOM;
  const env = (import.meta as any).env ?? {};
  const hasSupabaseUrl = !!env.VITE_SUPABASE_URL;
  const hasSupabaseKey = !!env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const hasStripe = !!env.VITE_PAYMENTS_CLIENT_TOKEN;

  const nav = typeof navigator !== "undefined" ? navigator : ({} as Navigator);
  const swSupported = typeof navigator !== "undefined" && "serviceWorker" in navigator;
  const [swRegs, setSwRegs] = React.useState<number | null>(null);
  const [supaOk, setSupaOk] = React.useState<string>("verificando...");

  React.useEffect(() => {
    if (swSupported) {
      navigator.serviceWorker.getRegistrations().then((r) => setSwRegs(r.length)).catch(() => setSwRegs(-1));
    }
    (async () => {
      try {
        const mod = await import("@/integrations/supabase/client");
        const { data, error } = await mod.supabase.auth.getSession();
        setSupaOk(error ? `erro: ${error.message}` : `ok (sessão: ${data.session ? "sim" : "não"})`);
      } catch (e: any) {
        setSupaOk(`falha import: ${e?.message ?? e}`);
      }
    })();
  }, [swSupported]);

  // Nested QueryClient just so the probe has a provider even if App context is broken
  const [qc] = React.useState(() => new QueryClient());

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Diagnóstico do App</h1>
          <p className="text-sm text-muted-foreground">
            Rota isolada — não usa SiteLayout nem provedores globais. Use para diagnosticar falhas de hooks/duplicação de React.
          </p>
        </header>

        <section className="rounded-xl border border-border p-4 bg-card">
          <h2 className="font-medium mb-2">Runtime</h2>
          <Row k="React carregado" v={reactOk} ok={reactOk} />
          <Row k="React.version" v={(React as any).version ?? "?"} />
          <Row k="ReactDOM carregado" v={domOk} ok={domOk} />
          <Row k="useState funcional" v={state === 0 ? "sim" : "sim"} ok={true} />
          <Row k="Modo" v={env.MODE ?? "?"} />
          <Row k="Base URL" v={env.BASE_URL ?? "/"} />
          <Row k="DEV" v={String(!!env.DEV)} />
        </section>

        <section className="rounded-xl border border-border p-4 bg-card">
          <h2 className="font-medium mb-2">Variáveis de ambiente</h2>
          <Row k="VITE_SUPABASE_URL" v={hasSupabaseUrl} ok={hasSupabaseUrl} />
          <Row k="VITE_SUPABASE_PUBLISHABLE_KEY" v={hasSupabaseKey} ok={hasSupabaseKey} />
          <Row k="VITE_PAYMENTS_CLIENT_TOKEN" v={hasStripe} ok={hasStripe} />
        </section>

        <section className="rounded-xl border border-border p-4 bg-card">
          <h2 className="font-medium mb-2">Backend</h2>
          <Row k="Supabase client" v={supaOk} ok={supaOk.startsWith("ok")} />
        </section>

        <QueryClientProvider client={qc}>
          <section className="rounded-xl border border-border p-4 bg-card">
            <h2 className="font-medium mb-2">Provedores</h2>
            <QueryClientProbe />
          </section>
        </QueryClientProvider>

        <section className="rounded-xl border border-border p-4 bg-card">
          <h2 className="font-medium mb-2">PWA / Navegador</h2>
          <Row k="ServiceWorker suportado" v={swSupported} ok={swSupported} />
          <Row k="Registros SW" v={swRegs === null ? "..." : String(swRegs)} />
          <Row k="Online" v={String(nav.onLine ?? "?")} />
          <Row k="User agent" v={<span className="truncate max-w-[60%] text-right">{nav.userAgent ?? "?"}</span>} />
        </section>

        <section className="rounded-xl border border-border p-4 bg-card">
          <h2 className="font-medium mb-2">Ações</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setState((s) => s + 1)}
              className="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-secondary"
            >
              Testar re-render ({state})
            </button>
            <button
              onClick={async () => {
                if (!swSupported) return;
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map((r) => r.unregister()));
                if ("caches" in window) {
                  const keys = await caches.keys();
                  await Promise.all(keys.map((k) => caches.delete(k)));
                }
                location.reload();
              }}
              className="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-secondary"
            >
              Limpar SW + caches e recarregar
            </button>
            <button
              onClick={() => { localStorage.clear(); sessionStorage.clear(); location.reload(); }}
              className="px-3 py-1.5 rounded-md border border-border text-sm hover:bg-secondary"
            >
              Limpar storage
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
