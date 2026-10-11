import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Building2, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, EmptyState } from "./_ui";
import { useEmpresaId } from "@/hooks/useEmpresaId";

type CC = { id: string; codigo: string; nome: string; descricao: string | null; ativo: boolean };

export default function CentrosCusto() {
  const { empresaId } = useEmpresaId();
  const [items, setItems] = useState<CC[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ codigo: "", nome: "", descricao: "" });

  const load = async () => {
    const { data, error } = await (supabase as any).from("centros_custo").select("*").order("codigo");
    if (error) return toast.error(error.message);
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId) return toast.error("Empresa não encontrada");
    const { error } = await (supabase as any).from("centros_custo").insert({
      empresa_id: empresaId, codigo: form.codigo, nome: form.nome, descricao: form.descricao || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Centro de custo criado");
    setForm({ codigo: "", nome: "", descricao: "" });
    setOpen(false); load();
  };

  return (
    <div className="space-y-5 pb-24">
      <PageHeader title="Centros de Custo" subtitle="Para DRE gerencial e análise por área" icon={Building2}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo centro de custo</DialogTitle></DialogHeader>
              <form onSubmit={salvar} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div><Label>Código *</Label><Input required placeholder="CC01" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} /></div>
                  <div className="col-span-2"><Label>Nome *</Label><Input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
                </div>
                <div><Label>Descrição</Label><Textarea rows={2} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
                <DialogFooter><Button type="submit">Criar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        } />

      {items.length === 0 ? <EmptyState icon={Building2} title="Sem centros de custo" description="Cadastre para classificar despesas por área" /> : (
        <div className="space-y-2">
          {items.map(c => (
            <Card key={c.id} className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Building2 className="h-4 w-4 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium"><span className="text-muted-foreground tabular-nums mr-2">{c.codigo}</span>{c.nome}</div>
                {c.descricao && <div className="text-[11px] text-muted-foreground truncate">{c.descricao}</div>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
