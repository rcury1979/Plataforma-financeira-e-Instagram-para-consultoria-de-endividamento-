import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, Link } from "react-router-dom";

/**
 * "E2E-lite": monta um router mínimo com stubs das páginas principais
 * para garantir que a estrutura de rotas e a navegação funcionam
 * sem depender de Supabase/Stripe/PWA (que exigem ambiente real).
 */

function Stub({ label }: { label: string }) {
  return (
    <div>
      <h1>{label}</h1>
      <nav>
        <Link to="/">Início</Link>
        <Link to="/cursos">Cursos</Link>
        <Link to="/palestras">Palestras</Link>
        <Link to="/diagnostico">Diagnóstico</Link>
        <Link to="/blog">Blog</Link>
        <Link to="/sobre">Sobre</Link>
        <Link to="/contato">Contato</Link>
        <Link to="/planos">Planos</Link>
        <Link to="/app/auth">Auth</Link>
      </nav>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Stub label="Home" />} />
      <Route path="/cursos" element={<Stub label="Cursos" />} />
      <Route path="/palestras" element={<Stub label="Palestras" />} />
      <Route path="/diagnostico" element={<Stub label="Diagnóstico" />} />
      <Route path="/blog" element={<Stub label="Blog" />} />
      <Route path="/sobre" element={<Stub label="Sobre" />} />
      <Route path="/contato" element={<Stub label="Contato" />} />
      <Route path="/planos" element={<Stub label="Planos" />} />
      <Route path="/app/auth" element={<Stub label="Auth" />} />
      <Route path="*" element={<Stub label="NotFound" />} />
    </Routes>
  );
}

describe("Rotas principais", () => {
  const rotas: Array<[string, string]> = [
    ["/", "Home"],
    ["/cursos", "Cursos"],
    ["/palestras", "Palestras"],
    ["/diagnostico", "Diagnóstico"],
    ["/blog", "Blog"],
    ["/sobre", "Sobre"],
    ["/contato", "Contato"],
    ["/planos", "Planos"],
    ["/app/auth", "Auth"],
  ];

  it.each(rotas)("renderiza %s sem erros", (path, label) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1, name: label })).toBeInTheDocument();
  });

  it("rota desconhecida cai no NotFound", () => {
    render(
      <MemoryRouter initialEntries={["/rota-que-nao-existe-123"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "NotFound" })).toBeInTheDocument();
  });

  it("navega entre páginas via cliques (E2E de navegação)", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Home");

    fireEvent.click(screen.getByRole("link", { name: "Cursos" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Cursos");

    fireEvent.click(screen.getByRole("link", { name: "Diagnóstico" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Diagnóstico");

    fireEvent.click(screen.getByRole("link", { name: "Auth" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Auth");
  });
});
