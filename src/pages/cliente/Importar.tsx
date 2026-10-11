/* Importar com IA: envia fatura/extrato, a IA extrai as transações e o cliente revisa antes de salvar. */
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertTriangle, ArrowLeft, CheckCircle2, CreditCard, FileText, Landmark, Lock, Sparkles, Trash2, UploadCloud, X,
} from "lucide-react";
import {
  brl, db, EmptyState, inputCls, PageHeader, Panel, Pill, parseValor, selectCls, useCadastros, useUserId,
  type Categoria, useClienteBase } from "./_shared";

type Destino = { tipo: "cartao" | "conta"; id: string } | null;
type Linha = {
  _id: string; incluir: boolean; data: string; tipo: "receita" | "despesa"; descricao: string;
  valor: string; categoria_id: string; needs_review: boolean;
};
type Bruto = { _id?: string; data?: string; tipo?: string; descricao?: string; valor?: number | string; categoria?: string; forma_pagamento?: string; needs_review?: boolean };

const MAX = 10 * 1024 * 1024;
const ACEITOS = [".pdf", ".csv", ".ofx", ".txt"];
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const toBase64 = (f: File) =>
  new Promise<string>((ok, err) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1] ?? "");
    r.onerror = () => err(r.error);
    r.readAsDataURL(f);
  });

