/* Formulário de lançamento: Receita, Despesa ou Transferência (criar e editar). */
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  db, Field, inputCls, selectCls, Pill, parseValor, todayISO,
  type Cartao, type Categoria, type Conta, type Lancamento,
} from "./_shared";

export type TipoLanc = "receita" | "despesa" | "transferencia";

export function LancamentoDialog({
  open, onOpenChange, tipo, editing, userId, contas, cartoes, categorias, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; tipo: TipoLanc; editing?: Lancamento | null;
  userId: string; contas: Conta[]; cartoes: Cartao[]; categorias: Categoria[]; onSaved: () => void;
}) {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(todayISO());
  const [categoriaId, setCategoriaId] = useState("");
  const [origem, setOrigem] = useState(""); // "conta:<id>" ou "cartao:<id>"
  const [destino, setDestino] = useState("");
  const [pago, setPago] = useState(true);
  const [recorrente, setRecorrente] = useState(false);
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);
  const t: TipoLanc = editing?.tipo ?? tipo;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setDescricao(editing.descricao); setValor(String(editing.valor).replace(".", ",")); setData(editing.data);
      setCategoriaId(editing.categoria_id ?? "");
      setOrigem(editing.cartao_id ? `cartao:${editing.cartao_id}` : editing.conta_id ? `conta:${editing.conta_id}` : "");
      setDestino(editing.conta_destino_id ?? ""); setPago(editing.pago); setRecorrente(editing.recorrente); setObs(editing.observacao ?? "");
    } else {
      setDescricao(""); setValor(""); setData(todayISO()); setCategoriaId("");
      setOrigem(contas[0] ? `conta:${contas[0].id}` : ""); setDestino(contas[1]?.id ?? ""); setPago(true); setRecorrente(false); setObs("");
    }
  }, [open, editing, contas]);

  const cats = categorias.filter((c) => c.tipo === (t === "receita" ? "receita" : "despesa"));
  const raizes = cats.filter((c) => !c.parent_id);
  const titulo = { receita: "Receita", despesa: "Despesa", transferencia: "Transferência" }[t];

  const salvar = async () => {
    const v = parseValor(valor);
    if (!descricao.trim() && t !== "transferencia") return toast.error("Informe uma descrição.");
    if (v <= 0) return toast.error("Informe um valor maior que zero.");
    const [kind, id] = origem.split(":");
    if (t === "transferencia" && (!id || !destino || id === destino)) return toast.error("Escolha contas de origem e destino diferentes.");
    const row = {
      user_id: userId, tipo: t, descricao: descricao.trim() || "Transferência", valor: v, data,
      categoria_id: t === "transferencia" ? null : categoriaId || null,
      conta_id: kind === "conta" ? id : null,
      cartao_id: kind === "cartao" && t === "despesa" ? id : null,
      conta_destino_id: t === "transferencia" ? destino : null,
      pago, recorrente, observacao: obs.trim() || null,
    };
    setSaving(true);
    const res = editing ? await db.from("cli_lancamentos").update(row).eq("id", editing.id) : await db.from("cli_lancamentos").insert(row);
    setSaving(false);
    if (res.error) return toast.error("Não foi possível salvar: " + res.error.message);
    toast.success(editing ? "Lançamento atualizado" : `${titulo} registrada`);
    onOpenChange(false); onSaved();
  };

  const excluir = async () => {
    if (!editing) return;
    const res = await db.from("cli_lancamentos").delete().eq("id", editing.id);
    if (res.error) return toast.error(res.error.message);
    toast.success("Lançamento excluído"); onOpenChange(false); onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-border bg-card sm:max-w-[480px]">
        <DialogHeader><DialogTitle className="font-display text-xl">{editing ? `Editar ${titulo.toLowerCase()}` : `Nova ${titulo.toLowerCase()}`}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {t !== "transferencia" && (
            <Field label="Descrição"><input className={inputCls} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder={t === "receita" ? "Ex.: Salário" : "Ex.: Mercado"} autoFocus /></Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor (R$)"><input className={inputCls} inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" /></Field>
            <Field label="Data"><input type="date" className={inputCls} value={data} onChange={(e) => setData(e.target.value)} /></Field>
          </div>
          {t !== "transferencia" && (
            <Field label="Categoria">
              <select className={selectCls} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                <option value="">Sem categoria</option>
                {raizes.map((r) => [
                  <option key={r.id} value={r.id}>{r.nome}</option>,
                  ...cats.filter((s) => s.parent_id === r.id).map((s) => <option key={s.id} value={s.id}>{"  └ " + s.nome}</option>),
                ])}
              </select>
            </Field>
          )}
          <Field label={t === "transferencia" ? "De (conta de origem)" : t === "receita" ? "Entrou em" : "Pago com"}>
            <select className={selectCls} value={origem} onChange={(e) => setOrigem(e.target.value)}>
              <option value="">Selecione</option>
              <optgroup label="Contas">{contas.map((c) => <option key={c.id} value={`conta:${c.id}`}>{c.nome}</option>)}</optgroup>
              {t === "despesa" && cartoes.length > 0 && (
                <optgroup label="Cartões de crédito">{cartoes.map((c) => <option key={c.id} value={`cartao:${c.id}`}>{c.nome}</option>)}</optgroup>
              )}
            </select>
          </Field>
          {t === "transferencia" && (
            <Field label="Para (conta de destino)">
              <select className={selectCls} value={destino} onChange={(e) => setDestino(e.target.value)}>
                <option value="">Selecione</option>
                {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Field>
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
            <label className="flex items-center gap-2 text-sm"><Switch checked={pago} onCheckedChange={setPago} /> {t === "receita" ? "Já recebi" : "Já paguei"}</label>
            {t !== "transferencia" && <label className="flex items-center gap-2 text-sm"><Switch checked={recorrente} onCheckedChange={setRecorrente} /> Todo mês</label>}
          </div>
          <Field label="Observação (opcional)"><input className={inputCls} value={obs} onChange={(e) => setObs(e.target.value)} /></Field>
          {contas.length === 0 && <p className="text-xs text-warning">Cadastre uma conta em Configurações → Contas para saber o saldo.</p>}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          {editing ? <Pill variant="ghost" onClick={excluir} className="text-destructive"><Trash2 className="h-4 w-4" /> Excluir</Pill> : <span />}
          <div className="flex gap-2">
            <Pill onClick={() => onOpenChange(false)}>Cancelar</Pill>
            <Pill variant="solid" onClick={salvar} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Pill>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
