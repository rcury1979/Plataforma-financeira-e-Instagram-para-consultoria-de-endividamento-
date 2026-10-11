import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { statementDestination, type StatementClient } from "@/lib/client-statement";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useTipoPessoa } from "@/hooks/useTipoPessoa";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ChevronLeft, Upload, Sparkles, FileText, AlertTriangle, CheckCircle2, Trash2, Loader2, Landmark,
} from "lucide-react";

const CATEGORIAS_RECEITA_PJ = ["Vendas", "Serviços", "Comissões", "Juros", "Aluguel Recebido", "Outros"];
const CATEGORIAS_DESPESA_PJ = [
  "Alimentação", "Transporte", "Moradia", "Energia", "Água", "Internet/Telefone",
  "Salários", "Impostos", "Fornecedores", "Marketing", "Software/Assinaturas",
  "Bancos/Tarifas", "Combustível", "Manutenção", "Educação", "Saúde",
  "Financiamento de Carro", "Financiamento de Moto", "Financiamento de Casa", "Empréstimo", "Outros",
];
const CATEGORIAS_RECEITA_PF = [
  "Salário", "13º Salário", "Férias", "Freelance / Bico", "Aluguel Recebido",
  "Rendimento de Investimento", "Pensão / Benefício", "Restituição", "Presente / Doação", "Outros",
];
const CATEGORIAS_DESPESA_PF = [
  "Aluguel", "Condomínio", "Luz", "Água", "Gás", "Internet", "Telefone / Celular", "IPTU",
  "Mercado", "Restaurante / Delivery", "Combustível", "Transporte por App", "Ônibus / Metrô",
  "Manutenção do Carro", "IPVA / Licenciamento", "Seguro do Carro",
  "Plano de Saúde", "Farmácia", "Consultas / Exames", "Academia",
  "Escola / Faculdade", "Cursos", "Streaming", "Assinaturas", "Lazer / Passeios", "Viagem",
  "Roupas", "Beleza / Cuidados", "Pets", "Presentes",
  "Cartão de Crédito", "Empréstimo", "Financiamento de Carro", "Financiamento de Moto",
  "Financiamento de Casa", "Tarifas Bancárias", "Juros / Multas", "Impostos", "Doações", "Outros",
];
const FORMAS = ["", "pix", "boleto", "cartao_credito", "cartao_debito", "dinheiro", "transferencia"];

type Item = {
  _id: string;
  data: string;
  tipo: "receita" | "despesa";
  descricao: string;
  valor: number;
  categoria: string;
  forma_pagamento: string;
  needs_review: boolean;
};

const readAsBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      resolve(s.split(",")[1] || "");
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });

