import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Truck, Plus, Search, Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, FilterChips, EmptyState } from "./_ui";
import { useEmpresaId } from "@/hooks/useEmpresaId";

type Fornecedor = { id: string; nome: string; cnpj_cpf: string | null; email: string | null; telefone: string | null; condicao_pagamento: string | null; ativo: boolean };

export default function Fornecedores() {
  const { empresaId } = useEmpresaId();
  const [items, setItems] = useState<Fornecedor[]>([]);
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState<"ativos" | "arquivados">("ativos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", cnpj_cpf: "", email: "", telefone: "", condicao_pagamento: "", endereco: "", observacoes: "" });

  const load = async () => {
    const { data, error } = await (supabase as any).from("fornecedores").select("*").order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId) return toast.error("Empresa não encontrada");
    const { error } = await (supabase as any).from("fornecedores").insert({
      empresa_id: empresaId, nome: form.nome.trim(),
      cnpj_cpf: form.cnpj_cpf || null, email: form.email || null,
      telefone: form.telefone || null, condicao_pagamento: form.condicao_pagamento || null,
      endereco: form.endereco || null, observacoes: form.observacoes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Fornecedor cadastrado");
    setForm({ nome: "", cnpj_cpf: "", email: "", telefone: "", condicao_pagamento: "", endereco: "", observacoes: "" });
    setOpen(false); load();
  };

  const toggle = async (f: Fornecedor) => {
    await (supabase as any).from("fornecedores").update({ ativo: !f.ativo }).eq("id", f.id);
    load();
  };

  const filtrados = items.filter(f => (aba === "ativos" ? f.ativo : !f.ativo))
    .filter(f => !busca || f.nome.toLowerCase().includes(busca.toLowerCase()) || (f.cnpj_cpf ?? "").includes(busca));

  return (
    <div className="space-y-5 pb-24">
      <PageHeader title="Fornecedores" subtitle="Cadastro para compras e contas a pagar" icon={Truck}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo fornecedor</DialogTitle></DialogHeader>
              <form onSubmit={salvar} className="space-y-3">
                <div><Label>Nome *</Label><Input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>CNPJ/CPF</Label><Input value={form.cnpj_cpf} onChange={e => setForm({ ...form, cnpj_cpf: e.target.value })} /></div>
                  <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></div>
                </div>
                <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Endereço</Label><Input value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} /></div>
                <div><Label>Condição de pagamento</Label><Input placeholder="Ex.: 30 dias" value={form.condicao_pagamento} onChange={e => setForm({ ...form, condicao_pagamento: e.target.value })} /></div>
                <div><Label>Observações</Label><Textarea rows={2} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
                <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        } />

      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por nome ou CNPJ…" value={busca} onChange={e => setBusca(e.target.value)} />
      </div>

      <FilterChips options={[{ value: "ativos", label: "Ativos" }, { value: "arquivados", label: "Arquivados" }] as const} value={aba} onChange={setAba as any} />

      {filtrados.length === 0 ? <EmptyState icon={Truck} title="Sem fornecedores" description="Cadastre seu primeiro fornecedor" /> : (
        <div className="space-y-2">
          {filtrados.map(f => (
            <Card key={f.id} className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Truck className="h-4 w-4 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{f.nome}</div>
                <div className="text-[11px] text-muted-foreground truncate">{f.cnpj_cpf ?? "sem CNPJ"} · {f.telefone ?? "sem telefone"}</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => toggle(f)}>
                {f.ativo ? <Archive className="h-4 w-4" /> : <ArchiveRestore className="h-4 w-4" />}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
