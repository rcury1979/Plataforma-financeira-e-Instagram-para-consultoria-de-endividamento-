import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Plus, Pencil } from "lucide-react";

const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const CATEGORIAS_RECEITA_GRUPOS: Record<string, string[]> = {
  "Trabalho": ["Salário", "13º salário", "Férias", "Freelance / Bico", "Renda extra"],
  "Investimentos": ["Rendimentos de investimentos", "Dividendos", "Aluguel recebido"],
  "Outros": ["Restituição de imposto", "Pensão / Auxílio", "Presente / Doação recebida", "Venda de item", "Reembolso", "Outros"],
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
  "💛 Doações e outros": ["Dízimo / Doações", "Impostos e taxas", "Outros"],
};
const CATEGORIAS_RECEITA = Object.values(CATEGORIAS_RECEITA_GRUPOS).flat();
const CATEGORIAS_DESPESA = Object.values(CATEGORIAS_DESPESA_GRUPOS).flat();

export default function PFTransacoes() {
  const [itens, setItens] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ tipo: "despesa", categoria: CATEGORIAS_DESPESA[0], descricao: "", valor: "", data: new Date().toISOString().slice(0, 10) });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const setTipo = (tipo: "receita" | "despesa") => {
    const primeiraCat = tipo === "receita" ? CATEGORIAS_RECEITA[0] : CATEGORIAS_DESPESA[0];
    setForm((f) => ({ ...f, tipo, categoria: primeiraCat }));
  };

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await (supabase as any).from("pf_transacoes").select("*").eq("user_id", user.id).order("data", { ascending: false }).limit(200);
    setItens(data || []);
  };
  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({ tipo: "despesa", categoria: CATEGORIAS_DESPESA[0], descricao: "", valor: "", data: new Date().toISOString().slice(0, 10) });
  };

  const editar = (t: any) => {
    setEditingId(t.id);
    setForm({
      tipo: t.tipo,
      categoria: t.categoria,
      descricao: t.descricao || "",
      valor: String(t.valor),
      data: t.data,
    });
    setOpen(true);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const payload = {
      tipo: form.tipo,
      categoria: form.categoria,
      descricao: form.descricao || null,
      valor: Number(form.valor),
      data: form.data,
    };
    const { error } = editingId
      ? await (supabase as any).from("pf_transacoes").update(payload).eq("id", editingId)
      : await (supabase as any).from("pf_transacoes").insert({ user_id: user.id, ...payload });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(editingId ? "Atualizado!" : "Registrado!");
    resetForm();
    setOpen(false);
    load();
  };

  const remover = async (id: string) => {
    const { error } = await (supabase as any).from("pf_transacoes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif">Meus lançamentos</h1>
          <p className="text-sm text-muted-foreground">{itens.length === 0 ? "Comece registrando — sem julgamento, só verdade." : `${itens.length} passo${itens.length > 1 ? "s" : ""} registrado${itens.length > 1 ? "s" : ""}`}</p>
        </div>
        <Button onClick={() => setOpen(!open)} size="sm"><Plus className="h-4 w-4 mr-1" /> Novo</Button>
      </div>

      {open && (
        <Card className="p-4">
          <form onSubmit={salvar} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setTipo("receita")}
                className={`rounded-md border py-2 text-sm ${form.tipo === "receita" ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-border text-muted-foreground"}`}>
                Receita
              </button>
              <button type="button" onClick={() => setTipo("despesa")}
                className={`rounded-md border py-2 text-sm ${form.tipo === "despesa" ? "border-destructive bg-destructive/10 text-destructive" : "border-border text-muted-foreground"}`}>
                Despesa
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor</Label>
                <Input type="number" step="0.01" required value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
              </div>
              <div>
                <Label>Data</Label>
                <Input type="date" required value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Categoria <span className="text-[10px] text-muted-foreground">({(form.tipo === "receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA).length} opções — digite para filtrar)</span></Label>
              <Input
                list="pf-categorias-list"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                placeholder="Comece a digitar..."
              />
              <datalist id="pf-categorias-list">
                {Object.entries(form.tipo === "receita" ? CATEGORIAS_RECEITA_GRUPOS : CATEGORIAS_DESPESA_GRUPOS).map(([grupo, cats]) =>
                  cats.map((c) => <option key={grupo + c} value={c}>{grupo}</option>)
                )}
              </datalist>
            </div>

            <div>
              <Label>Descrição (opcional)</Label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">{editingId ? "Atualizar" : "Salvar"}</Button>
              {editingId && <Button type="button" variant="outline" onClick={() => { resetForm(); setOpen(false); }}>Cancelar</Button>}
            </div>

          </form>
        </Card>
      )}

      {itens.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground text-center">Nenhum lançamento ainda. Coragem — escrever é o primeiro passo pra mudar.</Card>
      ) : (
        <Card className="divide-y">
          {itens.map((t) => (
            <div key={t.id} className="flex justify-between items-center p-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{t.descricao || t.categoria}</div>
                <div className="text-[11px] text-muted-foreground">{t.categoria} · {new Date(t.data).toLocaleDateString("pt-BR")}</div>
              </div>
              <div className={`text-sm font-semibold mr-2 ${t.tipo === "receita" ? "text-emerald-500" : "text-destructive"}`}>
                {t.tipo === "receita" ? "+" : "−"} {BRL(Number(t.valor))}
              </div>
              <button onClick={() => editar(t)} className="text-muted-foreground hover:text-primary p-1" title="Editar">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => remover(t.id)} className="text-muted-foreground hover:text-destructive p-1" title="Excluir">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

        </Card>
      )}
    </div>
  );
}
