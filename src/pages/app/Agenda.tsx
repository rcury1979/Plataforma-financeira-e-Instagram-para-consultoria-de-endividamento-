import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Link2, Copy, CalendarDays, Check, X, Phone } from "lucide-react";

type Ag = {
  id: string;
  nome_contato: string;
  telefone: string | null;
  email: string | null;
  assunto: string | null;
  inicio: string;
  duracao_min: number;
  status: string;
  origem: string;
  observacoes: string | null;
  user_id: string | null;
  cliente_id: string | null;
};

type ClienteOption = { id: string; nome: string; telefone: string | null; email: string | null };

const STATUS_LABEL: Record<string, string> = {
  solicitado: "Aguardando confirmação",
  confirmado: "Confirmado",
  realizado: "Realizado",
  cancelado: "Cancelado",
};

export default function Agenda() {
  const [itens, setItens] = useState<Ag[]>([]);
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome_contato: "", telefone: "", email: "", assunto: "", inicio: "", duracao_min: "60", observacoes: "", cliente_id: "sem-cliente" });

  const linkPublico = `${window.location.origin}/agendar`;

  const load = async () => {
    setLoading(true);
    const [agendaResult, clientesResult] = await Promise.all([
      (supabase as any).from("agendamentos").select("id,nome_contato,telefone,email,assunto,inicio,duracao_min,status,origem,observacoes,user_id,cliente_id").order("inicio", { ascending: true }),
      supabase.from("clientes").select("id,nome,telefone,email").eq("arquivado", false).order("nome"),
    ]);
    setItens((agendaResult.data ?? []) as Ag[]);
    setClientes((clientesResult.data ?? []) as ClienteOption[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await (supabase as any).from("agendamentos").insert({
      user_id: user.id,
      nome_contato: form.nome_contato.trim(),
      telefone: form.telefone || null,
      email: form.email || null,
      assunto: form.assunto || null,
      inicio: new Date(form.inicio).toISOString(),
      duracao_min: Number(form.duracao_min) || 60,
      status: "confirmado",
      origem: "interno",
      observacoes: form.observacoes || null,
      cliente_id: form.cliente_id === "sem-cliente" ? null : form.cliente_id,
    });
    if (error) return toast.error(error.message);
    toast.success("Atendimento agendado");
    if (form.cliente_id !== "sem-cliente") {
      await (supabase as any).from("cliente_eventos").insert({ user_id: user.id, cliente_id: form.cliente_id, tipo: "reuniao", titulo: "Atendimento agendado", descricao: form.assunto || "Atendimento financeiro", ocorrido_em: new Date(form.inicio).toISOString() });
    }
    setForm({ nome_contato: "", telefone: "", email: "", assunto: "", inicio: "", duracao_min: "60", observacoes: "", cliente_id: "sem-cliente" });
    setOpen(false);
    load();
  };

  const mudarStatus = async (ag: Ag, status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const patch: Record<string, unknown> = { status };
    if (!ag.user_id && user) patch.user_id = user.id;
    const { error } = await (supabase as any).from("agendamentos").update(patch).eq("id", ag.id);
    if (error) return toast.error(error.message);
    load();
  };

  const { proximos, passados, solicitados } = useMemo(() => {
    const agora = Date.now();
    return {
      solicitados: itens.filter((i) => i.status === "solicitado"),
      proximos: itens.filter((i) => i.status !== "solicitado" && new Date(i.inicio).getTime() >= agora),
      passados: itens.filter((i) => i.status !== "solicitado" && new Date(i.inicio).getTime() < agora).reverse(),
    };
  }, [itens]);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  const Linha = ({ ag, acoes }: { ag: Ag; acoes?: boolean }) => (
    <div className="rounded-lg border border-border p-3">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{ag.nome_contato}</p>
          <p className="text-[11px] text-muted-foreground">
            {fmt(ag.inicio)} · {ag.duracao_min} min · {STATUS_LABEL[ag.status] ?? ag.status}
          </p>
          {ag.assunto && <p className="text-xs mt-1 text-foreground/80">{ag.assunto}</p>}
          {ag.telefone && <p className="text-[11px] text-muted-foreground">{ag.telefone}</p>}
        </div>
        {ag.telefone && (
          <Button asChild size="sm" variant="ghost" className="h-7 shrink-0">
            <a href={`https://wa.me/55${ag.telefone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
              <Phone className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
      </div>
      {acoes && (
        <div className="flex gap-1 mt-2">
          {ag.status === "solicitado" && (
            <Button size="sm" className="h-7 text-xs" onClick={() => mudarStatus(ag, "confirmado")}>
              <Check className="h-3 w-3 mr-1" /> Confirmar
            </Button>
          )}
          {ag.status === "confirmado" && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => mudarStatus(ag, "realizado")}>
              Marcar como realizado
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive ml-auto" onClick={() => mudarStatus(ag, "cancelado")}>
            <X className="h-3 w-3 mr-1" /> Cancelar
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif">Agenda de atendimentos</h1>
          <p className="text-sm text-muted-foreground">Mentorias, diagnósticos e retornos em um só lugar.</p>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}><Plus className="h-4 w-4 mr-1" /> Novo</Button>
      </div>

      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Link2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Link público de agendamento</p>
            <p className="text-xs text-muted-foreground break-all">{linkPublico}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(linkPublico); toast.success("Link copiado"); }}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>

      {loading ? (
        <Card className="p-6 text-sm text-muted-foreground text-center">Carregando…</Card>
      ) : (
        <>
          {solicitados.length > 0 && (
            <Card className="p-3">
              <p className="text-sm font-semibold mb-2">Pedidos aguardando você ({solicitados.length})</p>
              <div className="space-y-2">{solicitados.map((a) => <Linha key={a.id} ag={a} acoes />)}</div>
            </Card>
          )}

          <Card className="p-3">
            <p className="text-sm font-semibold mb-2 flex items-center gap-1">
              <CalendarDays className="h-4 w-4 text-primary" /> Próximos
            </p>
            {proximos.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum atendimento marcado.</p>
            ) : (
              <div className="space-y-2">{proximos.map((a) => <Linha key={a.id} ag={a} acoes />)}</div>
            )}
          </Card>

          {passados.length > 0 && (
            <Card className="p-3">
              <p className="text-sm font-semibold mb-2">Histórico</p>
              <div className="space-y-2">{passados.slice(0, 20).map((a) => <Linha key={a.id} ag={a} />)}</div>
            </Card>
          )}
        </>
      )}

      {open && (
        <Card className="p-4">
          <form onSubmit={salvar} className="space-y-3">
            <div><Label>Cliente</Label><select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.cliente_id} onChange={(e) => { const cliente = clientes.find((c) => c.id === e.target.value); setForm({ ...form, cliente_id: e.target.value, nome_contato: cliente?.nome ?? form.nome_contato, telefone: cliente?.telefone ?? form.telefone, email: cliente?.email ?? form.email }); }}><option value="sem-cliente">Sem cliente vinculado</option>{clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}</select></div>
            <div><Label>Nome</Label><Input required value={form.nome_contato} onChange={(e) => setForm({ ...form, nome_contato: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>WhatsApp</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
              <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data e hora</Label><Input type="datetime-local" required value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} /></div>
              <div><Label>Duração (min)</Label><Input type="number" min="15" step="15" value={form.duracao_min} onChange={(e) => setForm({ ...form, duracao_min: e.target.value })} /></div>
            </div>
            <div><Label>Assunto</Label><Input value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })} /></div>
            <div><Label>Observações</Label><Textarea rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
            <Button type="submit" className="w-full">Salvar atendimento</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
