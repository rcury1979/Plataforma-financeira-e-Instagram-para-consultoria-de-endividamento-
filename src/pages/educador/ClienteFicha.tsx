/* Ficha do cliente vista pela educadora: as mesmas telas da Área do Cliente, com os dados daquele cliente. */
import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { ClienteAlvoProvider, db } from "../cliente/_shared";
import { CLIENTE_NAV } from "../cliente/ClienteLayout";

type Cadastro = { id: string; nome: string; email: string | null; telefone: string | null };

export default function ClienteFicha() {
  const { clienteUserId = "" } = useParams();
  const navigate = useNavigate();
  const [cad, setCad] = useState<Cadastro | null>(null);
  const [erro, setErro] = useState(false);
  const base = `/educador/clientes/${clienteUserId}`;

  useEffect(() => {
    (async () => {
      const { data } = await db.from("clientes").select("id,nome,email,telefone").eq("cliente_user_id", clienteUserId).maybeSingle();
      if (!data) setErro(true);
      else setCad(data);
    })();
  }, [clienteUserId]);

  if (erro) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <p className="font-medium">Cliente não encontrado ou sem acesso.</p>
        <button type="button" onClick={() => navigate("/educador/clientes")} className="mt-4 text-sm font-medium text-primary underline">Voltar para Clientes</button>
      </div>
    );
  }

  const iniciais = (cad?.nome || "?").split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

  return (
    <ClienteAlvoProvider value={{ userId: clienteUserId, base, educador: true, nomeCliente: cad?.nome }}>
      <div className="-mx-4 -mt-6 mb-6 border-b border-border bg-card px-4 pb-0 pt-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:-mt-10 lg:px-10 lg:pt-6">
        <div className="mx-auto max-w-[1100px]">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate("/educador/clientes")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-secondary" aria-label="Voltar para Clientes">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-soft text-sm font-semibold text-primary">{iniciais}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.16em] text-gold">Ficha do cliente</p>
              <p className="truncate font-display text-xl text-primary">{cad?.nome ?? "Carregando…"}</p>
            </div>
            <div className="hidden items-center gap-4 text-sm text-muted-foreground md:flex">
              {cad?.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4" />{cad.email}</span>}
              {cad?.telefone && <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4" />{cad.telefone}</span>}
            </div>
          </div>
          <nav className="-mb-px mt-4 flex gap-1 overflow-x-auto pb-0 [scrollbar-width:none]" aria-label="Telas do cliente">
            {CLIENTE_NAV.map(({ to, label, end }) => {
              const dest = to === "/cliente" ? base : base + to.slice("/cliente".length);
              return (
                <NavLink
                  key={to}
                  to={dest}
                  end={end}
                  className={({ isActive }) =>
                    `shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition ${
                      isActive ? "border-gold font-semibold text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`
                  }
                >
                  {label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
      <Outlet />
    </ClienteAlvoProvider>
  );
}
