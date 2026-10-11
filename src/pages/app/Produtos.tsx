import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Package, Plus, Search, Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, FilterChips, EmptyState } from "./_ui";
import { useEmpresaId } from "@/hooks/useEmpresaId";

type Produto = {
  id: string; nome: string; sku: string | null; tipo: string;
  preco_venda: number; custo: number; unidade: string;
  estoque_minimo: number; ativo: boolean; descricao: string | null;
};

const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Produtos() {
  const { empresaId } = useEmpresaId();
  const [items, setItems] = useState<Produto[]>([]);
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState<"ativos" | "arquivados">("ativos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", sku: "", tipo: "produto", preco_venda: "", custo: "", unidade: "UN", estoque_minimo: "", descricao: "" });

  const load = async () => {
    const { data, error } = await (supabase as any).from("produtos").select("*").order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId) return toast.error("Empresa não encontrada");
    const { error } = await (supabase as any).from("produtos").insert({
      empresa_id: empresaId, nome: form.nome.trim(), sku: form.sku || null,
      tipo: form.tipo, preco_venda: Number(form.preco_venda) || 0,
      custo: Number(form.custo) || 0, unidade: form.unidade,
      estoque_minimo: Number(form.estoque_minimo) || 0, descricao: form.descricao || null,
    });
    if (error) return toast.error(error.message);
    toast.success(form.tipo === "servico" ? "Serviço cadastrado" : "Produto cadastrado");
    setForm({ nome: "", sku: "", tipo: "produto", preco_venda: "", custo: "", unidade: "UN", estoque_minimo: "", descricao: "" });
    setOpen(false); load();
  };

  const toggleArquivar = async (p: Produto) => {
    const { error } = await (supabase as any).from("produtos").update({ ativo: !p.ativo }).eq("id", p.id);
    if (error) return toast.error(error.message);
    load();
  };

  const filtrados = items
    .filter(p => (aba === "ativos" ? p.ativo : !p.ativo))
    .filter(p => !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(busca.toLowerCase()));

  const ativos = items.filter(p => p.ativo).length;
  const arquivados = items.length - ativos;

  return (
    <div className="space-y-5 pb-24">
      <PageHeader
        title="Produtos & Serviços"
        subtitle="Catálogo para vendas, estoque e notas fiscais"
        icon={Package}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo produto ou serviço</DialogTitle></DialogHeader>
              <form onSubmit={salvar} className="space-y-3">
                <div className="flex gap-2">
                  <Button type="button" variant={form.tipo === "produto" ? "default" : "outline"} size="sm" onClick={() => setForm({ ...form, tipo: "produto" })}>Produto</Button>
                  <Button type="button" variant={form.tipo === "servico" ? "default" : "outline"} size="sm" onClick={() => setForm({ ...form, tipo: "servico" })}>Serviço</Button>
                </div>
                <div><Label>Nome *</Label><Input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>SKU</Label><Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
                  <div><Label>Unidade</Label><Input value={form.unidade} onChange={e => setForm({ ...form, unidade: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Preço venda</Label><Input type="number" step="0.01" value={form.preco_venda} onChange={e => setForm({ ...form, preco_venda: e.target.value })} /></div>
                  <div><Label>Custo</Label><Input type="number" step="0.01" value={form.custo} onChange={e => setForm({ ...form, custo: e.target.value })} /></div>
                </div>
                <div><Label>Estoque mínimo</Label><Input type="number" step="0.001" value={form.estoque_minimo} onChange={e => setForm({ ...form, estoque_minimo: e.target.value })} /></div>
                <div><Label>Descrição</Label><Textarea rows={2} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
                <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por nome ou SKU…" value={busca} onChange={e => setBusca(e.target.value)} />
      </div>

      <FilterChips options={[{ value: "ativos", label: "Ativos", count: ativos }, { value: "arquivados", label: "Arquivados", count: arquivados }] as const} value={aba} onChange={setAba as any} />

      {filtrados.length === 0 ? (
        <EmptyState icon={Package} title="Sem produtos" description="Cadastre seu primeiro produto ou serviço" />
      ) : (
        <div className="space-y-2">
          {filtrados.map(p => (
            <Card key={p.id} className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.nome}</div>
                <div className="text-[11px] text-muted-foreground">
                  {p.tipo === "servico" ? "Serviço" : "Produto"} · {p.sku ?? "sem SKU"} · {p.unidade}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{BRL(Number(p.preco_venda))}</div>
                <div className="text-[10px] text-muted-foreground">custo {BRL(Number(p.custo))}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => toggleArquivar(p)}>
                {p.ativo ? <Archive className="h-4 w-4" /> : <ArchiveRestore className="h-4 w-4" />}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
