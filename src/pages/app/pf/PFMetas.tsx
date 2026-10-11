import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Target, Check } from "lucide-react";

const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function PFMetas() {
  const [itens, setItens] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", categoria: "", valor_alvo: "", valor_atual: "0", prazo: "" });

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await (supabase as any).from("pf_metas_pessoais").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setItens(data || []);
  };
  useEffect(() => { load(); }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await (supabase as any).from("pf_metas_pessoais").insert({
      user_id: user.id,
      titulo: form.titulo, categoria: form.categoria || null,
      valor_alvo: Number(form.valor_alvo), valor_atual: Number(form.valor_atual || 0),
      prazo: form.prazo || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Meta criada!");
    setForm({ titulo: "", categoria: "", valor_alvo: "", valor_atual: "0", prazo: "" });
    setOpen(false);
    load();
  };

  const aportar = async (id: string, atual: number, alvo: number) => {
    const v = prompt("Quanto você guardou agora?");
    if (!v) return;
    const novo = atual + Number(v);
    const concluida = novo >= alvo;
    await (supabase as any).from("pf_metas_pessoais").update({ valor_atual: novo, concluida }).eq("id", id);
    if (concluida) toast.success("Meta atingida! 🎉");
    load();
  };
  const remover = async (id: string) => {
    await (supabase as any).from("pf_metas_pessoais").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif">Meus sonhos</h1>
          <p className="text-sm text-muted-foreground">{itens.length === 0 ? "Sonho sem meta é só desejo — vamos plantar o primeiro." : `${itens.length} sonho${itens.length > 1 ? "s" : ""} em construção`}</p>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}><Plus className="h-4 w-4 mr-1" /> Novo sonho</Button>
      </div>

      {open && (
        <Card className="p-4">
          <form onSubmit={salvar} className="space-y-3">
            <div><Label>Título</Label><Input required placeholder="Ex.: Reserva de emergência" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} /></div>
            <div><Label>Categoria</Label><Input placeholder="Reserva / Viagem / Casa..." value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor alvo</Label><Input type="number" step="0.01" required value={form.valor_alvo} onChange={e => setForm({ ...form, valor_alvo: e.target.value })} /></div>
              <div><Label>Já guardado</Label><Input type="number" step="0.01" value={form.valor_atual} onChange={e => setForm({ ...form, valor_atual: e.target.value })} /></div>
            </div>
            <div><Label>Prazo</Label><Input type="date" value={form.prazo} onChange={e => setForm({ ...form, prazo: e.target.value })} /></div>
            <Button type="submit" className="w-full">Salvar meta</Button>
          </form>
        </Card>
      )}

      {itens.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground text-center">
          <Target className="h-8 w-8 mx-auto mb-2 text-primary/60" />
          <p>Qual sonho faz seus olhos brilharem?</p>
          <p className="text-xs mt-1">Escreva ele aqui — o universo (e seu bolso) se organiza melhor com nome e prazo.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {itens.map((m) => {
            const pct = Math.min(100, (Number(m.valor_atual) / Number(m.valor_alvo)) * 100);
            return (
              <Card key={m.id} className={`p-3 ${m.concluida ? "border-emerald-500/40 bg-emerald-500/5" : ""}`}>
                <div className="flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold flex items-center gap-1">
                      {m.concluida && <Check className="h-3.5 w-3.5 text-emerald-500" />} {m.titulo}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {m.categoria || "Geral"}{m.prazo ? ` · até ${new Date(m.prazo).toLocaleDateString("pt-BR")}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">{pct.toFixed(0)}%</div>
                    <div className="text-sm font-semibold">{BRL(Number(m.valor_atual))}</div>
                    <div className="text-[10px] text-muted-foreground">de {BRL(Number(m.valor_alvo))}</div>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                  <div className={`h-full ${m.concluida ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                </div>
                {!m.concluida && (
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => aportar(m.id, Number(m.valor_atual), Number(m.valor_alvo))}>
                      + Aportar
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => remover(m.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
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
