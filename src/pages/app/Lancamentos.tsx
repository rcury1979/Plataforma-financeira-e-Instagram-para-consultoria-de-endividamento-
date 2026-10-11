import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ArrowDownCircle, ArrowUpCircle, Trash2, TrendingUp, TrendingDown, Receipt, ArrowRight, Pencil } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { PageHeader, KpiCard, FilterChips, EmptyState } from "./_ui";

type Lanc = {
  id: string;
  tipo: "receita" | "despesa";
  descricao: string;
  categoria: string | null;
  valor: number;
  data: string;
  planejado: boolean;
  forma_pagamento: string | null;
};

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CATEGORIAS_RECEITA_GRUPOS: Record<string, string[]> = {
  "Trabalho e vendas": ["Serviços", "Vendas", "Consultoria", "Salário", "Freelance / Bico", "Renda extra"],
  "Rendimentos": ["Investimentos", "Dividendos", "Aluguel recebido", "Reembolso"],
  "Outros": ["Presente / Doação recebida", "Venda de item", "Outros"],
};

const CATEGORIAS_DESPESA_GRUPOS: Record<string, string[]> = {
  "🏠 Moradia": ["Aluguel", "Financiamento imóvel", "Condomínio", "IPTU", "Luz", "Água", "Gás", "Internet", "Telefone / Celular", "Manutenção / Reformas", "Móveis e utensílios"],
  "🍽️ Alimentação": ["Supermercado", "Feira / Hortifruti", "Padaria", "Restaurante / Delivery", "Lanches / Café"],
  "🚗 Transporte": ["Combustível", "Transporte público", "Uber / Táxi / 99", "Estacionamento", "Pedágio", "IPVA / Licenciamento", "Seguro do carro", "Manutenção do carro"],
  "💊 Saúde": ["Plano de saúde", "Consultas médicas", "Exames", "Farmácia / Remédios", "Dentista", "Terapia / Psicólogo", "Academia"],
  "📚 Educação": ["Escola / Faculdade", "Curso / Mentoria", "Livros / Material", "Idiomas", "Cursos online"],
  "📺 Assinaturas e streaming": ["Netflix", "Spotify", "Amazon Prime", "Disney+", "HBO Max / Max", "YouTube Premium", "Apple / Google (apps)", "Outras assinaturas"],
  "🎬 Lazer e pessoal": ["Cinema / Teatro / Shows", "Viagem", "Hobbies", "Presentes", "Roupas / Calçados", "Beleza / Cabelo", "Cuidados pessoais"],
  "👨‍👩‍👧 Família / Filhos / Pets": ["Filhos", "Mesada", "Creche / Babá", "Pet (ração / vet)"],
  "💳 Financeiro": ["Cartão de crédito", "Financiamento de carro", "Financiamento de moto", "Financiamento de casa", "Empréstimo pessoal", "Empréstimo consignado", "Empréstimo / Financiamento (outros)", "Juros / Tarifas bancárias", "Imposto de renda", "Seguros", "Investimento aportado"],
  "🏢 Negócio / operacional": ["Fornecedores", "Salários", "Impostos", "Marketing", "Operacional", "Software / Assinaturas"],
  "💛 Doações e outros": ["Dízimo / Doações", "Impostos e taxas", "Outros"],
};

const CATEGORIAS_RECEITA = Object.values(CATEGORIAS_RECEITA_GRUPOS).flat();
const CATEGORIAS_DESPESA = Object.values(CATEGORIAS_DESPESA_GRUPOS).flat();

const categorias = {
  receita: CATEGORIAS_RECEITA,
  despesa: CATEGORIAS_DESPESA,
};

const categoriasGrupos = {
  receita: CATEGORIAS_RECEITA_GRUPOS,
  despesa: CATEGORIAS_DESPESA_GRUPOS,
};

