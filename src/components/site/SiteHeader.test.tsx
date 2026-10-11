import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SiteHeader from "./SiteHeader";

function renderHeader(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SiteHeader />
    </MemoryRouter>,
  );
}

describe("SiteHeader", () => {
  it("renderiza a marca e os links principais no desktop", () => {
    renderHeader();
    expect(screen.getByText("RM Consultoria")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /início/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /cursos/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /palestras/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /diagnóstico grátis/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /^entrar$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /criar conta/i }).length).toBeGreaterThan(0);
  });

  it("marca o link ativo com base na rota atual", () => {
    renderHeader("/cursos");
    const ativo = screen.getAllByRole("link", { name: /cursos/i })[0];
    expect(ativo.className).toMatch(/text-primary/);
  });

  it("abre e fecha o menu mobile ao clicar no botão", () => {
    renderHeader();
    const botao = screen.getByRole("button", { name: /abrir menu/i });

    // Antes do clique só há o nav desktop (1 link "Início")
    expect(screen.getAllByRole("link", { name: /início/i })).toHaveLength(1);

    fireEvent.click(botao);
    // Depois do clique o painel mobile duplica os links
    expect(screen.getAllByRole("link", { name: /início/i }).length).toBeGreaterThan(1);

    fireEvent.click(botao);
    expect(screen.getAllByRole("link", { name: /início/i })).toHaveLength(1);
  });

  it("todos os links de navegação apontam para rotas internas válidas", () => {
    renderHeader();
    const esperados = ["/", "/cursos", "/palestras", "/planilha-gratis", "/diagnostico", "/blog", "/sobre"];
    for (const href of esperados) {
      const link = document.querySelector(`a[href="${href}"]`);
      expect(link, `link ${href}`).not.toBeNull();
    }
  });
});
