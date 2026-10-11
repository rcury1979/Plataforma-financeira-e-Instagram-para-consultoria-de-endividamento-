import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Home, Car, TrendingUp, Wallet, Package } from "lucide-react";

const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const TIPOS = [
  { v: "imovel", label: "Imóvel", icon: Home },
  { v: "veiculo", label: "Veículo", icon: Car },
  { v: "investimento", label: "Investimento", icon: TrendingUp },
  { v: "conta", label: "Conta / Reserva", icon: Wallet },
  { v: "outro", label: "Outro", icon: Package },
];

export default function PFPatrimonio() {
  const [itens, setItens] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tipo: "conta", descricao: "", valor_atual: "", instituicao: "", liquido: true });

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await (supabase as any).from("pf_patrimonio").select("*").eq("user_id", user.id).order("valor_atual", { ascending: false });
    setItens(data || []);
  };
  useEffect(() => { load(); }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await (supabase as any).from("pf_patrimonio").insert({
      user_id: user.id, tipo: form.tipo, descricao: form.descricao,
      valor_atual: Number(form.valor_atual), instituicao: form.instituicao || null,
      liquido: form.liquido,
    });
    if (error) return toast.error(error.message);
    toast.success("Adicionado");
    setForm({ tipo: "conta", descricao: "", valor_atual: "", instituicao: "", liquido: true });
    setOpen(false);
    load();
  };

  const remover = async (id: string) => {
    await (supabase as any).from("pf_patrimonio").delete().eq("id", id);
    load();
  };

  const total = itens.reduce((s, i) => s + Number(i.valor_atual), 0);
  const liquido = itens.filter(i => i.liquido).reduce((s, i) => s + Number(i.valor_atual), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif">O que é meu</h1>
          <p className="text-sm text-muted-foreground">Total: <span className="font-semibold text-foreground">{BRL(total)}</span> · Disponível: {BRL(liquido)}</p>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)}><Plus className="h-4 w-4 mr-1" /> Novo bem</Button>
      </div>

      {open && (
        <Card className="p-4">
          <form onSubmit={salvar} className="space-y-3">
            <div>
              <Label>Tipo</Label>
              <div className="grid grid-cols-5 gap-1 mt-1">
                {TIPOS.map(({ v, label, icon: Icon }) => (
                  <button key={v} type="button" onClick={() => setForm({ ...form, tipo: v })}
                    className={`flex flex-col items-center gap-1 py-2 rounded border text-[10px] ${form.tipo === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div><Label>Descrição</Label><Input required value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor atual</Label><Input type="number" step="0.01" required value={form.valor_atual} onChange={e => setForm({ ...form, valor_atual: e.target.value })} /></div>
              <div><Label>Instituição</Label><Input value={form.instituicao} onChange={e => setForm({ ...form, instituicao: e.target.value })} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.liquido} onChange={e => setForm({ ...form, liquido: e.target.checked })} />
              Ativo líquido (disponível para uso)
            </label>
            <Button type="submit" className="w-full">Salvar</Button>
          </form>
        </Card>
      )}

      {itens.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground text-center">Você tem mais do que imagina. Comece cadastrando seus bens, reservas e investimentos.</Card>
      ) : (
        <div className="space-y-2">
          {itens.map((p) => {
            const Icon = TIPOS.find(t => t.v === p.tipo)?.icon || Package;
            return (
              <Card key={p.id} className="p-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.descricao}</div>
                  <div className="text-[11px] text-muted-foreground">{p.instituicao || TIPOS.find(t => t.v === p.tipo)?.label}</div>
                </div>
                <div className="text-sm font-semibold">{BRL(Number(p.valor_atual))}</div>
                <button onClick={() => remover(p.id)} className="text-muted-foreground hover:text-destructive p-1">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
