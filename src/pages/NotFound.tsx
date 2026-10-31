import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

/**
 * Página 404. Se o celular ainda estiver com uma versão antiga do site guardada (cache do app),
 * uma rota nova pode não existir nela: antes de mostrar o erro, buscamos a versão nova e recarregamos uma vez.
 */
const NotFound = () => {
  const location = useLocation();
  const [tentando, setTentando] = useState(true);

  useEffect(() => {
    const chave = `rota-recarregada:${location.pathname}`;
    let jaTentou = false;
    try { jaTentou = sessionStorage.getItem(chave) === "1"; sessionStorage.setItem(chave, "1"); } catch { jaTentou = true; }
    if (jaTentou) { setTentando(false); return; }
    (async () => {
      try {
        const regs = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistrations() : [];
        await Promise.allSettled(regs.map((r) => r.unregister()));
        if ("caches" in window) {
          const nomes = await caches.keys();
          await Promise.allSettled(nomes.map((n) => caches.delete(n)));
        }
      } finally {
        window.location.reload();
      }
    })();
  }, [location.pathname]);

  if (tentando) return <div className="min-h-screen bg-muted" />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Página não encontrada</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          Voltar para o início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
