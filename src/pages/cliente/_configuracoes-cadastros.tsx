/* Configurações: abas Contas, Cartões e Categorias. */
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Pencil, Plus, Trash2, Scale } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  db, brl, todayISO, saldoConta, Panel, PanelTitle, EmptyState, Pill, Field, inputCls, selectCls, parseValor,
  type Conta, type Cartao, type Categoria, type Lancamento,
} from "./_shared";
import { CatIcon, CAT_ICONS } from "./_icons";

const TIPOS_CONTA: Record<string, string> = { corrente: "Corrente", poupanca: "Poupança", investimento: "Investimento", carteira: "Carteira" };
const num = (v: number | null | undefined) => (v == null ? "" : String(v).replace(".", ","));

/* ---------- peças comuns ---------- */
export function Confirmar({ open, onOpenChange, titulo, desc, onConfirm }: {
  open: boolean; onOpenChange: (v: boolean) => void; titulo: string; desc: string; onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{desc}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
          <AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function IconBtn({ label, onClick, children, danger }: { label: string; onClick: () => void; children: ReactNode; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className={`grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary ${danger ? "hover:text-destructive" : "hover:text-foreground"}`}>
      {children}
    </button>
  );
}

function FormDialog({ open, onOpenChange, titulo, children, onSave, saving }: {
  open: boolean; onOpenChange: (v: boolean) => void; titulo: string; children: ReactNode; onSave: () => void; saving: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-md">
        <DialogHeader><DialogTitle>{titulo}</DialogTitle></DialogHeader>
        <div className="space-y-3">{children}</div>
        <div className="mt-2 flex justify-end gap-2">
          <Pill onClick={() => onOpenChange(false)}>Cancelar</Pill>
          <Pill variant="solid" onClick={onSave} disabled={saving}>Salvar</Pill>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const AddBtn = ({ onClick }: { onClick: () => void }) => (
  <Pill variant="solid" onClick={onClick}><Plus className="h-4 w-4" /> Adicionar</Pill>
);

/* ---------- Contas ---------- */
export function ContasTab({ userId, contas, reload }: { userId: string; contas: Conta[]; reload: () => void }) {
  const [lancs, setLancs] = useState<Lancamento[]>([]);
  const [form, setForm] = useState<{ open: boolean; conta: Conta | null }>({ open: false, conta: null });
  const [nome, setNome] = useState(""); const [tipo, setTipo] = useState("corrente"); const [saldoIni, setSaldoIni] = useState("");
  const [ajuste, setAjuste] = useState<Conta | null>(null); const [saldoReal, setSaldoReal] = useState("");
  const [del, setDel] = useState<Conta | null>(null);
  const [saving, setSaving] = useState(false);

  const loadLancs = useCallback(async () => {
    const { data } = await db.from("cli_lancamentos").select("*").eq("user_id", userId);
    setLancs(data ?? []);
  }, [userId]);
  useEffect(() => { loadLancs(); }, [loadLancs, contas]);

  const abrir = (c: Conta | null) => {
    setNome(c?.nome ?? ""); setTipo(c?.tipo ?? "corrente"); setSaldoIni(num(c?.saldo_inicial)); setForm({ open: true, conta: c });
  };
  const salvar = async () => {
    if (!nome.trim()) return toast.error("Informe o nome do banco.");
    setSaving(true);
    const row = { nome: nome.trim(), tipo, saldo_inicial: parseValor(saldoIni) };
    const { error } = form.conta
      ? await db.from("cli_contas").update(row).eq("id", form.conta.id)
      : await db.from("cli_contas").insert({ ...row, user_id: userId });
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar a conta.");
    toast.success("Conta salva."); setForm({ open: false, conta: null }); reload();
  };
  const ajustar = async () => {
    if (!ajuste) return;
    const real = parseValor(saldoReal);
    const diff = Math.round((real - saldoConta(ajuste, lancs)) * 100) / 100;
    if (diff === 0) { toast.info("O saldo já está certinho."); setAjuste(null); return; }
    setSaving(true);
    const { error } = await db.from("cli_lancamentos").insert({
      user_id: userId, tipo: diff > 0 ? "receita" : "despesa", descricao: "Ajuste de saldo", valor: Math.abs(diff), data: todayISO(),
      categoria_id: null, conta_id: ajuste.id, cartao_id: null, conta_destino_id: null, pago: true, recorrente: false, observacao: null, origem: "ajuste",
    });
    setSaving(false);
    if (error) return toast.error("Não foi possível ajustar o saldo.");
    toast.success(`Saldo ajustado (${diff > 0 ? "+" : "-"}${brl(Math.abs(diff))}).`);
    setAjuste(null); loadLancs(); reload();
  };
  const excluir = async () => {
    if (!del) return;
    const { error } = await db.from("cli_contas").delete().eq("id", del.id);
    if (error) toast.error("Não foi possível excluir."); else toast.success("Conta excluída.");
    setDel(null); reload();
  };

  const acoes = (c: Conta) => (
    <div className="flex justify-end">
      <IconBtn label="Ajustar saldo" onClick={() => { setSaldoReal(num(saldoConta(c, lancs))); setAjuste(c); }}><Scale className="h-4 w-4" /></IconBtn>
      <IconBtn label="Editar" onClick={() => abrir(c)}><Pencil className="h-4 w-4" /></IconBtn>
      <IconBtn label="Excluir" danger onClick={() => setDel(c)}><Trash2 className="h-4 w-4" /></IconBtn>
    </div>
  );
  const selo = (t: string) => <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-foreground">{TIPOS_CONTA[t] ?? t}</span>;

  return (
    <Panel>
      <PanelTitle right={<AddBtn onClick={() => abrir(null)} />}>Contas bancárias</PanelTitle>
      {contas.length === 0 ? <EmptyState title="Nenhuma conta cadastrada" desc="Cadastre suas contas para acompanhar o saldo de cada uma." /> : (
        <>
          <table className="hidden w-full text-sm sm:table">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-3 py-3 font-normal">Banco</th><th className="px-3 py-3 font-normal">Tipo</th>
                <th className="px-3 py-3 text-right font-normal">Saldo inicial</th><th className="px-3 py-3 text-right font-normal">Saldo atual</th><th />
              </tr>
            </thead>
            <tbody>
              {contas.map((c) => {
                const s = saldoConta(c, lancs);
                return (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-3 text-foreground">{c.nome}</td>
                    <td className="px-3 py-3">{selo(c.tipo)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{brl(c.saldo_inicial)}</td>
                    <td className={`px-3 py-3 text-right font-semibold tabular-nums ${s < 0 ? "text-destructive" : "text-foreground"}`}>{brl(s)}</td>
                    <td className="px-3 py-3">{acoes(c)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="space-y-2 sm:hidden">
            {contas.map((c) => {
              const s = saldoConta(c, lancs);
              return (
                <div key={c.id} className="rounded-2xl border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">{c.nome}</span>{selo(c.tipo)}
                  </div>
                  <div className="mt-1 flex items-end justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      Inicial: {brl(c.saldo_inicial)}<br />
                      Atual: <b className={`text-sm tabular-nums ${s < 0 ? "text-destructive" : "text-foreground"}`}>{brl(s)}</b>
                    </div>
                    {acoes(c)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <FormDialog open={form.open} onOpenChange={(v) => setForm((f) => ({ ...f, open: v }))} titulo={form.conta ? "Editar conta" : "Nova conta"} onSave={salvar} saving={saving}>
        <Field label="Banco"><input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Nubank" /></Field>
        <Field label="Tipo">
          <select className={selectCls} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {Object.entries(TIPOS_CONTA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Saldo inicial (R$)" hint="O saldo no dia em que você começou a usar a área do cliente.">
          <input className={inputCls} inputMode="decimal" value={saldoIni} onChange={(e) => setSaldoIni(e.target.value)} placeholder="0,00" />
        </Field>
      </FormDialog>

      <FormDialog open={!!ajuste} onOpenChange={(v) => !v && setAjuste(null)} titulo={`Ajustar saldo · ${ajuste?.nome ?? ""}`} onSave={ajustar} saving={saving}>
        <p className="text-sm text-muted-foreground">
          Saldo calculado hoje: <b className="text-foreground">{ajuste ? brl(saldoConta(ajuste, lancs)) : ""}</b>. Informe o saldo que aparece no app do banco e
          criamos um lançamento “Ajuste de saldo” com a diferença.
        </p>
        <Field label="Saldo real hoje (R$)"><input className={inputCls} inputMode="decimal" value={saldoReal} onChange={(e) => setSaldoReal(e.target.value)} /></Field>
      </FormDialog>

      <Confirmar open={!!del} onOpenChange={(v) => !v && setDel(null)} titulo={`Excluir a conta “${del?.nome ?? ""}”?`}
        desc="Os lançamentos dela continuam no extrato, mas ficam sem conta vinculada." onConfirm={excluir} />
    </Panel>
  );
}

/* ---------- Cartões ---------- */
export function CartoesTab({ userId, cartoes, contas, contaById, reload }: {
  userId: string; cartoes: Cartao[]; contas: Conta[]; contaById: Map<string, Conta>; reload: () => void;
}) {
  const [form, setForm] = useState<{ open: boolean; cartao: Cartao | null }>({ open: false, cartao: null });
  const [nome, setNome] = useState(""); const [limite, setLimite] = useState("");
  const [fech, setFech] = useState("1"); const [venc, setVenc] = useState("10"); const [conta, setConta] = useState("");
  const [del, setDel] = useState<Cartao | null>(null);
  const [saving, setSaving] = useState(false);

  const abrir = (c: Cartao | null) => {
    setNome(c?.nome ?? ""); setLimite(num(c?.limite)); setFech(String(c?.dia_fechamento ?? 1)); setVenc(String(c?.dia_vencimento ?? 10));
    setConta(c?.conta_pagamento_id ?? contas[0]?.id ?? ""); setForm({ open: true, cartao: c });
  };
  const salvar = async () => {
    const f = Number(fech), v = Number(venc);
    if (!nome.trim()) return toast.error("Informe o nome do cartão.");
    if (!(f >= 1 && f <= 31) || !(v >= 1 && v <= 31)) return toast.error("Os dias devem ser entre 1 e 31.");
    setSaving(true);
    const row = { nome: nome.trim(), limite: limite.trim() ? parseValor(limite) : null, dia_fechamento: f, dia_vencimento: v, conta_pagamento_id: conta || null };
    const { error } = form.cartao
      ? await db.from("cli_cartoes").update(row).eq("id", form.cartao.id)
      : await db.from("cli_cartoes").insert({ ...row, user_id: userId });
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar o cartão.");
    toast.success("Cartão salvo."); setForm({ open: false, cartao: null }); reload();
  };
  const excluir = async () => {
    if (!del) return;
    const { error } = await db.from("cli_cartoes").delete().eq("id", del.id);
    if (error) toast.error("Não foi possível excluir."); else toast.success("Cartão excluído.");
    setDel(null); reload();
  };
  const acoes = (c: Cartao) => (
    <div className="flex justify-end">
      <IconBtn label="Editar" onClick={() => abrir(c)}><Pencil className="h-4 w-4" /></IconBtn>
      <IconBtn label="Excluir" danger onClick={() => setDel(c)}><Trash2 className="h-4 w-4" /></IconBtn>
    </div>
  );
  const contaNome = (id: string | null) => (id && contaById.get(id)?.nome) || "—";

  return (
    <Panel>
      <PanelTitle right={<AddBtn onClick={() => abrir(null)} />}>Cartões</PanelTitle>
      {cartoes.length === 0 ? <EmptyState title="Nenhum cartão cadastrado" desc="Cadastre seus cartões para acompanhar as faturas." /> : (
        <>
          <table className="hidden w-full text-sm sm:table">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-muted-foreground">
                <th className="rounded-l-xl px-3 py-3 text-left font-normal">Nome</th><th className="px-3 py-3 text-right font-normal">Limite</th>
                <th className="px-3 py-3 text-center font-normal">Fechamento</th><th className="px-3 py-3 text-center font-normal">Vencimento</th>
                <th className="px-3 py-3 text-left font-normal">Conta que paga</th><th className="rounded-r-xl" />
              </tr>
            </thead>
            <tbody>
              {cartoes.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-3 text-foreground">{c.nome}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{c.limite != null ? brl(c.limite) : "—"}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">Dia {c.dia_fechamento}</td>
                  <td className="px-3 py-3 text-center text-muted-foreground">Dia {c.dia_vencimento}</td>
                  <td className="px-3 py-3 text-muted-foreground">{contaNome(c.conta_pagamento_id)}</td>
                  <td className="px-3 py-3">{acoes(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="space-y-2 sm:hidden">
            {cartoes.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{c.nome}</span>
                  <span className="text-sm font-semibold tabular-nums">{c.limite != null ? brl(c.limite) : "—"}</span>
                </div>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <p className="text-xs text-muted-foreground">Fecha dia {c.dia_fechamento} · vence dia {c.dia_vencimento}<br />Paga com: {contaNome(c.conta_pagamento_id)}</p>
                  {acoes(c)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <FormDialog open={form.open} onOpenChange={(v) => setForm((f) => ({ ...f, open: v }))} titulo={form.cartao ? "Editar cartão" : "Novo cartão"} onSave={salvar} saving={saving}>
        <Field label="Nome"><input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Nubank Roxinho" /></Field>
        <Field label="Limite (R$)"><input className={inputCls} inputMode="decimal" value={limite} onChange={(e) => setLimite(e.target.value)} placeholder="Opcional" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dia do fechamento"><input className={inputCls} inputMode="numeric" value={fech} onChange={(e) => setFech(e.target.value.replace(/\D/g, "").slice(0, 2))} /></Field>
          <Field label="Dia do vencimento"><input className={inputCls} inputMode="numeric" value={venc} onChange={(e) => setVenc(e.target.value.replace(/\D/g, "").slice(0, 2))} /></Field>
        </div>
        <Field label="Conta que paga a fatura">
          <select className={selectCls} value={conta} onChange={(e) => setConta(e.target.value)}>
            <option value="">Nenhuma</option>
            {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </Field>
      </FormDialog>

      <Confirmar open={!!del} onOpenChange={(v) => !v && setDel(null)} titulo={`Excluir o cartão “${del?.nome ?? ""}”?`}
        desc="As compras feitas nele continuam no extrato, mas ficam sem cartão vinculado." onConfirm={excluir} />
    </Panel>
  );
}

/* ---------- Categorias ---------- */
export function CategoriasTab({ userId, categorias, reload }: { userId: string; categorias: Categoria[]; reload: () => void }) {
  const [tipo, setTipo] = useState<"despesa" | "receita">("despesa");
  const [form, setForm] = useState<{ open: boolean; cat: Categoria | null; parent: Categoria | null }>({ open: false, cat: null, parent: null });
  const [nome, setNome] = useState(""); const [icone, setIcone] = useState("outros");
  const [del, setDel] = useState<Categoria | null>(null);
  const [saving, setSaving] = useState(false);

  const doTipo = categorias.filter((c) => c.tipo === tipo);
  const raizes = doTipo.filter((c) => !c.parent_id);
  const filhas = (id: string) => doTipo.filter((c) => c.parent_id === id);

  const abrir = (cat: Categoria | null, parent: Categoria | null = null) => {
    setNome(cat?.nome ?? ""); setIcone(cat?.icone ?? parent?.icone ?? "outros"); setForm({ open: true, cat, parent });
  };
  const salvar = async () => {
    if (!nome.trim()) return toast.error("Informe o nome da categoria.");
    setSaving(true);
    const { error } = form.cat
      ? await db.from("cli_categorias").update({ nome: nome.trim(), icone }).eq("id", form.cat.id)
      : await db.from("cli_categorias").insert({
        user_id: userId, nome: nome.trim(), icone, tipo, parent_id: form.parent?.id ?? null,
        ordem: Math.max(0, ...categorias.map((c) => c.ordem ?? 0)) + 1,
      });
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar a categoria.");
    toast.success(form.parent ? "Subcategoria criada." : "Categoria salva.");
    setForm({ open: false, cat: null, parent: null }); reload();
  };
  const excluir = async () => {
    if (!del) return;
    // Remove subcategorias junto (o banco real faz em cascata; garantimos aqui também).
    for (const f of filhas(del.id)) await db.from("cli_categorias").delete().eq("id", f.id);
    const { error } = await db.from("cli_categorias").delete().eq("id", del.id);
    if (error) toast.error("Não foi possível excluir."); else toast.success("Categoria excluída.");
    setDel(null); reload();
  };

  const linha = (c: Categoria, sub = false) => (
    <div key={c.id} className={`flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 ${sub ? "ml-6 sm:ml-10" : ""}`}>
      <CatIcon name={c.icone} className="h-4 w-4 shrink-0 text-primary" />
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{c.nome}</span>
      {!sub && (
        <button type="button" onClick={() => abrir(null, c)} className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">
          <Plus className="h-3.5 w-3.5" /> Sub
        </button>
      )}
      <IconBtn label="Editar" onClick={() => abrir(c)}><Pencil className="h-4 w-4" /></IconBtn>
      <IconBtn label="Excluir" danger onClick={() => setDel(c)}><Trash2 className="h-4 w-4" /></IconBtn>
    </div>
  );

  return (
    <Panel>
      <PanelTitle right={<AddBtn onClick={() => abrir(null)} />}>Categorias</PanelTitle>
      <div className="mb-4 grid grid-cols-2 rounded-full border border-border bg-secondary p-1 text-sm">
        {(["despesa", "receita"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTipo(t)}
            className={`rounded-full py-1.5 transition ${tipo === t ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "despesa" ? "Despesas" : "Receitas"}
          </button>
        ))}
      </div>
      {raizes.length === 0 ? <EmptyState title="Nenhuma categoria" desc="Crie categorias para organizar seus lançamentos." /> : (
        <div className="space-y-2">
          {raizes.map((r) => (
            <div key={r.id} className="space-y-2">
              {linha(r)}
              {filhas(r.id).map((f) => linha(f, true))}
            </div>
          ))}
        </div>
      )}

      <FormDialog open={form.open} onOpenChange={(v) => setForm((f) => ({ ...f, open: v }))} onSave={salvar} saving={saving}
        titulo={form.cat ? "Editar categoria" : form.parent ? `Nova subcategoria de ${form.parent.nome}` : `Nova categoria de ${tipo === "despesa" ? "despesa" : "receita"}`}>
        <Field label="Nome"><input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Farmácia" /></Field>
        <div>
          <span className="text-[13px] text-muted-foreground">Ícone</span>
          <div className="mt-1.5 grid grid-cols-8 gap-1.5">
            {Object.keys(CAT_ICONS).map((k) => (
              <button key={k} type="button" onClick={() => setIcone(k)} aria-label={k} title={k}
                className={`grid aspect-square place-items-center rounded-xl border transition ${icone === k ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <CatIcon name={k} />
              </button>
            ))}
          </div>
        </div>
      </FormDialog>

      <Confirmar open={!!del} onOpenChange={(v) => !v && setDel(null)} titulo={`Excluir a categoria “${del?.nome ?? ""}”?`}
        desc={del && filhas(del.id).length ? "As subcategorias dela também serão excluídas. Os lançamentos ficam sem categoria." : "Os lançamentos dela ficam sem categoria."}
        onConfirm={excluir} />
    </Panel>
  );
}