export default function Lancamentos() {
  const [items, setItems] = useState<Lanc[]>([]);
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<"todos" | "receita" | "despesa" | "planejado">("todos");
  const [form, setForm] = useState({
    tipo: "despesa" as "receita" | "despesa",
    descricao: "",
    categoria: CATEGORIAS_DESPESA[0],
    valor: "",
    data: new Date().toISOString().slice(0, 10),
    planejado: false,
    forma_pagamento: "PIX",
  });

  const load = async () => {
    const { data } = await (supabase as any).from("lancamentos").select("*").order("data", { ascending: false });
    setItems((data ?? []) as Lanc[]);
  };
  useEffect(() => { load(); }, []);

  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      tipo: "despesa",
      descricao: "",
      categoria: CATEGORIAS_DESPESA[0],
      valor: "",
      data: new Date().toISOString().slice(0, 10),
      planejado: false,
      forma_pagamento: "PIX",
    });
  };

  const editar = (l: Lanc) => {
    setEditingId(l.id);
    setForm({
      tipo: l.tipo,
      descricao: l.descricao,
      categoria: l.categoria || (l.tipo === "receita" ? CATEGORIAS_RECEITA[0] : CATEGORIAS_DESPESA[0]),
      valor: String(l.valor).replace(".", ","),
      data: l.data,
      planejado: l.planejado,
      forma_pagamento: l.forma_pagamento || "PIX",
    });
    setOpen(true);
  };

  const salvar = async () => {
    const valor = Number(form.valor.replace(",", "."));
    if (!form.descricao.trim() || !valor) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const payload = {
      tipo: form.tipo,
      descricao: form.descricao,
      categoria: form.categoria,
      valor,
      data: form.data,
      planejado: form.planejado,
      forma_pagamento: form.forma_pagamento,
    };
    const { error } = editingId
      ? await (supabase as any).from("lancamentos").update(payload).eq("id", editingId)
      : await (supabase as any).from("lancamentos").insert({ user_id: u.user.id, ...payload });
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    toast({ title: editingId ? "Lançamento atualizado" : "Lançamento adicionado" });
    setOpen(false);
    resetForm();
    load();
  };

  const excluir = async (id: string) => {
    await (supabase as any).from("lancamentos").delete().eq("id", id);
    load();
  };


  const counts = {
    todos: items.length,
    receita: items.filter((i) => i.tipo === "receita" && !i.planejado).length,
    despesa: items.filter((i) => i.tipo === "despesa" && !i.planejado).length,
    planejado: items.filter((i) => i.planejado).length,
  };
  const filtered =
    tipo === "todos" ? items :
    tipo === "planejado" ? items.filter((i) => i.planejado) :
    items.filter((i) => i.tipo === tipo && !i.planejado);

  const totRec = items.filter((i) => i.tipo === "receita" && !i.planejado).reduce((s, i) => s + Number(i.valor), 0);
  const totDes = items.filter((i) => i.tipo === "despesa" && !i.planejado).reduce((s, i) => s + Number(i.valor), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Receipt}
        title="Lançamentos"
        subtitle="Receitas e despesas realizadas ou planejadas"
        action={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild><Button size="sm" onClick={() => resetForm()}><Plus className="h-4 w-4 mr-1" />Novo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingId ? "Editar lançamento" : "Novo lançamento"}</DialogTitle></DialogHeader>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setForm({ ...form, tipo: "receita", categoria: CATEGORIAS_RECEITA[0] })}
                    className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 text-sm transition ${
                      form.tipo === "receita" ? "border-[hsl(var(--success))] bg-[hsl(var(--success))]/10" : "border-border"
                    }`}
                  ><ArrowUpCircle className="h-4 w-4" />Receita</button>
                  <button
                    onClick={() => setForm({ ...form, tipo: "despesa", categoria: CATEGORIAS_DESPESA[0] })}
                    className={`p-3 rounded-lg border-2 flex items-center justify-center gap-2 text-sm transition ${
                      form.tipo === "despesa" ? "border-destructive bg-destructive/10" : "border-border"
                    }`}
                  ><ArrowDownCircle className="h-4 w-4" />Despesa</button>
                </div>
                <div><Label>Descrição</Label><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Valor (R$)</Label><Input inputMode="decimal" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0,00" /></div>
                  <div><Label>Data</Label><Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Categoria <span className="text-[10px] text-muted-foreground">({categorias[form.tipo].length} opções — digite para filtrar)</span></Label>
                    <Input
                      list="categorias-list"
                      value={form.categoria}
                      onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                      placeholder="Comece a digitar..."
                    />
                    <datalist id="categorias-list">
                      {Object.entries(categoriasGrupos[form.tipo]).map(([grupo, cats]) =>
                        cats.map((c) => <option key={grupo + c} value={c}>{grupo}</option>)
                      )}
                    </datalist>
                  </div>

                  <div>
                    <Label>Forma pagto</Label>
                    <Select value={form.forma_pagamento} onValueChange={(v) => setForm({ ...form, forma_pagamento: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["PIX", "Boleto", "Cartão", "Dinheiro", "Transferência"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.planejado} onChange={(e) => setForm({ ...form, planejado: e.target.checked })} />
                  Marcar como planejado (previsão futura)
                </label>
                <Button onClick={salvar} className="w-full">{editingId ? "Atualizar lançamento" : "Salvar lançamento"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <KpiCard icon={TrendingUp} label="Entradas" value={brl(totRec)} tone="success" />
        <KpiCard icon={TrendingDown} label="Saídas" value={brl(totDes)} tone="danger" />
      </div>

      <FilterChips<"todos" | "receita" | "despesa" | "planejado">
        value={tipo}
        onChange={setTipo}
        options={[
          { value: "todos", label: "Todos", count: counts.todos },
          { value: "receita", label: "Receitas", count: counts.receita },
          { value: "despesa", label: "Despesas", count: counts.despesa },
          { value: "planejado", label: "Planejados", count: counts.planejado },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={items.length === 0 ? "Nenhum lançamento" : "Nada neste filtro"}
          description={items.length === 0 ? "Adicione sua primeira receita ou despesa para começar." : "Ajuste os filtros para ver outros lançamentos."}
          action={items.length === 0 ? <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Novo lançamento</Button> : undefined}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((l) => (
            <Card key={l.id} className="p-3 flex items-center gap-3 hover:border-primary/40 transition">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${l.tipo === "receita" ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]" : "bg-destructive/15 text-destructive"}`}>
                {l.tipo === "receita" ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{l.descricao}</div>
                <div className="text-xs text-muted-foreground">
                  {l.categoria} · {new Date(l.data + "T00:00:00").toLocaleDateString("pt-BR")}
                  {l.planejado && <span className="ml-1 text-primary">· planejado</span>}
                </div>
              </div>
              <div className={`text-sm font-semibold tabular-nums shrink-0 ${l.tipo === "receita" ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                {l.tipo === "receita" ? "+" : "-"} {brl(Number(l.valor))}
              </div>
              <button onClick={() => editar(l)} className="text-muted-foreground hover:text-primary shrink-0" title="Editar"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => excluir(l.id)} className="text-muted-foreground hover:text-destructive shrink-0" title="Excluir"><Trash2 className="h-4 w-4" /></button>

            </Card>
          ))}
        </div>
      )}

      <Link to="/app/fluxo-caixa" className="block">
        <Button variant="outline" className="w-full">
          Ver fluxo de caixa diário <ArrowRight className="h-4 w-4 ml-auto" />
        </Button>
      </Link>
    </div>
  );
}
