import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ListTree, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, FilterChips, EmptyState } from "./_ui";
import { useEmpresaId } from "@/hooks/useEmpresaId";

type Conta = { id: string; codigo: string; nome: string; tipo: string; grupo: string | null; ativo: boolean };

export default function PlanoContas() {
  const { empresaId } = useEmpresaId();
  const [items, setItems] = useState<Conta[]>([]);
  const [aba, setAba] = useState<"receita" | "despesa">("receita");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ codigo: "", nome: "", tipo: "receita", grupo: "" });

  const load = async () => {
    const { data, error } = await (supabase as any).from("plano_contas").select("*").order("codigo");
    if (error) return toast.error(error.message);
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId) return toast.error("Empresa não encontrada");
    const { error } = await (supabase as any).from("plano_contas").insert({
      empresa_id: empresaId, codigo: form.codigo, nome: form.nome,
      tipo: form.tipo, grupo: form.grupo || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Conta criada");
    setForm({ codigo: "", nome: "", tipo: "receita", grupo: "" });
    setOpen(false); load();
  };

  const filtrados = items.filter(i => i.tipo === aba);

  return (
    <div className="space-y-5 pb-24">
      <PageHeader title="Plano de Contas" subtitle="Estrutura de receitas e despesas" icon={ListTree}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova conta contábil</DialogTitle></DialogHeader>
              <form onSubmit={salvar} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Código *</Label><Input required placeholder="1.01" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} /></div>
                  <div>
                    <Label>Tipo</Label>
                    <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                      <option value="receita">Receita</option><option value="despesa">Despesa</option>
                    </select>
                  </div>
                </div>
                <div><Label>Nome *</Label><Input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
                <div><Label>Grupo</Label><Input placeholder="Ex.: Operacional" value={form.grupo} onChange={e => setForm({ ...form, grupo: e.target.value })} /></div>
                <DialogFooter><Button type="submit">Criar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        } />

      <FilterChips options={[{ value: "receita", label: "Receitas" }, { value: "despesa", label: "Despesas" }] as const} value={aba} onChange={setAba as any} />

      {filtrados.length === 0 ? <EmptyState icon={ListTree} title="Sem contas cadastradas" description="Estruture seu plano de contas" /> : (
        <div className="space-y-1">
          {filtrados.map(c => (
            <Card key={c.id} className="p-3 flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${c.tipo === "receita" ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]" : "bg-destructive/15 text-destructive"}`}>
                {c.tipo === "receita" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate"><span className="text-muted-foreground tabular-nums mr-2">{c.codigo}</span>{c.nome}</div>
                {c.grupo && <div className="text-[11px] text-muted-foreground">{c.grupo}</div>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
