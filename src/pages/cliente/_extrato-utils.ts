/* Utilitários de lançamentos usados por Dashboard, Extrato, Limites e Análises. */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { db, rangeAnoMes, type AnoMes, type Categoria, type Lancamento } from "./_shared";

/** Carrega todos os lançamentos do cliente (volume pequeno; filtramos no navegador). */
export function useLancamentos(userId: string | null) {
  const [lancs, setLancs] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await db.from("cli_lancamentos").select("*").eq("user_id", userId).order("data", { ascending: false });
    if (error) toast.error("Não foi possível carregar os lançamentos.");
    setLancs((data ?? []).map((l: Lancamento) => ({ ...l, valor: Number(l.valor || 0) })));
    setLoading(false);
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  /** Alterna pago/pendente com atualização otimista. */
  const togglePago = async (l: Lancamento) => {
    const novo = !l.pago;
    setLancs((xs) => xs.map((x) => (x.id === l.id ? { ...x, pago: novo } : x)));
    const { error } = await db.from("cli_lancamentos").update({ pago: novo }).eq("id", l.id);
    if (error) {
      setLancs((xs) => xs.map((x) => (x.id === l.id ? { ...x, pago: !novo } : x)));
      return toast.error("Não foi possível atualizar.");
    }
    toast.success(novo ? (l.tipo === "receita" ? "Marcado como recebido" : "Marcado como pago") : "Marcado como pendente");
  };
  return { lancs, setLancs, loading, reload: load, togglePago };
}

export const doMes = (lancs: Lancamento[], mes: AnoMes) => {
  const { inicio, fim } = rangeAnoMes(mes);
  return lancs.filter((l) => l.data >= inicio && l.data <= fim);
};

export const soma = (xs: Lancamento[]) => xs.reduce((s, l) => s + Number(l.valor || 0), 0);

/** Categoria raiz (mãe) de uma categoria. */
export function raizDe(catId: string | null, catById: Map<string, Categoria>): Categoria | null {
  let c = catId ? catById.get(catId) ?? null : null;
  let guard = 0;
  while (c?.parent_id && guard++ < 5) c = catById.get(c.parent_id) ?? c;
  return c;
}

/** Gasto (despesas) de uma categoria no conjunto, incluindo subcategorias. */
export function gastoCategoria(cat: Categoria, despesas: Lancamento[], categorias: Categoria[]) {
  const ids = new Set([cat.id, ...categorias.filter((c) => c.parent_id === cat.id).map((c) => c.id)]);
  return soma(despesas.filter((l) => l.categoria_id && ids.has(l.categoria_id)));
}

export type Limite = { id: string; categoria_id: string; valor: number };

export const pct = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`;
export const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

export const TIPO_CONTA: Record<string, string> = {
  corrente: "Conta corrente", poupanca: "Poupança", investimento: "Investimento", carteira: "Carteira", dinheiro: "Dinheiro",
};
