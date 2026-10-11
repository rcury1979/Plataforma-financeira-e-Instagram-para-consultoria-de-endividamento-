import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Inbox, Link2, Phone, CalendarClock, ArrowRight, Copy, Trash2 } from "lucide-react";

const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ETAPAS = [
  { key: "novo", label: "Novo contato" },
  { key: "conversa", label: "Em conversa" },
  { key: "diagnostico", label: "Diagnóstico" },
  { key: "proposta", label: "Proposta" },
  { key: "cliente", label: "Virou cliente" },
] as const;

type Lead = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  origem: string | null;
  etapa: string;
  valor_estimado: number | null;
  proximo_contato: string | null;
  observacoes: string | null;
};

type Captacao = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  tipo_pessoa: string | null;
  mensagem: string | null;
  processado: boolean;
  created_at: string;
};

export default function Crm() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [entradas, setEntradas] = useState<Captacao[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", origem: "", valor_estimado: "", proximo_contato: "" });

  const linkPublico = `${window.location.origin}/quero-ajuda`;

  const load = async () => {
    setLoading(true);
    const [l, c] = await Promise.all([
      (supabase as any).from("leads").select("id,nome,telefone,email,origem,etapa,valor_estimado,proximo_contato,observacoes").eq("arquivado", false).order("created_at", { ascending: false }),
      (supabase as any).from("captacao_publica").select("id,nome,telefone,email,tipo_pessoa,mensagem,processado,created_at").eq("processado", false).order("created_at", { ascending: false }),
    ]);
    setLeads((l.data ?? []) as Lead[]);
    setEntradas((c.data ?? []) as Captacao[]);
    setLoading(false);
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
      etapa: "novo",
      status: "novo",
      valor_estimado: form.valor_estimado ? Number(form.valor_estimado) : null,
      proximo_contato: form.proximo_contato || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Contato adicionado ao funil");
    setForm({ nome: "", telefone: "", email: "", origem: "", valor_estimado: "", proximo_contato: "" });
    setOpen(false);
    load();
  };

  const mover = async (lead: Lead, direcao: 1 | -1) => {
    const idx = ETAPAS.findIndex((e) => e.key === lead.etapa);
    const novo = ETAPAS[Math.min(ETAPAS.length - 1, Math.max(0, idx + direcao))];
    if (!novo || novo.key === lead.etapa) return;
    const { error } = await (supabase as any).from("leads").update({ etapa: novo.key }).eq("id", lead.id);
    if (error) return toast.error(error.message);
    load();
  };

  const excluir = async (id: string) => {
    if (!confirm("Remover este contato do funil?")) return;
    await (supabase as any).from("leads").update({ arquivado: true }).eq("id", id);
    load();
  };

  const importar = async (c: Captacao) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await (supabase as any).from("leads").insert({
      user_id: user.id,
      nome: c.nome,
      telefone: c.telefone,
      email: c.email,
      origem: "Página pública",
      etapa: "novo",
      status: "novo",
      observacoes: [c.tipo_pessoa ? `Perfil: ${c.tipo_pessoa}` : null, c.mensagem].filter(Boolean).join(" · ") || null,
    });
    if (error) return toast.error(error.message);
    await (supabase as any).from("captacao_publica").update({ processado: true }).eq("id", c.id);
    toast.success("Contato trazido para o funil");
    load();
  };

  const porEtapa = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const e of ETAPAS) map[e.key] = [];
    for (const l of leads) (map[l.etapa] ?? map.novo).push(l);
    return map;
  }, [leads]);

  const totalPrevisto = leads
    .filter((l) => l.etapa !== "cliente")
    .reduce((s, l) => s + Number(l.valor_estimado ?? 0), 0);

  const atrasados = leads.filter((l) => l.proximo_contato && new Date(l.proximo_contato) < new Date(new Date().toDateString()));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif">Funil de captação</h1>
          <p className="text-sm text-muted-foreground">
            Quem procurou você não pode ficar no bloco de notas. {leads.length === 0 ? "Comece pelo primeiro contato." : `${leads.length} pessoas no funil · ${BRL(totalPrevisto)} previstos`}
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}><Plus className="h-4 w-4 mr-1" /> Novo contato</Button>
      </div>

      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Link2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Seu link de captação</p>
            <p className="text-xs text-muted-foreground break-all">{linkPublico}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Coloque na bio do Instagram — quem preencher cai direto aqui.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(linkPublico); toast.success("Link copiado"); }}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>

      {atrasados.length > 0 && (
        <Card className="p-4 border-amber-500/40 bg-amber-500/5">
          <div className="flex gap-3 text-sm">
            <CalendarClock className="h-5 w-5 text-amber-500 shrink-0" />
            <p>
              <strong>{atrasados.length === 1 ? "1 contato está esperando" : `${atrasados.length} contatos estão esperando`}</strong> retorno seu:{" "}
              {atrasados.map((l) => l.nome).join(", ")}.
            </p>
          </div>
        </Card>
      )}

      {entradas.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Inbox className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Chegaram pela página pública ({entradas.length})</p>
          </div>
          <div className="space-y-2">
            {entradas.map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{c.nome}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {[c.telefone, c.email, c.tipo_pessoa].filter(Boolean).join(" · ")}
                  </p>
                  {c.mensagem && <p className="text-xs mt-1 text-foreground/80">{c.mensagem}</p>}
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs shrink-0" onClick={() => importar(c)}>
                  Trazer ao funil
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {open && (
        <Card className="p-4">
          <form onSubmit={salvar} className="space-y-3">
            <div><Label>Nome</Label><Input required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>WhatsApp</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
              <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor previsto</Label><Input type="number" step="0.01" value={form.valor_estimado} onChange={(e) => setForm({ ...form, valor_estimado: e.target.value })} /></div>
              <div><Label>Próximo contato</Label><Input type="date" value={form.proximo_contato} onChange={(e) => setForm({ ...form, proximo_contato: e.target.value })} /></div>
            </div>
            <div><Label>Origem</Label><Input placeholder="Instagram, indicação, palestra…" value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} /></div>
            <Button type="submit" className="w-full">Salvar contato</Button>
          </form>
        </Card>
      )}

      {loading ? (
        <Card className="p-6 text-sm text-muted-foreground text-center">Carregando…</Card>
      ) : (
        <div className="space-y-3">
          {ETAPAS.map((etapa) => {
            const itens = porEtapa[etapa.key] ?? [];
            return (
              <Card key={etapa.key} className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">{etapa.label}</p>
                  <span className="text-[11px] text-muted-foreground">{itens.length}</span>
                </div>
                {itens.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Ninguém nesta etapa.</p>
                ) : (
                  <div className="space-y-2">
                    {itens.map((l) => (
                      <div key={l.id} className="rounded-lg border border-border p-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{l.nome}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {[l.origem, l.telefone].filter(Boolean).join(" · ") || "Sem origem informada"}
                            </p>
                            {l.proximo_contato && (
                              <p className="text-[11px] text-muted-foreground">
                                Próximo contato: {new Date(l.proximo_contato).toLocaleDateString("pt-BR")}
                              </p>
                            )}
                          </div>
                          {l.valor_estimado != null && (
                            <span className="text-sm font-semibold tabular-nums shrink-0">{BRL(Number(l.valor_estimado))}</span>
                          )}
                        </div>
                        <div className="flex gap-1 mt-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => mover(l, -1)}>Voltar</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => mover(l, 1)}>
                            Avançar <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                          {l.telefone && (
                            <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                              <a href={`https://wa.me/55${l.telefone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                                <Phone className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive ml-auto" onClick={() => excluir(l.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
