import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { UserPlus, Inbox, Search, ChevronDown, Info, Archive, Trash2, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";

type Lead = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  origem: string | null;
  status: string;
  valor_estimado: number | null;
  observacoes: string | null;
  arquivado: boolean;
};

const ORIGENS = ["Indicação", "Instagram", "WhatsApp", "Site", "Google", "Evento", "Outros"];
const STATUS = ["novo", "contatado", "qualificado", "proposta", "ganho", "perdido"];

export default function Leads() {
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [aba, setAba] = useState<"ativos" | "arquivados">("ativos");
  const [origem, setOrigem] = useState<string>("");
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);
  const [ajuda, setAjuda] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nome: "", telefone: "", email: "", origem: "", status: "novo", valor_estimado: "", observacoes: "",
  });

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setCheckingRole(false); return; }
      const { data: role } = await (supabase as any).rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      setIsAdmin(!!role);
      setCheckingRole(false);
    })();
  }, []);


  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("leads")
      .select("id,nome,telefone,email,origem,status,valor_estimado,observacoes,arquivado")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setLeads((data ?? []) as Lead[]);
  };
  useEffect(() => { load(); }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await (supabase as any).from("leads").insert({
      user_id: user.id,
      nome: form.nome.trim(),
      telefone: form.telefone || null,
      email: form.email || null,
      origem: form.origem || null,
      status: form.status || "novo",
      valor_estimado: form.valor_estimado ? Number(form.valor_estimado) : null,
      observacoes: form.observacoes || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Lead adicionado");
    setForm({ nome: "", telefone: "", email: "", origem: "", status: "novo", valor_estimado: "", observacoes: "" });
    setOpen(false);
    load();
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir este lead?")) return;
    const { error } = await (supabase as any).from("leads").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Lead excluído");
    load();
  };
  const arquivar = async (l: Lead) => {
    const { error } = await (supabase as any).from("leads").update({ arquivado: !l.arquivado }).eq("id", l.id);
    if (error) return toast.error(error.message);
    toast.success(l.arquivado ? "Lead restaurado" : "Lead arquivado");
    load();
  };

  const q = busca.toLowerCase().trim();
  const filtered = leads
    .filter((l) => (aba === "ativos" ? !l.arquivado : l.arquivado))
    .filter((l) => (origem ? l.origem === origem : true))
    .filter((l) => !q || [l.nome, l.telefone, l.email, l.origem, l.status].filter(Boolean).some((v) => String(v).toLowerCase().includes(q)));

  const ativosCount = leads.filter((l) => !l.arquivado).length;
  const arquivCount = leads.filter((l) => l.arquivado).length;

  if (checkingRole) return <div className="text-sm text-muted-foreground">Verificando permissões…</div>;
  if (!isAdmin) return (
    <Card className="p-8 text-center border-dashed">
      <Inbox className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
      <div className="font-medium">Acesso restrito</div>
      <p className="text-sm text-muted-foreground">O módulo de Leads é exclusivo para administradores.</p>
    </Card>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-serif font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">{ativosCount} {ativosCount === 1 ? "lead ativo" : "leads ativos"}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full">
              <UserPlus className="h-4 w-4 mr-1.5" />Adicionar lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo lead</DialogTitle></DialogHeader>
            <form onSubmit={salvar} className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nome *</Label>
                <Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Origem</Label>
                  <select
                    value={form.origem}
                    onChange={(e) => setForm({ ...form, origem: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Selecione…</option>
                    {ORIGENS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Valor estimado (R$)</Label>
                <Input type="number" step="0.01" value={form.valor_estimado}
                  onChange={(e) => setForm({ ...form, valor_estimado: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </div>
              <DialogFooter><Button type="submit">Salvar lead</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex rounded-lg bg-muted p-1">
        {(["ativos", "arquivados"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setAba(v)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
              aba === v ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            {v === "ativos" ? "Ativos" : "Arquivados"}{" "}
            <span className="text-muted-foreground">({v === "ativos" ? ativosCount : arquivCount})</span>
          </button>
        ))}
      </div>

      <select
        value={origem}
        onChange={(e) => setOrigem(e.target.value)}
        className="flex h-11 w-full rounded-md border border-input bg-card px-3 text-sm"
      >
        <option value="">Todas as origens</option>
        {ORIGENS.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone, e-mail, origem, status"
          className="pl-9 h-11 bg-card"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {loading ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Carregando…</Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 border-dashed flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="font-serif font-semibold">
            {aba === "ativos" ? "Nenhum lead ativo" : "Nenhum lead arquivado"}
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            {aba === "ativos"
              ? "Adicione seu primeiro lead para começar a organizar a prospecção no funil."
              : "Leads arquivados aparecem aqui. Use para não perder contatos frios."}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((l) => (
            <Card key={l.id} className="p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-semibold shrink-0">
                {l.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{l.nome}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {[l.telefone, l.email, l.origem, l.status].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => arquivar(l)} aria-label={l.arquivado ? "Restaurar" : "Arquivar"}>
                {l.arquivado ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => excluir(l.id)} aria-label="Excluir">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-4">
        <button onClick={() => setAjuda((v) => !v)} className="flex w-full items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Info className="h-4 w-4" /> Como usar esta ferramenta
          </span>
          <ChevronDown className={`h-4 w-4 transition ${ajuda ? "rotate-180" : ""}`} />
        </button>
        {ajuda && (
          <p className="mt-3 text-sm text-muted-foreground">
            Registre contatos que ainda não são clientes. Use o status para acompanhar a evolução no funil: novo → contatado → qualificado → proposta → ganho/perdido. Ao ganhar um lead, converta-o em cliente para lançar receitas.
          </p>
        )}
      </Card>
    </div>
  );
}
