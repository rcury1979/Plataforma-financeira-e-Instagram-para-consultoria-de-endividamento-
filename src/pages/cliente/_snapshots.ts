/* Fotos mensais (cli_snapshots) usadas por Dívidas e Patrimônio.
 * O valor de um item no mês M é o último snapshot registrado até M (cada mês herda o anterior). */
import { db, shiftAnoMes, snapshotVigente, type AnoMes } from "./_shared";

export type SnapTipo = "divida" | "patrimonio";
export type Snapshot = {
  id: string; user_id: string; item_tipo: SnapTipo; item_id: string; ano_mes: AnoMes;
  valor: number; parcela: number | null; em_atraso: boolean;
};

/** Carrega todos os snapshots de um tipo e agrupa por item. */
export async function carregarSnapshots(userId: string, tipo: SnapTipo): Promise<Map<string, Snapshot[]>> {
  const { data } = await db.from("cli_snapshots").select("*").eq("user_id", userId).eq("item_tipo", tipo);
  const map = new Map<string, Snapshot[]>();
  for (const s of (data ?? []) as Snapshot[]) {
    const arr = map.get(s.item_id) ?? [];
    arr.push(s);
    map.set(s.item_id, arr);
  }
  return map;
}

/** Snapshot vigente de um item em um mês (ou null se ainda não havia valor). */
export const vigente = (map: Map<string, Snapshot[]>, itemId: string, mes: AnoMes) =>
  snapshotVigente(map.get(itemId) ?? [], mes);

/** Grava (ou atualiza) a foto do item naquele mês. */
export async function salvarSnapshot(
  userId: string, tipo: SnapTipo, itemId: string, mes: AnoMes,
  campos: { valor: number; parcela?: number | null; em_atraso?: boolean },
) {
  const { data: existente } = await db.from("cli_snapshots").select("id")
    .eq("user_id", userId).eq("item_tipo", tipo).eq("item_id", itemId).eq("ano_mes", mes).maybeSingle();
  const row = { valor: campos.valor, parcela: campos.parcela ?? null, em_atraso: !!campos.em_atraso };
  if (existente?.id) return db.from("cli_snapshots").update(row).eq("id", existente.id);
  return db.from("cli_snapshots").insert({ user_id: userId, item_tipo: tipo, item_id: itemId, ano_mes: mes, ...row });
}

/** Remove todos os snapshots de um item (ao excluir a dívida/bem). */
export const apagarSnapshots = (userId: string, tipo: SnapTipo, itemId: string) =>
  db.from("cli_snapshots").delete().eq("user_id", userId).eq("item_tipo", tipo).eq("item_id", itemId);

/** Os últimos `n` meses terminando em `mes` (inclusive), do mais antigo ao mais novo. */
export const ultimosMeses = (mes: AnoMes, n = 6): AnoMes[] =>
  Array.from({ length: n }, (_, i) => shiftAnoMes(mes, i - (n - 1)));

/** Corta os meses do início em que nenhum item tinha valor ainda (o gráfico começa no 1º registro). */
export function aPartirDoPrimeiro(meses: AnoMes[], map: Map<string, Snapshot[]>, ids: string[]): AnoMes[] {
  const i = meses.findIndex((m) => ids.some((id) => vigente(map, id, m)));
  return i < 0 ? meses.slice(-1) : meses.slice(i);
}

/** Juros: converte taxa mensal (%) em anual equivalente (%). */
export const jurosAnual = (am: number) => (Math.pow(1 + am / 100, 12) - 1) * 100;
