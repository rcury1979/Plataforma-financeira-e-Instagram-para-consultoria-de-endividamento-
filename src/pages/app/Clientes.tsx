import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { UserPlus, Users, Search, Archive, ArchiveRestore, Trash2, Info, ChevronDown, X, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, FilterChips, EmptyState } from "./_ui";
import { ClienteDetalhe } from "./ClienteDetalhe";

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min(100, (used / limit) * 100);
  const critical = pct >= 90;
  return (
    <div>
      <div className="text-[13px] text-muted-foreground mb-1.5">
        {used} de {limit} {label}
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full transition-all ${critical ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}


type Cliente = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  documento: string | null;
  observacoes: string | null;
  arquivado: boolean;
  tipo_pessoa: "PF" | "PJ";
};

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState<"ativos" | "arquivados">("ativos");
  const [open, setOpen] = useState(false);
  const [ajudaOpen, setAjudaOpen] = useState(false);
  const [detalhe, setDetalhe] = useState<Cliente | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", documento: "", observacoes: "", tipo_pessoa: "PF" as "PF" | "PJ" });

  const load = async () => {
    const { data, error } = await supabase.from("clientes").select("*").order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setClientes((data as any) ?? []);
  };
  useEffect(() => { load(); }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("clientes").insert({
      user_id: user.id,
      nome: form.nome.trim(),
      email: form.email || null,
      telefone: form.telefone || null,
      documento: form.documento || null,
      observacoes: form.observacoes || null,
      tipo_pessoa: form.tipo_pessoa,
      responsavel_id: user.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Cliente cadastrado");
    setForm({ nome: "", email: "", telefone: "", documento: "", observacoes: "", tipo_pessoa: "PF" });
    setOpen(false);
    load();
  };

  const toggleArquivar = async (c: Cliente) => {
    const { error } = await supabase.from("clientes").update({ arquivado: !c.arquivado }).eq("id", c.id);
    if (error) return toast.error(error.message);
    load();
  };
  const excluir = async (id: string) => {
    if (!confirm("Excluir este cliente?")) return;
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const q = busca.toLowerCase().trim();
  const filtrar = (lista: Cliente[]) =>
    !q ? lista : lista.filter((c) => [c.nome, c.email, c.telefone].filter(Boolean).some((v) => v!.toLowerCase().includes(q)));

  const ativos = filtrar(clientes.filter((c) => !c.arquivado));
  const arquivados = filtrar(clientes.filter((c) => c.arquivado));
  const lista = aba === "ativos" ? ativos : arquivados;

  const LIMITE_CLIENTES = 7;
  const IMPORTS_MES = 20;
  const ANALISES_MES = 40;
  const usados = clientes.length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-serif font-semibold tracking-tight">Clientes</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full">
              <UserPlus className="h-4 w-4 mr-1.5" />Adicionar cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo cliente</DialogTitle></DialogHeader>
            <form onSubmit={salvar} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nome *</Label>
                <Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>CPF / CNPJ</Label>
                <Input value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Perfil financeiro</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button type="button" variant={form.tipo_pessoa === "PF" ? "default" : "outline"} onClick={() => setForm({ ...form, tipo_pessoa: "PF" })}>Pessoa Física</Button>
                  <Button type="button" variant={form.tipo_pessoa === "PJ" ? "default" : "outline"} onClick={() => setForm({ ...form, tipo_pessoa: "PJ" })}>Pessoa Jurídica</Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Textarea rows={3} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="submit">Salvar cliente</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barras de uso */}
      <div className="space-y-3">
        <UsageBar label="vagas utilizadas" used={usados} limit={LIMITE_CLIENTES} />
        <UsageBar label="importações usadas este mês" used={0} limit={IMPORTS_MES} />
        <UsageBar label="análises usadas este mês" used={0} limit={ANALISES_MES} />
      </div>

      {/* Tabs Ativos / Arquivados */}
      <div className="flex rounded-lg bg-muted p-1">
        {(["ativos", "arquivados"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setAba(v)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              aba === v ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            {v === "ativos" ? "Ativos" : "Arquivados"}{" "}
            <span className="text-muted-foreground">({v === "ativos" ? ativos.length : arquivados.length})</span>
          </button>
        ))}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, e-mail ou telefone"
          className="pl-9 pr-9 bg-card h-11"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        {busca && (
          <button
            onClick={() => setBusca("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>


      {/* Lista */}
      {lista.length === 0 ? (
        q ? (
          <EmptyState
            icon={Search}
            title="Nenhum resultado"
            description={`Nada encontrado para "${busca}". Tente outra busca.`}
            action={<Button variant="outline" size="sm" onClick={() => setBusca("")}>Limpar busca</Button>}
          />
        ) : aba === "ativos" ? (
          <EmptyState
            icon={Users}
            title="Nenhum cliente ainda"
            description="Cadastre seu primeiro cliente para vincular receitas, despesas e cobranças."
            action={
              <Button size="sm" onClick={() => setOpen(true)}>
                <UserPlus className="h-4 w-4 mr-1" />Adicionar cliente
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Archive}
            title="Nenhum arquivado"
            description="Clientes arquivados aparecem aqui sem perder o histórico."
          />
        )
      ) : (
        <div className="space-y-2">
          {lista.map((c) => (
            <Card key={c.id} className="p-3 flex items-center gap-3 hover:border-primary/40 transition">
              <button
                onClick={() => setDetalhe(c)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                <div className="h-10 w-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-semibold shrink-0">
                  {c.nome.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.nome}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {c.tipo_pessoa} · {c.email || c.telefone || c.documento || "—"}
                  </div>
                </div>
              </button>
              <Button size="icon" variant="ghost" onClick={() => setDetalhe(c)} title="Dashboard & Relatório">
                <BarChart3 className="h-4 w-4 text-primary" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => toggleArquivar(c)}>
                {c.arquivado ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => excluir(c.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </Card>
          ))}

        </div>
      )}

      {/* Ajuda */}
      <Card className="p-4">
        <button onClick={() => setAjudaOpen((v) => !v)} className="flex w-full items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Info className="h-4 w-4" /> Como usar esta ferramenta
          </span>
          <ChevronDown className={`h-4 w-4 transition ${ajudaOpen ? "rotate-180" : ""}`} />
        </button>
        {ajudaOpen && (
          <p className="mt-3 text-sm text-muted-foreground">
            Cadastre seus clientes para vincular receitas, despesas e cobranças. Você pode arquivar quem
            não está mais ativo sem perder o histórico.
          </p>
        )}
      </Card>

      <ClienteDetalhe cliente={detalhe} open={!!detalhe} onOpenChange={(v) => !v && setDetalhe(null)} />
    </div>
  );
}