export default function ImportarPdf() {
  const { tipo } = useTipoPessoa();
  const [params] = useSearchParams();
  const [clientes, setClientes] = useState<StatementClient[]>([]);
  const [clienteId, setClienteId] = useState(params.get("cliente_id") ?? "");
  const [admin, setAdmin] = useState(false);
  const [clientsReady, setClientsReady] = useState(false);
  const selectedClient = clientes.find(c => c.id === clienteId);
  const destination = statementDestination(selectedClient, tipo === "PF" ? "PF" : "PJ");
  const isPF = destination.profile === "PF";
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => { void (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const role = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    setAdmin(role.data === true);
    const result = await supabase.from("clientes").select("id,nome,tipo_pessoa").order("nome");
    if (result.error) toast.error("Não foi possível carregar os clientes para vincular o extrato.");
    else setClientes((result.data ?? []).filter((c): c is StatementClient => c.tipo_pessoa === "PF" || c.tipo_pessoa === "PJ"));
    setClientsReady(true);
  })(); }, []);

  const processar = async () => {
    if (!file) return;
    if ((admin && !selectedClient) || (clienteId && !selectedClient)) { toast.error("Selecione o cliente deste extrato."); return; }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Arquivo maior que 15MB.");
      return;
    }
    setLoading(true);
    try {
      const nome = file.name.toLowerCase();
      const isTexto =
        file.type.startsWith("text/") ||
        nome.endsWith(".txt") ||
        nome.endsWith(".csv") ||
        nome.endsWith(".ofx");
      const body: Record<string, unknown> = {
        fileName: file.name,
        perfil: isPF ? "PF" : "PJ",
        clienteId: selectedClient?.id,
      };
      if (isTexto) {
        body.textoBruto = await file.text();
        body.mimeType = "text/plain";
      } else {
        body.pdfBase64 = await readAsBase64(file);
        body.mimeType = file.type || "application/pdf";
      }
      const { data, error } = await supabase.functions.invoke("parse-pdf-lancamentos", {
        body,
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const lst = ((data as any)?.lancamentos ?? []) as Item[];
      if (lst.length === 0) toast.info("Nenhum lançamento identificado no documento.");
      else toast.success(`${lst.length} ${lst.length === 1 ? "lançamento identificado" : "lançamentos identificados"}`);
      setItems(lst);
    } catch (e: any) {
      toast.error(e.message || "Erro ao ler o extrato");
    } finally {
      setLoading(false);
    }
  };

  const update = (id: string, patch: Partial<Item>) =>
    setItems((old) => old.map((i) => (i._id === id ? { ...i, ...patch, needs_review: !((patch.descricao ?? i.descricao) && (patch.categoria ?? i.categoria)) } : i)));

  const remover = (id: string) => setItems((old) => old.filter((i) => i._id !== id));

  const salvar = async () => {
    if ((admin && !selectedClient) || (clienteId && !selectedClient)) { toast.error("Selecione o cliente antes de salvar."); return; }
    const pendentes = items.filter((i) => !i.descricao.trim() || !i.categoria.trim() || !Number.isFinite(i.valor) || i.valor <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(i.data));
    if (pendentes.length > 0) {
      toast.error(`${pendentes.length} ${pendentes.length === 1 ? "lançamento incompleto" : "lançamentos incompletos"}. Confira descrição, categoria, valor e data antes de salvar.`);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);

    let error: any = null;
    if (destination.table === "pf_transacoes") {
      const rows = items.map((i) => ({
        user_id: user.id,
        tipo: i.tipo,
        categoria: i.categoria || "Outros",
        descricao: i.descricao.trim(),
        valor: i.valor,
        data: i.data,
        recorrente: false,
      }));
      ({ error } = await (supabase as any).from("pf_transacoes").insert(rows));
    } else {
      const rows = items.map((i) => ({
        user_id: user.id,
        cliente_id: destination.cliente_id,
        tipo: i.tipo,
        descricao: i.descricao.trim(),
        valor: i.valor,
        data: i.data,
        categoria: i.categoria || null,
        forma_pagamento: i.forma_pagamento || null,
        planejado: false,
      }));
      ({ error } = await supabase.from("lancamentos").insert(rows));
    }

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`${items.length} ${items.length === 1 ? "lançamento salvo" : "lançamentos salvos"}!`);
    setItems([]);
    setFile(null);
  };

  const revisar = items.filter((i) => i.needs_review).length;
  const totalReceita = items.filter((i) => i.tipo === "receita").reduce((s, i) => s + i.valor, 0);
  const totalDespesa = items.filter((i) => i.tipo === "despesa").reduce((s, i) => s + i.valor, 0);
  const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-5">
      <div>
        <Link to="/app/mais" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ChevronLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-[26px] font-serif font-semibold tracking-tight">Leitura de Extratos com IA</h1>
            <p className="text-sm text-muted-foreground">
              A IA lê seu extrato bancário ou fatura e organiza tudo para você conferir.
            </p>
          </div>
        </div>
      </div>

      <Card className="p-5 space-y-4">
        {(admin || clientes.length > 0 || clienteId) && <div className="space-y-2"><Label htmlFor="extrato-cliente">Cliente do extrato</Label><Select value={clienteId || "pessoal"} disabled={!clientsReady || loading || saving} onValueChange={v => { setClienteId(v === "pessoal" ? "" : v); setItems([]); }}><SelectTrigger id="extrato-cliente"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger><SelectContent>{!admin && <SelectItem value="pessoal">Meu extrato pessoal</SelectItem>}{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome} · {c.tipo_pessoa}</SelectItem>)}</SelectContent></Select>{selectedClient && <p className="text-xs text-muted-foreground">Categorias de Pessoa {isPF ? "Física" : "Jurídica"} · {selectedClient.nome}</p>}</div>}
        <div className="space-y-2">
          <Label>Extrato, fatura ou comprovante</Label>
          <div className="flex items-center gap-2">
            <label className="flex-1 flex items-center gap-2 h-11 px-3 border rounded-md cursor-pointer hover:bg-muted/50 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="truncate flex-1">{file?.name ?? "Selecionar arquivo (PDF, TXT, CSV ou foto)…"}</span>
              <Input
                type="file"
                accept="application/pdf,image/*,text/plain,text/csv,.txt,.csv,.ofx"
                className="hidden"
                onChange={(e) => { setFile(e.target.files?.[0] ?? null); setItems([]); }}
              />
            </label>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Máx. 15 MB. Aceita PDF, TXT, CSV/OFX, além de foto legível do extrato bancário, fatura de cartão ou comprovante de Pix.
          </p>
        </div>
        <Button onClick={processar} disabled={!file || loading || !clientsReady || (admin && !selectedClient)} className="w-full">
          {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Lendo seu extrato com IA…</> : <><Upload className="h-4 w-4 mr-2" /> Ler com IA</>}
        </Button>
        <div className="flex items-start gap-2 rounded-md bg-muted/40 p-3">
          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground">
            Nada é salvo automaticamente: a IA sugere data, valor, tipo e categoria, e você revisa antes de confirmar.
            O extrato fica na jornada do cliente selecionado, respeitando os acessos autorizados.
          </p>
        </div>
      </Card>

      {items.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Card className="p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Entradas</div>
              <div className="text-sm font-semibold text-emerald-500 mt-1">{brl(totalReceita)}</div>
            </Card>
            <Card className="p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Saídas</div>
              <div className="text-sm font-semibold text-destructive mt-1">{brl(totalDespesa)}</div>
            </Card>
            <Card className="p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">A revisar</div>
              <div className={`text-sm font-semibold mt-1 ${revisar > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                {revisar}
              </div>
            </Card>
          </div>

          {revisar > 0 && (
            <Card className="p-3 border-amber-500/40 bg-amber-500/10 flex gap-2 items-start">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {revisar} {revisar === 1 ? "lançamento precisa" : "lançamentos precisam"} de descrição ou categoria. Complete os campos destacados antes de salvar.
              </p>
            </Card>
          )}

          <div className="space-y-2">
            {items.map((i) => {
              const cats = i.tipo === "receita"
                ? (isPF ? CATEGORIAS_RECEITA_PF : CATEGORIAS_RECEITA_PJ)
                : (isPF ? CATEGORIAS_DESPESA_PF : CATEGORIAS_DESPESA_PJ);
              return (
                <Card key={i._id} className={`p-3 space-y-2 ${i.needs_review ? "border-amber-500/50" : ""}`}>
                  <div className="flex items-center gap-2">
                    <select
                      value={i.tipo}
                      onChange={(e) => update(i._id, { tipo: e.target.value as any, categoria: "" })}
                      className={`h-8 rounded-md border px-2 text-xs font-medium bg-background ${i.tipo === "receita" ? "text-emerald-500" : "text-destructive"}`}
                    >
                      <option value="receita">Entrada</option>
                      <option value="despesa">Saída</option>
                    </select>
                    <Input
                      type="date"
                      value={i.data}
                      onChange={(e) => update(i._id, { data: e.target.value })}
                      className="h-8 w-auto text-xs"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      value={i.valor}
                      onChange={(e) => update(i._id, { valor: Number(e.target.value) })}
                      className="h-8 text-xs text-right font-semibold"
                    />
                    <Button size="icon" variant="ghost" onClick={() => remover(i._id)} className="h-8 w-8 shrink-0">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Descrição (obrigatória)"
                    value={i.descricao}
                    onChange={(e) => update(i._id, { descricao: e.target.value })}
                    className={`h-9 text-sm ${!i.descricao ? "border-amber-500/60" : ""}`}
                  />
                  <div className={`grid gap-2 ${isPF ? "grid-cols-1" : "grid-cols-2"}`}>
                    <select
                      value={i.categoria}
                      onChange={(e) => update(i._id, { categoria: e.target.value })}
                      className={`h-9 rounded-md border bg-background px-2 text-xs ${!i.categoria ? "border-amber-500/60" : ""}`}
                    >
                      <option value="">Selecione categoria…</option>
                      {cats.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {!isPF && (
                      <select
                        value={i.forma_pagamento}
                        onChange={(e) => update(i._id, { forma_pagamento: e.target.value })}
                        className="h-9 rounded-md border bg-background px-2 text-xs"
                      >
                        {FORMAS.map((f) => <option key={f} value={f}>{f || "Forma de pagamento…"}</option>)}
                      </select>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="sticky bottom-20 z-20 -mx-4 px-4 py-3 bg-background/95 backdrop-blur border-t">
            <Button onClick={salvar} disabled={saving || items.length === 0} className="w-full">
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando…</> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Salvar {items.length} {items.length === 1 ? "lançamento" : "lançamentos"}</>}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
