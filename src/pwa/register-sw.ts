// Guarded PWA service worker registration.
// Never registers in dev, iframe previews, Lovable preview hosts, or when ?sw=off.

const SW_PATH = "/sw.js";

function hostnameIsPreview(hostname: string): boolean {
  return (
    hostname.startsWith("id-preview--") ||
    hostname.startsWith("preview--") ||
    hostname === "lovableproject.com" ||
    hostname.endsWith(".lovableproject.com") ||
    hostname === "lovableproject-dev.com" ||
    hostname.endsWith(".lovableproject-dev.com") ||
    hostname === "beta.lovable.dev" ||
    hostname.endsWith(".beta.lovable.dev")
  );
}

async function unregisterMatching(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          return url.endsWith(SW_PATH);
        })
        .map((r) => r.unregister()),
    );
  } catch {
    // ignore
  }
}

export function registerServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const inIframe = window.self !== window.top;
  const url = new URL(window.location.href);
  const killSwitch = url.searchParams.get("sw") === "off";
  const hostname = window.location.hostname;

  const shouldRefuse =
    !import.meta.env.PROD ||
    inIframe ||
    killSwitch ||
    hostnameIsPreview(hostname);

  if (shouldRefuse) {
    void unregisterMatching();
    return;
  }

  // Quando uma versão nova do site é publicada, o service worker novo assume e a página
  // recarrega uma vez sozinha — assim ninguém fica preso na versão antiga em cache.
  const jaTinhaControle = !!navigator.serviceWorker.controller;
  let recarregou = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!jaTinhaControle || recarregou) return;
    recarregou = true;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(SW_PATH, { scope: "/", updateViaCache: "none" })
      .then((reg) => {
        void reg.update();
        // confere de novo a cada 30 minutos para quem deixa o app aberto
        window.setInterval(() => void reg.update(), 30 * 60 * 1000);
      })
      .catch(() => {
        // silent
      });
  });
}
