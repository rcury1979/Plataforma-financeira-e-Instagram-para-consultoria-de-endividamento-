/* Dívidas: cadastro com fotos mensais (saldo, parcela, atraso) e evolução do endividamento. */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, CheckCircle2, HeartHandshake } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import {
  db, brl, useMes, useUserId, MonthPicker, PageHeader, Panel, EmptyState, Pill, Field,
  inputCls, selectCls, parseValor, labelAnoMes, labelAnoMesCurto,
} from "./_shared";
import { carregarSnapshots, salvarSnapshot, apagarSnapshots, vigente, ultimosMeses, aPartirDoPrimeiro, jurosAnual, type Snapshot } from "./_snapshots";
import { EvolucaoChart, COR } from "./_snapshots-chart";

type Divida = {
  id: string; nome: string; tipo: string; juros_mes: number | null; dia_vencimento: number | null;
  quitada: boolean; observacao: string | null;
};

const TIPOS: Record<string, string> = {
  cartao: "Cartão de crédito", emprestimo: "Empréstimo", financiamento: "Financiamento",
  cheque_especial: "Cheque especial", outro: "Outro",
};

const fmtPct = (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

export default function Dividas() {
  const userId = useUserId();
  const { mes } = useMes();
  const [dividas, setDividas] = useState<Divida[]>([]);
  const [snaps, setSnaps] = useState<Map<string, Snapshot[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [mostrarQuitadas, setMostrarQuitadas] = useState(false);
  const [jurosModo, setJurosModo] = useState<"am" | "aa">("am");
  const [estrategia, setEstrategia] = useState<"avalanche" | "bola">("avalanche");
  const [editing, setEditing] = useState<Divida | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const [{ data }, map] = await Promise.all([
      db.from("cli_dividas").select("*").eq("user_id", userId).order("created_at"),
      carregarSnapshots(userId, "divida"),
    ]);
    setDividas(data ?? []);
    setSnaps(map);
    setLoading(false);
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  const abertas = dividas.filter((d) => !d.quitada);
  const valorDe = (id: string, m = mes) => Number(vigente(snaps, id, m)?.valor ?? 0);
  const parcelaDe = (id: string, m = mes) => Number(vigente(snaps, id, m)?.parcela ?? 0);
  const atrasoDe = (id: string) => !!vigente(snaps, id, mes)?.em_atraso;

  const saldoTotal = abertas.reduce((s, d) => s + valorDe(d.id), 0);
  const parcelasTotal = abertas.reduce((s, d) => s + parcelaDe(d.id), 0);
  const emAtraso = abertas.filter((d) => atrasoDe(d.id)).length;

  // Evolução: soma vigente de todas as dívidas (quitadas recebem foto zerada ao serem quitadas).
  const meses = aPartirDoPrimeiro(ultimosMeses(mes, 6), snaps, dividas.map((d) => d.id));
  const serieSaldo = meses.map((m) => ({ label: labelAnoMesCurto(m), valor: dividas.reduce((s, d) => s + valorDe(d.id, m), 0) }));
  const serieParcela = meses.map((m) => ({ label: labelAnoMesCurto(m), valor: dividas.reduce((s, d) => s + parcelaDe(d.id, m), 0) }));

  const lista = mostrarQuitadas ? dividas : abertas;

  // Ordem sugerida de quitação (pilar Cuidar).
  const ordem = useMemo(() => {
    const base = abertas.filter((d) => valorDe(d.id) > 0);
    return [...base].sort((a, b) =>
      estrategia === "avalanche"
        ? (b.juros_mes ?? -1) - (a.juros_mes ?? -1) || valorDe(a.id) - valorDe(b.id)
        : valorDe(a.id) - valorDe(b.id),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abertas, snaps, mes, estrategia]);

  const jurosTxt = (d: Divida) => {
    if (d.juros_mes == null) return null;
    const v = Number(d.juros_mes);
    return jurosModo === "am" ? `${fmtPct(v)} a.m.` : `${fmtPct(jurosAnual(v))} a.a.`;
  };

  const novo = () => { setEditing(null); setDialogOpen(true); };

  return (
    <div>
      <PageHeader
        title="Dívidas"
        desc={<>Suas dívidas em aberto, com fotos mensais para acompanhar a redução (ou o crescimento) do endividamento.<br />Atualize os valores uma vez por mês: cada mês começa com os valores do mês anterior.</>}
        right={<MonthPicker />}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Resumo label="Saldo devedor" valor={brl(saldoTotal)} />
        <Resumo label="Parcelas/mês" valor={brl(parcelasTotal)} />
        <Resumo label="Em atraso" valor={String(emAtraso)} alerta={emAtraso > 0} />
      </div>

      <div className="my-5 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-3 text-sm text-foreground">
          <Switch checked={mostrarQuitadas} onCheckedChange={setMostrarQuitadas} />
          Mostrar dívidas quitadas
        </label>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full border border-border bg-card p-0.5 text-xs">
            {(["am", "aa"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setJurosModo(m)}
                className={`rounded-full px-3 py-1.5 font-medium transition ${jurosModo === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {m === "am" ? "% a.m." : "% a.a."}
              </button>
            ))}
          </div>
          <Pill variant="solid" onClick={novo}><Plus className="h-4 w-4" /> Nova dívida</Pill>
        </div>
      </div>

      {loading ? null : lista.length === 0 ? (
        <EmptyState
          title={dividas.length ? "Nenhuma dívida em aberto" : "Nenhuma dívida cadastrada"}
          desc={dividas.length ? "Todas as suas dívidas estão quitadas. Que conquista!" : "Cadastre suas dívidas para acompanhar, mês a mês, o caminho até quitá-las."}
          action={<Pill variant="solid" onClick={novo}><Plus className="h-4 w-4" /> Nova dívida</Pill>}
        />
      ) : (
        <div className="space-y-3">
          {lista.map((d) => {
            const juros = jurosTxt(d);
            const parcela = parcelaDe(d.id);
            const status = d.quitada ? "quitada" : atrasoDe(d.id) ? "atraso" : "dia";
            return (
              <Panel key={d.id} className={`!p-4 sm:!p-5 ${d.quitada ? "opacity-75" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{d.nome}</p>
                    <p className="text-xs text-muted-foreground">{TIPOS[d.tipo] ?? "Outro"}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <StatusSelo status={status} />
                    <button type="button" onClick={() => { setEditing(d); setDialogOpen(true); }} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Editar dívida">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted-foreground">
                  <span>Saldo: <b className="tabular-nums text-foreground">{brl(valorDe(d.id))}</b></span>
                  {juros ? <span>Juros: <b className="text-foreground">{juros}</b></span> : <span className="text-gold">Juros não informados</span>}
                  {d.dia_vencimento ? <span>Vence dia {d.dia_vencimento}</span> : null}
                  {parcela > 0 && <span>Parcela: <b className="tabular-nums text-foreground">{brl(parcela)}</b></span>}
                </div>
                {d.observacao && <p className="mt-1.5 text-xs italic text-muted-foreground">{d.observacao}</p>}
              </Panel>
            );
          })}
        </div>
      )}

      {ordem.length > 0 && (
        <div className="mt-5 rounded-2xl border border-gold/40 bg-gold-soft p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-card text-gold"><HeartHandshake className="h-4 w-4" /></span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold">Método GCPM · Pilar Cuidar</p>
                <p className="mt-0.5 text-sm text-foreground">
                  {estrategia === "avalanche"
                    ? "Avalanche: pague o mínimo em todas e coloque o dinheiro extra na dívida de maior juros. É o caminho que economiza mais."
                    : "Bola de neve: quite primeiro a de menor saldo. Cada vitória dá fôlego (e motivação) para a próxima."}
                </p>
              </div>
            </div>
            <div className="inline-flex rounded-full border border-border bg-card p-0.5 text-xs">
              {(["avalanche", "bola"] as const).map((e) => (
                <button key={e} type="button" onClick={() => setEstrategia(e)}
                  className={`rounded-full px-3 py-1.5 font-medium transition ${estrategia === e ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {e === "avalanche" ? "Maior juros" : "Menor saldo"}
                </button>
              ))}
            </div>
          </div>
          <ol className="mt-3 space-y-1.5 pl-12 text-sm">
            {ordem.map((d, i) => (
              <li key={d.id} className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold text-gold">{i + 1}º</span>
                <span className="text-foreground">{d.nome}</span>
                <span className="text-xs text-muted-foreground">
                  {brl(valorDe(d.id))}{estrategia === "avalanche" && (jurosTxt(d) ? ` · ${jurosTxt(d)}` : " · juros não informados")}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mt-5 space-y-5">
        <EvolucaoChart id="saldo" titulo="Evolução do saldo devedor" data={serieSaldo} linha={COR.vermelho} preenchimento={COR.vermelho} />
        <EvolucaoChart id="parcelas" titulo="Evolução das parcelas mensais" data={serieParcela} linha={COR.vermelho} preenchimento={COR.vermelho} />
      </div>

      {userId && (
        <DividaDialog
          open={dialogOpen} onOpenChange={setDialogOpen} divida={editing} userId={userId} mes={mes}
          snap={editing ? vigente(snaps, editing.id, mes) : null} onSaved={load}
        />
      )}
    </div>
  );
}

function Resumo({ label, valor, alerta }: { label: string; valor: string; alerta?: boolean }) {
  return (
    <Panel className="text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${alerta ? "text-destructive" : "text-foreground"}`}>{valor}</p>
    </Panel>
  );
}

function StatusSelo({ status }: { status: "dia" | "atraso" | "quitada" }) {
  const cls = {
    dia: "bg-primary/10 text-primary",
    atraso: "bg-destructive/10 text-destructive",
    quitada: "bg-success/10 text-success",
  }[status];
  const txt = { dia: "Em dia", atraso: "Em atraso", quitada: "Quitada" }[status];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>{txt}</span>;
}

function DividaDialog({
  open, onOpenChange, divida, userId, mes, snap, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; divida: Divida | null; userId: string; mes: string;
  snap: Snapshot | null; onSaved: () => void;
}) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("cartao");
  const [juros, setJuros] = useState("");
  const [dia, setDia] = useState("");
  const [obs, setObs] = useState("");
  const [saldo, setSaldo] = useState("");
  const [parcela, setParcela] = useState("");
  const [atraso, setAtraso] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNome(divida?.nome ?? ""); setTipo(divida?.tipo ?? "cartao");
    setJuros(divida?.juros_mes != null ? String(divida.juros_mes).replace(".", ",") : "");
    setDia(divida?.dia_vencimento ? String(divida.dia_vencimento) : ""); setObs(divida?.observacao ?? "");
    setSaldo(snap ? String(snap.valor).replace(".", ",") : "");
    setParcela(snap?.parcela != null ? String(snap.parcela).replace(".", ",") : "");
    setAtraso(!!snap?.em_atraso);
  }, [open, divida, snap]);

  const salvar = async (quitar = false) => {
    if (!nome.trim()) return toast.error("Dê um nome para a dívida.");
    const d = parseInt(dia, 10);
    if (dia && (!(d >= 1 && d <= 31))) return toast.error("O dia de vencimento deve ser entre 1 e 31.");
    setSaving(true);
    const row = {
      nome: nome.trim(), tipo, juros_mes: juros.trim() ? parseValor(juros) : null,
      dia_vencimento: dia ? d : null, observacao: obs.trim() || null, quitada: quitar ? true : divida?.quitada ?? false,
    };
    let id = divida?.id;
    if (id) {
      const { error } = await db.from("cli_dividas").update(row).eq("id", id);
      if (error) { setSaving(false); return toast.error("Não foi possível salvar."); }
    } else {
      const { data, error } = await db.from("cli_dividas").insert({ ...row, user_id: userId }).select().single();
      if (error || !data) { setSaving(false); return toast.error("Não foi possível criar a dívida."); }
      id = data.id;
    }
    // Foto do mês selecionado (quitar zera saldo e parcela a partir deste mês).
    await salvarSnapshot(userId, "divida", id!, mes, quitar
      ? { valor: 0, parcela: 0, em_atraso: false }
      : { valor: parseValor(saldo), parcela: parcela.trim() ? parseValor(parcela) : null, em_atraso: atraso });
    setSaving(false);
    toast.success(quitar ? "Dívida quitada. Parabéns por essa conquista!" : "Dívida salva.");
    onOpenChange(false);
    onSaved();
  };

  const reabrir = async () => {
    if (!divida) return;
    await db.from("cli_dividas").update({ quitada: false }).eq("id", divida.id);
    toast.success("Dívida reaberta.");
    onOpenChange(false); onSaved();
  };

  const excluir = async () => {
    if (!divida) return;
    await apagarSnapshots(userId, "divida", divida.id);
    await db.from("cli_dividas").delete().eq("id", divida.id);
    toast.success("Dívida excluída.");
    setConfirmDel(false); onOpenChange(false); onSaved();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <DialogHeader><DialogTitle>{divida ? "Editar dívida" : "Nova dívida"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label="Nome"><input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Cartão Black" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo">
                <select className={selectCls} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Dia de vencimento"><input className={inputCls} inputMode="numeric" value={dia} onChange={(e) => setDia(e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="Ex.: 10" /></Field>
            </div>
            <Field label="Juros (% ao mês)" hint={juros.trim() ? `Equivale a ${fmtPct(jurosAnual(parseValor(juros)))} ao ano.` : "Se não souber, deixe em branco."}>
              <input className={inputCls} inputMode="decimal" value={juros} onChange={(e) => setJuros(e.target.value)} placeholder="Ex.: 2,5" />
            </Field>
            <Field label="Observação"><input className={inputCls} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Opcional" /></Field>

            <div className="rounded-2xl border border-border bg-secondary/50 p-4">
              <p className="mb-3 text-[13px] font-medium text-foreground">Valores de {labelAnoMes(mes)}</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Saldo devedor (R$)"><input className={inputCls + " bg-card"} inputMode="decimal" value={saldo} onChange={(e) => setSaldo(e.target.value)} placeholder="0,00" /></Field>
                <Field label="Parcela (R$)"><input className={inputCls + " bg-card"} inputMode="decimal" value={parcela} onChange={(e) => setParcela(e.target.value)} placeholder="0,00" /></Field>
              </div>
              <label className="mt-3 flex items-center gap-3 text-sm text-foreground">
                <Switch checked={atraso} onCheckedChange={setAtraso} /> Em atraso neste mês
              </label>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1">
              {divida && (
                <Pill variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmDel(true)}>
                  <Trash2 className="h-4 w-4" /> Excluir
                </Pill>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {divida && (divida.quitada
                ? <Pill onClick={reabrir} disabled={saving}>Reabrir dívida</Pill>
                : <Pill onClick={() => salvar(true)} disabled={saving} className="text-success"><CheckCircle2 className="h-4 w-4" /> Marcar como quitada</Pill>)}
              <Pill variant="solid" onClick={() => salvar(false)} disabled={saving}>Salvar</Pill>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta dívida?</AlertDialogTitle>
            <AlertDialogDescription>O histórico mensal dela também será apagado. Se ela foi paga, prefira “Marcar como quitada”.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={excluir}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
