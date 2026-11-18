/* Botão flutuante "Falar gasto": o cliente fala (ou digita) o gasto e o app lança em despesas,
 * já na categoria certa. A frase é entendida no próprio aparelho; o cliente confere antes de salvar. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mic, Square, Sparkles } from "lucide-react";
import { interpretarGasto, normalizar } from "@/lib/gasto-por-voz";
import { CATEGORIAS_PADRAO } from "./_icons";
import { db, Field, inputCls, selectCls, Pill, parseValor, todayISO, useCadastros, brl, fmtDate } from "./_shared";

/** Avisa as telas abertas (Extrato, Dashboard…) que entrou um lançamento novo. */
export const EVENTO_LANCAMENTO = "rm:lancamento-salvo";

const getRecognition = (): any => {
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

export function GastoPorVoz({ userId }: { userId: string }) {
  const cad = useCadastros(userId);
  const [open, setOpen] = useState(false);
  const [ouvindo, setOuvindo] = useState(false);
  const [frase, setFrase] = useState("");
  const [interpretado, setInterpretado] = useState(false);
  const [tipo, setTipo] = useState<"despesa" | "receita">("despesa");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(todayISO());
  const [categoriaId, setCategoriaId] = useState("");
  const [categoriaNova, setCategoriaNova] = useState<string | null>(null);
  const [origem, setOrigem] = useState("");
  const [saving, setSaving] = useState(false);
  const recRef = useRef<any>(null);
  const suportaVoz = typeof window !== "undefined" && !!getRecognition();

  const reset = () => {
    setFrase(""); setInterpretado(false); setTipo("despesa"); setDescricao(""); setValor(""); setData(todayISO());
    setCategoriaId(""); setCategoriaNova(null); setOrigem("");
  };

  const interpretar = (texto: string) => {
    if (!texto.trim()) return;
    const g = interpretarGasto(texto, { categorias: cad.categorias, contas: cad.contas, cartoes: cad.cartoes });
    setTipo(g.tipo); setDescricao(g.descricao); setValor(g.valor ? g.valor.toFixed(2).replace(".", ",") : "");
    setData(g.data); setCategoriaId(g.categoriaId ?? ""); setCategoriaNova(g.categoriaNova); setOrigem(g.origem);
    setInterpretado(true);
  };

  const parar = () => { try { recRef.current?.stop(); } catch { /* já parado */ } setOuvindo(false); };

  const ouvir = () => {
    const Rec = getRecognition();
    if (!Rec) return toast.error("Este navegador não reconhece voz. Digite o gasto no campo abaixo.");
    const rec = new Rec();
    rec.lang = "pt-BR"; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    let final = "";
    rec.onresult = (e: any) => {
      let parcial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t + " "; else parcial += t;
      }
      setFrase((final + parcial).trim());
    };
    rec.onerror = (e: any) => {
      setOuvindo(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") toast.error("Libere o microfone para o site nas configurações do navegador.");
      else if (e.error === "no-speech") toast.message("Não ouvi nada. Toque no microfone e fale de novo.");
      else if (e.error !== "aborted") toast.error("Não consegui ouvir. Tente de novo ou digite o gasto.");
    };
    rec.onend = () => { setOuvindo(false); if (final.trim()) interpretar(final.trim()); };
    recRef.current = rec;
    setFrase(""); setInterpretado(false); setOuvindo(true);
    try { rec.start(); } catch { setOuvindo(false); }
  };

  useEffect(() => { if (!open) { parar(); reset(); } }, [open]);

  const catsTipo = cad.categorias.filter((c) => c.tipo === tipo);
  const raizes = catsTipo.filter((c) => !c.parent_id);

  const salvar = async () => {
    const v = parseValor(valor);
    if (v <= 0) return toast.error("Informe o valor.");
    if (!descricao.trim()) return toast.error("Informe uma descrição.");
    setSaving(true);
    let catId: string | null = categoriaId || null;
    if (!catId && categoriaNova) {
      // categoria ainda não existe para o cliente: cria agora
      const ja = cad.categorias.find((c) => c.tipo === tipo && normalizar(c.nome) === normalizar(categoriaNova));
      if (ja) catId = ja.id;
      else {
        const pad = CATEGORIAS_PADRAO.find((c) => c.nome === categoriaNova);
        const { data: nova, error } = await db.from("cli_categorias")
          .insert({ user_id: userId, nome: categoriaNova, tipo, icone: pad?.icone ?? "outros", ordem: cad.categorias.length })
          .select("id").single();
        if (error) { setSaving(false); return toast.error("Não foi possível criar a categoria: " + error.message); }
        catId = nova.id;
      }
    }
    const [kind, id] = origem.split(":");
    const row = {
      user_id: userId, tipo, descricao: descricao.trim(), valor: v, data, categoria_id: catId,
      conta_id: kind === "conta" ? id : null, cartao_id: kind === "cartao" && tipo === "despesa" ? id : null,
      conta_destino_id: null, pago: true, recorrente: false, observacao: frase ? `Falado: "${frase}"` : null, origem: "voz",
    };
    const { error } = await db.from("cli_lancamentos").insert(row);
    setSaving(false);
    if (error) {
      const semAcesso = /row-level security|permission|policy/i.test(error.message);
      return toast.error(semAcesso ? "Sua assinatura não permite lançar no momento. Veja em Planos." : "Não foi possível salvar: " + error.message);
    }
    const catNome = cad.categorias.find((c) => c.id === catId)?.nome ?? categoriaNova ?? "Sem categoria";
    toast.success(`${tipo === "receita" ? "Receita" : "Despesa"} de ${brl(v)} lançada em ${catNome} (${fmtDate(data)})`);
    if (categoriaNova) cad.reload();
    window.dispatchEvent(new CustomEvent(EVENTO_LANCAMENTO));
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-primary pl-4 pr-5 text-[15px] font-semibold text-primary-foreground shadow-[0_10px_30px_-8px_hsl(var(--primary)/0.7)] ring-2 ring-gold/60 transition hover:scale-[1.03] active:scale-95"
        aria-label="Falar um gasto"
      >
        <Mic className="h-5 w-5 text-gold" /> Falar gasto
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-border bg-card sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Lançar gasto falando</DialogTitle>
            <DialogDescription>
              Ex.: <i>"Gastei 45 reais no mercado no cartão Nubank"</i>, <i>"Uber 23,90 ontem"</i> ou <i>"Recebi 500 de freela"</i>.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-3 py-2">
            {suportaVoz && (
              <button
                type="button"
                onClick={ouvindo ? parar : ouvir}
                className={`grid h-20 w-20 place-items-center rounded-full text-primary-foreground transition ${ouvindo ? "animate-pulse bg-destructive" : "bg-primary hover:bg-primary/90"}`}
                aria-label={ouvindo ? "Parar de ouvir" : "Começar a ouvir"}
              >
                {ouvindo ? <Square className="h-7 w-7" /> : <Mic className="h-9 w-9 text-gold" />}
              </button>
            )}
            <p className="text-sm text-muted-foreground">
              {ouvindo ? "Ouvindo… fale o gasto" : suportaVoz ? "Toque no microfone e fale" : "Digite o gasto como você falaria"}
            </p>
            <div className="flex w-full gap-2">
              <input
                className={inputCls}
                value={frase}
                onChange={(e) => { setFrase(e.target.value); setInterpretado(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") interpretar(frase); }}
                placeholder="ou digite: mercado 120 no pix"
              />
              <Pill onClick={() => interpretar(frase)} disabled={!frase.trim()} aria-label="Entender frase"><Sparkles className="h-4 w-4" /></Pill>
            </div>
          </div>

          {interpretado && (
            <div className="space-y-3 rounded-2xl border border-gold/40 bg-gold-soft/40 p-4">
              <p className="text-[13px] font-medium text-primary">Confira e salve:</p>
              <div className="flex gap-2">
                {(["despesa", "receita"] as const).map((t) => (
                  <Pill key={t} variant={tipo === t ? "solid" : "outline"} onClick={() => { setTipo(t); setCategoriaId(""); setCategoriaNova(null); }}>
                    {t === "despesa" ? "Despesa" : "Receita"}
                  </Pill>
                ))}
              </div>
              <Field label="Descrição"><input className={inputCls} value={descricao} onChange={(e) => setDescricao(e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valor (R$)"><input className={inputCls} inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" /></Field>
                <Field label="Data"><input type="date" className={inputCls} value={data} onChange={(e) => setData(e.target.value)} /></Field>
              </div>
              <Field label="Categoria" hint={categoriaNova ? `A categoria "${categoriaNova}" será criada ao salvar.` : undefined}>
                <select
                  className={selectCls}
                  value={categoriaNova ? `nova:${categoriaNova}` : categoriaId}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v.startsWith("nova:")) { setCategoriaNova(v.slice(5)); setCategoriaId(""); }
                    else { setCategoriaId(v); setCategoriaNova(null); }
                  }}
                >
                  <option value="">Sem categoria</option>
                  {categoriaNova && <option value={`nova:${categoriaNova}`}>{categoriaNova} (nova)</option>}
                  {raizes.map((r) => [
                    <option key={r.id} value={r.id}>{r.nome}</option>,
                    ...catsTipo.filter((s) => s.parent_id === r.id).map((s) => <option key={s.id} value={s.id}>{"  └ " + s.nome}</option>),
                  ])}
                </select>
              </Field>
              <Field label={tipo === "receita" ? "Entrou em" : "Pago com"}>
                <select className={selectCls} value={origem} onChange={(e) => setOrigem(e.target.value)}>
                  <option value="">Não informado</option>
                  <optgroup label="Contas">{cad.contas.map((c) => <option key={c.id} value={`conta:${c.id}`}>{c.nome}</option>)}</optgroup>
                  {tipo === "despesa" && cad.cartoes.length > 0 && (
                    <optgroup label="Cartões de crédito">{cad.cartoes.map((c) => <option key={c.id} value={`cartao:${c.id}`}>{c.nome}</option>)}</optgroup>
                  )}
                </select>
              </Field>
              <div className="flex justify-end gap-2 pt-1">
                <Pill onClick={() => { reset(); }}>Falar de novo</Pill>
                <Pill variant="solid" onClick={salvar} disabled={saving}>{saving ? "Salvando…" : "Salvar lançamento"}</Pill>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