/** Exemplo fictício para conhecer a revisão quando a IA não está disponível. */
function exemplo(): Bruto[] {
  const d = new Date();
  const dia = (n: number) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(Math.min(n, 28)).padStart(2, "0")}`;
  return [
    { data: dia(2), tipo: "despesa", descricao: "Supermercado Bom Preço", valor: 312.45, categoria: "Mercado" },
    { data: dia(4), tipo: "despesa", descricao: "Posto Shell", valor: 180, categoria: "Transporte" },
    { data: dia(5), tipo: "receita", descricao: "Pix recebido - Ana", valor: 250, categoria: "Outras receitas" },
    { data: dia(8), tipo: "despesa", descricao: "Streaming de vídeo", valor: 39.9, categoria: "Assinaturas" },
    { data: dia(11), tipo: "despesa", descricao: "Farmácia São João", valor: 76.3, categoria: "Saúde" },
    { data: dia(14), tipo: "despesa", descricao: "PAG*LOJA XYZ 02/03", valor: 129.9, categoria: "", needs_review: true },
  ];
}

export default function Importar() {
  const base = useClienteBase();
  const userId = useUserId();
  const { contas, cartoes, categorias, contaById, cartaoById } = useCadastros(userId);
  const [destino, setDestino] = useState<Destino>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [analisando, setAnalisando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvos, setSalvos] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const catPorNome = useMemo(() => new Map(categorias.map((c) => [norm(c.nome), c])), [categorias]);
  const nomeDestino = destino ? (destino.tipo === "cartao" ? cartaoById.get(destino.id)?.nome : contaById.get(destino.id)?.nome) ?? "" : "";

  function escolherArquivo(f: File | undefined | null) {
    if (!f) return;
    const ext = "." + (f.name.split(".").pop() ?? "").toLowerCase();
    if (!ACEITOS.includes(ext)) return toast.error("Formato não aceito. Envie PDF, CSV, OFX ou TXT.");
    if (f.size > MAX) return toast.error("Arquivo maior que 10 MB.");
    setArquivo(f);
    setErro(null);
  }

  function carregar(brutos: Bruto[]) {
    setLinhas(brutos.map((b, i) => {
      const tipo = b.tipo === "receita" ? "receita" : "despesa";
      const cat = b.categoria ? catPorNome.get(norm(b.categoria)) : undefined;
      const valor = Math.abs(typeof b.valor === "number" ? b.valor : parseValor(String(b.valor ?? "0")));
      return {
        _id: b._id ?? `l${i}-${Date.now()}`, incluir: true, data: (b.data ?? "").slice(0, 10), tipo,
        descricao: b.descricao ?? "", valor: valor.toFixed(2).replace(".", ","),
        categoria_id: cat && cat.tipo === tipo ? cat.id : "",
        needs_review: !!b.needs_review || !cat || !b.data,
      };
    }));
    setErro(null);
  }

  async function analisar() {
    if (!destino || !arquivo) return;
    setAnalisando(true);
    setErro(null);
    try {
      const ext = arquivo.name.split(".").pop()?.toLowerCase();
      const body: Record<string, string> = { fileName: arquivo.name, perfil: "PF", mimeType: arquivo.type || "application/octet-stream" };
      if (ext === "pdf") body.pdfBase64 = await toBase64(arquivo);
      else body.textoBruto = await arquivo.text();
      const { data, error } = await db.functions.invoke("parse-pdf-lancamentos", { body });
      if (error) throw error;
      const lista: Bruto[] = data?.lancamentos ?? [];
      if (!lista.length) { setErro("A IA não encontrou transações nesse arquivo. Confira se é uma fatura ou extrato legível."); return; }
      carregar(lista);
    } catch {
      setErro("Não conseguimos analisar o arquivo agora. A leitura com IA pode estar indisponível neste ambiente — tente de novo mais tarde.");
    } finally {
      setAnalisando(false);
    }
  }

  const upd = (id: string, patch: Partial<Linha>) => setLinhas((ls) => ls && ls.map((l) => (l._id === id ? { ...l, ...patch } : l)));

  const selecionadas = (linhas ?? []).filter((l) => l.incluir);
  const totDesp = selecionadas.filter((l) => l.tipo === "despesa").reduce((a, l) => a + parseValor(l.valor), 0);
  const totRec = selecionadas.filter((l) => l.tipo === "receita").reduce((a, l) => a + parseValor(l.valor), 0);

  async function salvar() {
    if (!userId || !destino || !selecionadas.length) return;
    const invalida = selecionadas.find((l) => !l.descricao.trim() || !l.data || parseValor(l.valor) <= 0);
    if (invalida) return toast.error("Confira data, descrição e valor de todas as linhas marcadas.");
    setSalvando(true);
    const rows = selecionadas.map((l) => ({
      user_id: userId, tipo: l.tipo, descricao: l.descricao.trim(), valor: parseValor(l.valor), data: l.data,
      categoria_id: l.categoria_id || null,
      conta_id: destino.tipo === "conta" ? destino.id : null,
      cartao_id: destino.tipo === "cartao" ? destino.id : null,
      pago: true, recorrente: false, origem: "ia",
    }));
    const { error } = await db.from("cli_lancamentos").insert(rows);
    setSalvando(false);
    if (error) return toast.error("Não foi possível salvar os lançamentos.");
    toast.success(`${rows.length} lançamentos salvos.`);
    setSalvos(rows.length);
    setLinhas(null);
  }

  function recomecar() {
    setLinhas(null);
    setArquivo(null);
    setSalvos(null);
    setErro(null);
  }

  /* ---------- sucesso ---------- */
  if (salvos !== null) {
    return (
      <div>
        <PageHeader title="Importar com IA" desc="Envie uma fatura de cartão ou extrato bancário em PDF e a IA extrai as transações para revisão antes de salvar." />
        <Panel className="mx-auto max-w-xl text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <p className="mt-3 font-display text-xl text-foreground">Pronto! {salvos} lançamento{salvos > 1 ? "s" : ""} salvo{salvos > 1 ? "s" : ""}</p>
          <p className="mt-1 text-sm text-muted-foreground">Eles já entraram em {nomeDestino || "seu destino"} e aparecem no Extrato.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link to={`${base}/extrato`} className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">Ver no Extrato</Link>
            <Pill onClick={recomecar}>Importar outro arquivo</Pill>
          </div>
        </Panel>
      </div>
    );
  }

  /* ---------- revisão ---------- */
  if (linhas) {
    const revisar = selecionadas.filter((l) => l.needs_review).length;
    return (
      <div>
        <PageHeader
          title="Revisar lançamentos"
          desc={<>Confira o que a IA encontrou antes de salvar em <strong className="text-foreground">{nomeDestino}</strong>. Desmarque o que não quiser importar.</>}
          right={<Pill onClick={() => setLinhas(null)}><ArrowLeft className="h-4 w-4" /> Voltar</Pill>}
        />
        {revisar > 0 && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            {revisar} lançamento{revisar > 1 ? "s precisam" : " precisa"} de revisão — normalmente falta a categoria ou a descrição veio confusa.
          </div>
        )}
        {linhas.length === 0 ? (
          <EmptyState title="Nenhuma linha restante" desc="Você removeu todas as linhas." action={<Pill onClick={() => setLinhas(null)}>Voltar</Pill>} />
        ) : (
          <Panel className="p-0 sm:p-0">
            {/* cabeçalho só no desktop */}
            <div className="hidden grid-cols-[28px_140px_1fr_190px_120px_130px_36px] items-center gap-3 border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:grid">
              <input type="checkbox" aria-label="Marcar todas" checked={linhas.every((l) => l.incluir)} onChange={(e) => setLinhas(linhas.map((l) => ({ ...l, incluir: e.target.checked })))} className="h-4 w-4 accent-primary" />
              <span>Data</span><span>Descrição</span><span>Categoria</span><span>Tipo</span><span className="text-right">Valor</span><span />
            </div>
            <ul className="divide-y divide-border">
              {linhas.map((l) => (
                <LinhaRevisao key={l._id} l={l} categorias={categorias} onChange={(p) => upd(l._id, p)} onRemove={() => setLinhas(linhas.filter((x) => x._id !== l._id))} />
              ))}
            </ul>
          </Panel>
        )}
        <div className="sticky bottom-0 mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_-4px_16px_-8px_hsl(222_47%_14%/0.15)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <span className="text-muted-foreground">{selecionadas.length} de {linhas.length} marcados</span>
            <span>Saídas <strong className="tabular-nums text-destructive">{brl(totDesp)}</strong></span>
            <span>Entradas <strong className="tabular-nums text-success">{brl(totRec)}</strong></span>
          </div>
          <Pill variant="solid" onClick={salvar} disabled={salvando || selecionadas.length === 0} className="h-11 px-6">
            {salvando ? "Salvando…" : `Salvar ${selecionadas.length} lançamento${selecionadas.length === 1 ? "" : "s"}`}
          </Pill>
        </div>
      </div>
    );
  }

  /* ---------- configuração ---------- */
  const pronto = !!destino && !!arquivo && !analisando;
  return (
    <div>
      <PageHeader title="Importar com IA" desc="Envie uma fatura de cartão ou extrato bancário em PDF e a IA extrai as transações para revisão antes de salvar." />
      <Panel className="max-w-4xl sm:p-6">
        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Configuração da importação</p>
        <p className="mb-2 text-sm font-medium text-foreground">Onde esses lançamentos entram?</p>

        {cartoes.length === 0 && contas.length === 0 ? (
          <EmptyState title="Nenhuma conta ou cartão cadastrado" desc="Cadastre em Configurações para poder importar." action={<Link to={`${base}/configuracoes`} className="text-sm font-medium text-primary underline">Ir para Configurações</Link>} />
        ) : (
          <div className="space-y-3" role="radiogroup" aria-label="Destino dos lançamentos">
            {cartoes.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cartões de crédito</p>
                <div className="space-y-2">
                  {cartoes.map((c) => <Opcao key={c.id} icon={CreditCard} nome={c.nome} sub="fatura de cartão" ativo={destino?.id === c.id} onClick={() => setDestino({ tipo: "cartao", id: c.id })} />)}
                </div>
              </div>
            )}
            {contas.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Contas bancárias</p>
                <div className="space-y-2">
                  {contas.map((c) => <Opcao key={c.id} icon={Landmark} nome={`${c.nome} (${c.tipo})`} sub="extrato bancário" ativo={destino?.id === c.id} onClick={() => setDestino({ tipo: "conta", id: c.id })} />)}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          {destino
            ? <span>A IA vai ler um{destino.tipo === "cartao" ? "a fatura de cartão" : " extrato bancário"} e os lançamentos entram em <strong className="text-foreground">{nomeDestino}</strong>.</span>
            : <span>Escolha acima para onde vão os lançamentos. É isso que diz à IA se ela deve ler uma fatura de cartão ou um extrato bancário.</span>}
        </div>

        {/* área de arquivo */}
        <div
          onDragOver={(e) => { e.preventDefault(); setArrastando(true); }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => { e.preventDefault(); setArrastando(false); escolherArquivo(e.dataTransfer.files?.[0]); }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
          role="button"
          tabIndex={0}
          className={`mt-4 cursor-pointer rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${arrastando ? "border-gold bg-gold-soft" : "border-border hover:bg-secondary/60"}`}
        >
          <input ref={inputRef} type="file" accept={ACEITOS.join(",")} className="hidden" data-testid="arquivo" onChange={(e) => { escolherArquivo(e.target.files?.[0]); e.target.value = ""; }} />
          {arquivo ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="h-8 w-8 shrink-0 text-primary" />
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-medium text-foreground">{arquivo.name}</p>
                <p className="text-xs text-muted-foreground">{(arquivo.size / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} KB</p>
              </div>
              <button type="button" aria-label="Remover arquivo" onClick={(e) => { e.stopPropagation(); setArquivo(null); }} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <>
              <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-foreground">Arraste o arquivo aqui ou clique para escolher</p>
              <p className="mt-0.5 text-xs text-muted-foreground">PDF, CSV, OFX ou TXT · máx. 10 MB</p>
            </>
          )}
        </div>

        {erro && (
          <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
            <p className="flex items-start gap-2 text-foreground"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" /> {erro}</p>
            <p className="mt-2 text-muted-foreground">
              Quer conhecer a revisão mesmo assim?{" "}
              <button type="button" onClick={() => carregar(exemplo())} className="font-medium text-primary underline underline-offset-2">Ver exemplo</button>
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={analisar}
          disabled={!pronto}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-[0_8px_22px_-10px_hsl(var(--primary)/0.6)] transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Sparkles className="h-5 w-5" /> {analisando ? "Analisando…" : "Analisar com IA"}
        </button>
        {!erro && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Sem arquivo à mão?{" "}
            <button type="button" onClick={() => (destino ? carregar(exemplo()) : toast.info("Escolha primeiro para onde vão os lançamentos."))} className="font-medium text-primary underline underline-offset-2">Ver exemplo</button>
          </p>
        )}
      </Panel>
    </div>
  );
}

function Opcao({ icon: Icon, nome, sub, ativo, onClick }: { icon: typeof CreditCard; nome: string; sub: string; ativo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={ativo}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-full border px-4 py-2.5 text-left text-sm transition ${ativo ? "border-primary bg-primary/5" : "border-border bg-secondary/50 hover:bg-secondary"}`}
    >
      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${ativo ? "border-primary" : "border-muted-foreground/50"}`}>
        {ativo && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-foreground">{nome}</span>
      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{sub}</span>
    </button>
  );
}

function LinhaRevisao({ l, categorias, onChange, onRemove }: { l: Linha; categorias: Categoria[]; onChange: (p: Partial<Linha>) => void; onRemove: () => void }) {
  const cats = categorias.filter((c) => c.tipo === l.tipo);
  const raizes = cats.filter((c) => !c.parent_id);
  const sm = inputCls.replace("h-10", "h-9");
  return (
    <li className={`px-4 py-3 lg:grid lg:grid-cols-[28px_140px_1fr_190px_120px_130px_36px] lg:items-center lg:gap-3 lg:px-5 ${l.incluir ? "" : "opacity-50"}`}>
      {/* celular: cabeçalho da linha */}
      <div className="mb-2 flex items-center gap-2 lg:contents">
        <input type="checkbox" aria-label="Importar esta linha" checked={l.incluir} onChange={(e) => onChange({ incluir: e.target.checked })} className="h-4 w-4 accent-primary" />
        <span className="flex-1 truncate text-xs font-medium text-foreground lg:hidden">{l.descricao || "Sem descrição"}</span>
        {l.needs_review && <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-medium text-warning lg:hidden"><AlertTriangle className="h-3 w-3" /> revisar</span>}
        <button type="button" aria-label="Remover linha" onClick={onRemove} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive lg:hidden"><Trash2 className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:contents">
        <input type="date" aria-label="Data" className={sm + " col-span-1 px-3"} value={l.data} onChange={(e) => onChange({ data: e.target.value })} />
        <div className="relative col-span-2 row-start-1 lg:col-span-1 lg:row-start-auto">
          <input aria-label="Descrição" className={sm + (l.needs_review ? " pr-9 ring-1 ring-warning/60" : "")} value={l.descricao} onChange={(e) => onChange({ descricao: e.target.value })} />
          {l.needs_review && <AlertTriangle className="absolute right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-warning lg:block" aria-label="Precisa revisão" />}
        </div>
        <select aria-label="Categoria" className={selectCls.replace("h-10", "h-9") + " col-span-2 lg:col-span-1"} value={l.categoria_id} onChange={(e) => onChange({ categoria_id: e.target.value, needs_review: false })}>
          <option value="">Sem categoria</option>
          {raizes.map((r) => [
            <option key={r.id} value={r.id}>{r.nome}</option>,
            ...cats.filter((s) => s.parent_id === r.id).map((s) => <option key={s.id} value={s.id}>{"  └ " + s.nome}</option>),
          ])}
        </select>
        <select aria-label="Tipo" className={selectCls.replace("h-10", "h-9") + " col-start-2 row-start-2 lg:col-auto lg:row-auto"} value={l.tipo} onChange={(e) => onChange({ tipo: e.target.value as Linha["tipo"], categoria_id: "" })}>
          <option value="despesa">Despesa</option>
          <option value="receita">Receita</option>
        </select>
        <input aria-label="Valor" inputMode="decimal" className={sm + ` col-span-2 text-right font-semibold tabular-nums lg:col-span-1 ${l.tipo === "receita" ? "text-success" : "text-destructive"}`} value={l.valor} onChange={(e) => onChange({ valor: e.target.value })} />
      </div>
      <button type="button" aria-label="Remover linha" onClick={onRemove} className="hidden h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive lg:grid"><Trash2 className="h-4 w-4" /></button>
    </li>
  );
}
