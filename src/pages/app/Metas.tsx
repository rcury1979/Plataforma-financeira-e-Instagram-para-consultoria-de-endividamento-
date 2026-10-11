import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Target, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, EmptyState } from "./_ui";
import { useEmpresaId } from "@/hooks/useEmpresaId";

type Meta = { id: string; mes: string; tipo: string; categoria: string | null; valor_previsto: number; valor_realizado: number };
const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Metas() {
  const { empresaId } = useEmpresaId();
  const [items, setItems] = useState<Meta[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ mes: new Date().toISOString().slice(0, 7), tipo: "receita", categoria: "", valor_previsto: "", valor_realizado: "" });

  const load = async () => {
    const { data, error } = await (supabase as any).from("metas").select("*").order("mes", { ascending: false });
    if (error) return toast.error(error.message);
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId) return toast.error("Empresa não encontrada");
    const { error } = await (supabase as any).from("metas").insert({
      empresa_id: empresaId, mes: `${form.mes}-01`,
      tipo: form.tipo, categoria: form.categoria || null,
      valor_previsto: Number(form.valor_previsto) || 0,
      valor_realizado: Number(form.valor_realizado) || 0,
    });
    if (error) return toast.error(error.message);
    toast.success("Meta cadastrada");
    setForm({ mes: new Date().toISOString().slice(0, 7), tipo: "receita", categoria: "", valor_previsto: "", valor_realizado: "" });
    setOpen(false); load();
  };

  return (
    <div className="space-y-5 pb-24">
      <PageHeader title="Metas & Orçamento" subtitle="Previsto × realizado por mês" icon={Target}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova meta</DialogTitle></DialogHeader>
              <form onSubmit={salvar} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Mês</Label><Input type="month" value={form.mes} onChange={e => setForm({ ...form, mes: e.target.value })} /></div>
                  <div>
                    <Label>Tipo</Label>
                    <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                      <option value="receita">Receita</option><option value="despesa">Despesa</option><option value="margem">Margem</option>
                    </select>
                  </div>
                </div>
                <div><Label>Categoria</Label><Input placeholder="Ex.: Vendas" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Previsto</Label><Input type="number" step="0.01" value={form.valor_previsto} onChange={e => setForm({ ...form, valor_previsto: e.target.value })} /></div>
                  <div><Label>Realizado</Label><Input type="number" step="0.01" value={form.valor_realizado} onChange={e => setForm({ ...form, valor_realizado: e.target.value })} /></div>
                </div>
                <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        } />

      {items.length === 0 ? <EmptyState icon={Target} title="Sem metas" description="Cadastre metas para acompanhar previsto × realizado" /> : (
        <div className="space-y-2">
          {items.map(m => {
            const p = Number(m.valor_previsto), r = Number(m.valor_realizado);
            const pct = p > 0 ? Math.min(100, (r / p) * 100) : 0;
            const acima = r >= p && p > 0;
            return (
              <Card key={m.id} className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium">
                      {m.categoria ?? m.tipo} <span className="text-[11px] text-muted-foreground">· {new Date(m.mes).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{BRL(r)} de {BRL(p)}</div>
                  </div>
                  <span className={`text-sm font-semibold ${acima ? "text-[hsl(var(--success))]" : "text-primary"}`}>{pct.toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${acima ? "bg-[hsl(var(--success))]" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
