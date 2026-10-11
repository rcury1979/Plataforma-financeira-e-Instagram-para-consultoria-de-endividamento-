/* Patrimônio: bens e investimentos com fotos mensais e evolução ao longo do tempo. */
import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, ShieldCheck, Home, Car, PiggyBank, Landmark, Folder } from "lucide-react";
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
import { carregarSnapshots, salvarSnapshot, apagarSnapshots, vigente, ultimosMeses, aPartirDoPrimeiro, type Snapshot } from "./_snapshots";
import { EvolucaoChart, COR } from "./_snapshots-chart";

type Bem = { id: string; nome: string; tipo: string; observacao: string | null; liquido: boolean; vendido: boolean };

const TIPOS: Record<string, { label: string; icon: typeof Home }> = {
  imovel: { label: "Imóvel", icon: Home },
  veiculo: { label: "Veículo", icon: Car },
  investimento: { label: "Investimento", icon: PiggyBank },
  conta: { label: "Conta", icon: Landmark },
  outro: { label: "Outro", icon: Folder },
};

export default function Patrimonio() {
  const userId = useUserId();
  const { mes } = useMes();
  const [bens, setBens] = useState<Bem[]>([]);
  const [snaps, setSnaps] = useState<Map<string, Snapshot[]>>(new Map());
  const [dividaIds, setDividaIds] = useState<string[]>([]);
  const [snapsDiv, setSnapsDiv] = useState<Map<string, Snapshot[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Bem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    const [{ data }, map, { data: divs }, mapDiv] = await Promise.all([
      db.from("cli_patrimonio").select("*").eq("user_id", userId).order("created_at"),
      carregarSnapshots(userId, "patrimonio"),
      db.from("cli_dividas").select("id, quitada").eq("user_id", userId),
      carregarSnapshots(userId, "divida"),
    ]);
    setBens(((data ?? []) as Bem[]).filter((b) => !b.vendido));
    setSnaps(map);
    setDividaIds(((divs ?? []) as { id: string; quitada: boolean }[]).filter((d) => !d.quitada).map((d) => d.id));
    setSnapsDiv(mapDiv);
    setLoading(false);
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  const valorDe = (id: string, m = mes) => Number(vigente(snaps, id, m)?.valor ?? 0);
  const total = bens.reduce((s, b) => s + valorDe(b.id), 0);
  const liquidez = bens.filter((b) => b.liquido).reduce((s, b) => s + valorDe(b.id), 0);
  const dividas = dividaIds.reduce((s, id) => s + Number(vigente(snapsDiv, id, mes)?.valor ?? 0), 0);
  const liquido = total - dividas;

  const serie = aPartirDoPrimeiro(ultimosMeses(mes, 6), snaps, bens.map((b) => b.id)).map((m) => ({ label: labelAnoMesCurto(m), valor: bens.reduce((s, b) => s + valorDe(b.id, m), 0) }));
  const novo = () => { setEditing(null); setDialogOpen(true); };

  return (
    <div>
      <PageHeader
        title="Patrimônio"
        desc={<>Seus bens e investimentos com fotos mensais para acompanhar a evolução do patrimônio ao longo do tempo.<br />Atualize os valores uma vez por mês: cada mês começa com os valores do mês anterior.</>}
        right={<MonthPicker />}
      />

      <Panel className="py-6 text-center">
        <p className="text-xs text-muted-foreground">Total do patrimônio</p>
        <p className="mt-1 font-display text-3xl tabular-nums text-foreground">{brl(total)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{bens.length} {bens.length === 1 ? "ativo cadastrado" : "ativos cadastrados"}</p>
      </Panel>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Mini label="Patrimônio líquido" hint="Patrimônio − saldo das dívidas" valor={brl(liquido)} tone={liquido < 0 ? "text-destructive" : "text-foreground"} />
        <Mini label="Saldo das dívidas" hint="Vigente neste mês" valor={brl(dividas)} tone={dividas > 0 ? "text-destructive" : "text-foreground"} />
        <Mini label="Com liquidez" hint="Dá para resgatar rápido" valor={brl(liquidez)} tone="text-foreground" />
      </div>

      <div className="mt-3 flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold-soft px-5 py-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <p className="text-sm text-foreground">
          <span className="font-semibold text-gold">Pilares Proteger e Multiplicar · </span>
          primeiro proteja (reserva de emergência com liquidez e seguros); depois faça o patrimônio crescer com aportes regulares, mês após mês.
        </p>
      </div>

      <div className="mb-3 mt-6 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-foreground">Bens e investimentos</h2>
        <Pill variant="solid" onClick={novo}><Plus className="h-4 w-4" /> Novo bem</Pill>
      </div>

      {loading ? null : bens.length === 0 ? (
        <EmptyState title="Nenhum bem cadastrado" desc="Cadastre imóveis, veículos, investimentos e contas para ver seu patrimônio crescer." action={<Pill variant="solid" onClick={novo}><Plus className="h-4 w-4" /> Novo bem</Pill>} />
      ) : (
        <div className="space-y-3">
          {bens.map((b) => {
            const T = TIPOS[b.tipo] ?? TIPOS.outro;
            return (
              <Panel key={b.id} className="!p-4 sm:!p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-primary"><T.icon className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{b.nome}</p>
                      <p className="text-xs text-muted-foreground">{T.label}{b.liquido ? " · com liquidez" : ""}</p>
                      {b.observacao && <p className="mt-1 text-xs italic text-muted-foreground">{b.observacao}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="font-semibold tabular-nums text-foreground">{brl(valorDe(b.id))}</span>
                    <button type="button" onClick={() => { setEditing(b); setDialogOpen(true); }} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Editar bem">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      <div className="mt-5">
        <EvolucaoChart id="patrimonio" titulo="Evolução do patrimônio" data={serie} linha={COR.azul} preenchimento={COR.dourado} />
      </div>

      {userId && (
        <BemDialog open={dialogOpen} onOpenChange={setDialogOpen} bem={editing} userId={userId} mes={mes}
          snap={editing ? vigente(snaps, editing.id, mes) : null} onSaved={load} />
      )}
    </div>
  );
}

function Mini({ label, hint, valor, tone }: { label: string; hint: string; valor: string; tone: string }) {
  return (
    <Panel className="!p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold tabular-nums ${tone}`}>{valor}</p>
      <p className="text-[11px] text-muted-foreground/80">{hint}</p>
    </Panel>
  );
}

function BemDialog({
  open, onOpenChange, bem, userId, mes, snap, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; bem: Bem | null; userId: string; mes: string; snap: Snapshot | null; onSaved: () => void;
}) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("imovel");
  const [obs, setObs] = useState("");
  const [liq, setLiq] = useState(false);
  const [valor, setValor] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNome(bem?.nome ?? ""); setTipo(bem?.tipo ?? "imovel"); setObs(bem?.observacao ?? ""); setLiq(!!bem?.liquido);
    setValor(snap ? String(snap.valor).replace(".", ",") : "");
  }, [open, bem, snap]);

  const salvar = async () => {
    if (!nome.trim()) return toast.error("Dê um nome para o bem.");
    setSaving(true);
    const row = { nome: nome.trim(), tipo, observacao: obs.trim() || null, liquido: liq };
    let id = bem?.id;
    if (id) {
      const { error } = await db.from("cli_patrimonio").update(row).eq("id", id);
      if (error) { setSaving(false); return toast.error("Não foi possível salvar."); }
    } else {
      const { data, error } = await db.from("cli_patrimonio").insert({ ...row, user_id: userId }).select().single();
      if (error || !data) { setSaving(false); return toast.error("Não foi possível cadastrar o bem."); }
      id = data.id;
    }
    await salvarSnapshot(userId, "patrimonio", id!, mes, { valor: parseValor(valor) });
    setSaving(false);
    toast.success("Bem salvo.");
    onOpenChange(false); onSaved();
  };

  const excluir = async () => {
    if (!bem) return;
    await apagarSnapshots(userId, "patrimonio", bem.id);
    await db.from("cli_patrimonio").delete().eq("id", bem.id);
    toast.success("Bem excluído.");
    setConfirmDel(false); onOpenChange(false); onSaved();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-lg">
          <DialogHeader><DialogTitle>{bem ? "Editar bem" : "Novo bem"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label="Nome"><input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Apartamento" /></Field>
            <Field label="Tipo">
              <select className={selectCls} value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
            <Field label="Observação"><input className={inputCls} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Opcional" /></Field>
            <label className="flex items-center gap-3 text-sm text-foreground">
              <Switch checked={liq} onCheckedChange={setLiq} /> Tem liquidez (dá para resgatar rápido)
            </label>
            <div className="rounded-2xl border border-border bg-secondary/50 p-4">
              <Field label={`Valor em ${labelAnoMes(mes)} (R$)`} hint="Vale para este mês e os seguintes, até você atualizar de novo.">
                <input className={inputCls + " bg-card"} inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
              </Field>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            {bem ? (
              <Pill variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmDel(true)}><Trash2 className="h-4 w-4" /> Excluir</Pill>
            ) : <span />}
            <Pill variant="solid" onClick={salvar} disabled={saving}>Salvar</Pill>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este bem?</AlertDialogTitle>
            <AlertDialogDescription>O histórico mensal dele também será apagado.</AlertDialogDescription>
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
