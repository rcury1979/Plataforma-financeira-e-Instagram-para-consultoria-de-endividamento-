import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Sparkles, Target, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

const BRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const STORAGE_KEY = "aurea:pf-onboarded";

export function isPFOnboarded() {
  return typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
}

export default function PFOnboarding({ nome, onClose }: { nome?: string; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [dados, setDados] = useState({
    renda: "",
    divida: "",
    sonho: "",
    valor_sonho: "",
    prazo_meses: "12",
  });
  const [saving, setSaving] = useState(false);

  const primeiroNome = (nome || "").trim().split(" ")[0] || "amigo(a)";

  const finalizar = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Cria a primeira meta a partir do sonho
      if (dados.sonho && Number(dados.valor_sonho) > 0) {
        const prazo = new Date();
        prazo.setMonth(prazo.getMonth() + Number(dados.prazo_meses || 12));
        await (supabase as any).from("pf_metas_pessoais").insert({
          user_id: user.id,
          titulo: dados.sonho,
          categoria: "Sonho",
          valor_alvo: Number(dados.valor_sonho),
          valor_atual: 0,
          prazo: prazo.toISOString().slice(0, 10),
        });
      }

      // Registra a dívida inicial (se informou)
      if (Number(dados.divida) > 0) {
        await (supabase as any).from("pf_dividas").insert({
          user_id: user.id,
          credor: "Dívidas gerais (a detalhar)",
          valor_total: Number(dados.divida),
          valor_pago: 0,
        });
      }

      localStorage.setItem(STORAGE_KEY, "1");
      toast.success("Seu plano começou! 💛");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const pular = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    onClose();
  };

  const rendaN = Number(dados.renda) || 0;
  const dividaN = Number(dados.divida) || 0;
  const sonhoN = Number(dados.valor_sonho) || 0;
  const guardarMes = sonhoN > 0 ? sonhoN / Math.max(1, Number(dados.prazo_meses || 12)) : 0;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Progresso */}
          <div className="flex justify-center gap-2 mb-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i <= step ? "w-8 gradient-warm" : "w-4 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Passo 0 — Acolhimento */}
          {step === 0 && (
            <div className="text-center space-y-5 animate-in fade-in duration-500">
              <div className="mx-auto w-16 h-16 rounded-full gradient-warm grid place-items-center shadow-warm">
                <Heart className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-serif text-3xl">Respira, {primeiroNome}.</h1>
                <p className="text-muted-foreground mt-3 leading-relaxed">
                  Você deu o passo mais difícil: <span className="text-foreground font-medium">olhar para o dinheiro de frente</span>.
                  A partir de agora, você não caminha sozinho(a).
                </p>
              </div>
              <div className="bg-card border rounded-2xl p-5 text-sm text-left">
                <p className="text-muted-foreground italic">
                  "Não existe dívida grande demais quando existe um plano claro e uma decisão firme.
                  Vamos juntos, um mês de cada vez."
                </p>
                <p className="text-xs mt-2 text-primary">— Marta Cury</p>
              </div>
              <Button size="lg" className="w-full rounded-full gradient-warm text-primary-foreground border-0 shadow-warm" onClick={() => setStep(1)}>
                Vamos começar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <button className="text-xs text-muted-foreground underline" onClick={pular}>
                Prefiro pular e explorar sozinho(a)
              </button>
            </div>
          )}

          {/* Passo 1 — Renda */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <div>
                <h1 className="font-serif text-2xl">Quanto entra por mês?</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Some tudo que você recebe todo mês (salário, freelas, aluguel recebido…). Sem julgamento — é só a foto de hoje.
                </p>
              </div>
              <div>
                <Label>Renda mensal</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  className="text-lg h-12"
                  value={dados.renda}
                  onChange={(e) => setDados({ ...dados, renda: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(0)} className="flex-1">Voltar</Button>
                <Button className="flex-1 gradient-warm text-primary-foreground border-0" onClick={() => setStep(2)}>
                  Continuar <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Passo 2 — Dívidas */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <div>
                <h1 className="font-serif text-2xl">Quanto você deve hoje?</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Uma estimativa total. Se não sabe exato, chute — depois a gente detalha cartão por cartão, empréstimo por empréstimo.
                  <span className="block mt-2 text-foreground">Escrever é o primeiro passo pra tirar do peito.</span>
                </p>
              </div>
              <div>
                <Label>Total de dívidas</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00 (se não tem, deixe zero)"
                  className="text-lg h-12"
                  value={dados.divida}
                  onChange={(e) => setDados({ ...dados, divida: e.target.value })}
                  autoFocus
                />
              </div>
              {dividaN > 0 && rendaN > 0 && (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm">
                  <p className="text-foreground">
                    Comprometendo <span className="font-semibold text-primary">10% da sua renda</span> ({BRL(rendaN * 0.1)}/mês),
                    você quita tudo em aproximadamente{" "}
                    <span className="font-semibold">{Math.ceil(dividaN / (rendaN * 0.1))} meses</span>.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Não desanima — é só um cenário. Vamos afinar juntos.</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">Voltar</Button>
                <Button className="flex-1 gradient-warm text-primary-foreground border-0" onClick={() => setStep(3)}>
                  Continuar <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Passo 3 — Sonho */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <div>
                <div className="w-12 h-12 rounded-2xl gradient-warm grid place-items-center mb-3">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <h1 className="font-serif text-2xl">Qual é o seu sonho?</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Sair da dívida é o começo. Mas você merece muito mais que isso. O que você quer conquistar?
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Meu sonho</Label>
                  <Input
                    placeholder="Ex.: Reserva de emergência, casa própria, viagem…"
                    className="h-12"
                    value={dados.sonho}
                    onChange={(e) => setDados({ ...dados, sonho: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={dados.valor_sonho}
                      onChange={(e) => setDados({ ...dados, valor_sonho: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Em quantos meses?</Label>
                    <Input
                      type="number"
                      value={dados.prazo_meses}
                      onChange={(e) => setDados({ ...dados, prazo_meses: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              {guardarMes > 0 && (
                <div className="rounded-xl gradient-warm p-4 text-primary-foreground text-sm">
                  Guardando <span className="font-bold">{BRL(guardarMes)}</span> por mês,
                  em {dados.prazo_meses} meses você realiza: <span className="font-semibold">{dados.sonho}</span> 💛
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">Voltar</Button>
                <Button className="flex-1 gradient-warm text-primary-foreground border-0" onClick={() => setStep(4)}>
                  Ver meu plano <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Passo 4 — Plano gerado */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-500">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full gradient-warm grid place-items-center shadow-warm">
                  <Target className="h-8 w-8 text-primary-foreground" />
                </div>
                <h1 className="font-serif text-2xl mt-4">Seu plano está pronto, {primeiroNome}!</h1>
                <p className="text-sm text-muted-foreground mt-1">Um dia de cada vez. Vamos juntos.</p>
              </div>
              <div className="space-y-3">
                {rendaN > 0 && (
                  <div className="bg-card border rounded-xl p-4 flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Sua renda: {BRL(rendaN)}/mês</div>
                      <div className="text-muted-foreground text-xs">É com ela que a gente constrói tudo.</div>
                    </div>
                  </div>
                )}
                {dividaN > 0 && (
                  <div className="bg-card border rounded-xl p-4 flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Plano de libertação: {BRL(dividaN)} a quitar</div>
                      <div className="text-muted-foreground text-xs">Detalhe cada dívida em "Dívidas" pra acompanhar de perto.</div>
                    </div>
                  </div>
                )}
                {dados.sonho && sonhoN > 0 && (
                  <div className="bg-card border rounded-xl p-4 flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Meta criada: {dados.sonho}</div>
                      <div className="text-muted-foreground text-xs">
                        {BRL(guardarMes)}/mês por {dados.prazo_meses} meses.
                      </div>
                    </div>
                  </div>
                )}
                <div className="bg-card border rounded-xl p-4 flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <div className="font-medium">Próximo passo</div>
                    <div className="text-muted-foreground text-xs">
                      Comece registrando seus gastos do mês em "Lançar". Sem julgamento, só verdade.
                    </div>
                  </div>
                </div>
              </div>
              <Button
                size="lg"
                className="w-full rounded-full gradient-warm text-primary-foreground border-0 shadow-warm"
                disabled={saving}
                onClick={finalizar}
              >
                {saving ? "Salvando..." : "Começar minha jornada 💛"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
