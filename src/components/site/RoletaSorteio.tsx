/* Roleta do sorteio: círculo com os bonequinhos inscritos e um ponteiro no topo. */
import { useMemo } from "react";

export type Fatia = { id: string; nome: string; avatar: string };

const CORES = ["#13213c", "#caa24a", "#1f3461", "#e9cf8e", "#2b3f6e", "#f3e6c4"];
const TEXTO = ["#ffffff", "#13213c", "#ffffff", "#13213c", "#ffffff", "#13213c"];

/** Ângulo final (graus) para que a fatia `indice` pare embaixo do ponteiro, girando várias voltas a partir de `atual`. */
export function anguloAlvo(atual: number, indice: number, total: number, voltas = 6) {
  const fatia = 360 / total;
  const centro = (indice + 0.5) * fatia;
  const folga = (Math.random() - 0.5) * fatia * 0.6; // não para sempre no meio exato
  const base = ((360 - centro - folga) % 360 + 360) % 360;
  const giroAtual = ((atual % 360) + 360) % 360;
  return atual + voltas * 360 + ((base - giroAtual + 360) % 360);
}

export default function RoletaSorteio({ fatias, rotacao, girando, onFim, destaque }: {
  fatias: Fatia[]; rotacao: number; girando: boolean; onFim?: () => void; destaque?: string | null;
}) {
  const n = Math.max(fatias.length, 1);
  const R = 200;
  const mostrarNome = fatias.length <= 24;
  const mostrarAvatar = fatias.length <= 60;
  const cores = n % CORES.length === 1 && n > 1 ? CORES.slice(0, 5) : CORES; // evita duas fatias iguais lado a lado

  const caminhos = useMemo(() => fatias.map((f, i) => {
    const a0 = (i / n) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
    const grande = a1 - a0 > Math.PI ? 1 : 0;
    const d = n === 1
      ? `M 0 ${-R} A ${R} ${R} 0 1 1 -0.01 ${-R} Z`
      : `M 0 0 L ${R * Math.cos(a0)} ${R * Math.sin(a0)} A ${R} ${R} 0 ${grande} 1 ${R * Math.cos(a1)} ${R * Math.sin(a1)} Z`;
    const meio = ((i + 0.5) / n) * 360; // graus a partir do topo
    return { f, d, meio, cor: cores[i % cores.length], texto: TEXTO[CORES.indexOf(cores[i % cores.length])] };
  }), [fatias, n, cores]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      {/* Ponteiro */}
      <svg viewBox="0 0 40 46" className="absolute left-1/2 top-0 z-10 w-10 -translate-x-1/2 -translate-y-1 drop-shadow-lg" aria-hidden>
        <path d="M20 46 L4 10 A16 16 0 1 1 36 10 Z" fill="#caa24a" stroke="#13213c" strokeWidth="3" />
        <circle cx="20" cy="16" r="6" fill="#13213c" />
      </svg>
      <svg viewBox="-215 -215 430 430" className="h-full w-full" role="img" aria-label={`Roleta com ${fatias.length} participantes`}>
        <circle r="212" fill="#caa24a" />
        <g style={{ transform: `rotate(${rotacao}deg)`, transition: girando ? "transform 7s cubic-bezier(0.12, 0.75, 0.08, 1)" : "none" }}
          onTransitionEnd={() => girando && onFim?.()}>
          {fatias.length === 0 ? (
            <circle r={R} fill="#1f3461" />
          ) : caminhos.map(({ f, d, meio, cor, texto }) => (
            <g key={f.id}>
              <path d={d} fill={cor} stroke={f.id === destaque ? "#ffffff" : "#13213c"} strokeWidth={f.id === destaque ? 4 : 1} />
              {mostrarAvatar && (
                <g transform={`rotate(${meio})`}>
                  <text y={-R + 34} textAnchor="middle" fontSize={fatias.length > 30 ? 16 : 24}>{f.avatar}</text>
                  {mostrarNome && (
                    <text y={-R + 52} textAnchor="start" fill={texto} fontSize="13" fontWeight="700"
                      transform={`rotate(90 0 ${-R + 52})`} style={{ fontFamily: "system-ui, sans-serif" }}>
                      {f.nome.length > 11 ? `${f.nome.slice(0, 10)}…` : f.nome}
                    </text>
                  )}
                </g>
              )}
            </g>
          ))}
        </g>
        <circle r="44" fill="#13213c" stroke="#caa24a" strokeWidth="5" />
        <text y="8" textAnchor="middle" fill="#caa24a" fontSize="24" fontWeight="700" style={{ fontFamily: "Georgia, serif" }}>R&amp;M</text>
      </svg>
    </div>
  );
}
