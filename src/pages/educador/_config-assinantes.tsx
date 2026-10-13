/* Configurações da educadora → Assinantes: quem paga o app e as cortesias liberadas pela administradora. */
import { useCallback, useEffect, useState } from "react";
import { CreditCard, Gift, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { db, Field, inputCls, Pill } from "../cliente/_shared";
import { ROTULO_STATUS } from "@/lib/acesso";

type Perfil = { user_id: string; full_name: string | null; email: string | null };
type Sub = { user_id: string; status: string; contrato_meses: number | null; current_period_end: string | null; fidelidade_ate: string | null; cancel_at_period_end: boolean | null; environment: string };
type Cortesia = { user_id: string; motivo: string | null; valido_ate: string | null; created_at: string };

const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");
const card = "rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_hsl(222_47%_14%/0.06)] sm:p-6";

export function Assinantes() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [cortesias, setCortesias] = useState<Cortesia[]>([]);
  const [perfis, setPerfis] = useState<Record<string, Perfil>>({});
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [validade, setValidade] = useState("");
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    const [s, c] = await Promise.all([
      db.from("subscriptions").select("user_id,status,contrato_meses,current_period_end,fidelidade_ate,cancel_at_period_end,environment").order("created_at", { ascending: false }),
      db.from("acessos_cortesia").select("user_id,motivo,valido_ate,created_at").order("created_at", { ascending: false }),
    ]);
    const ss = (s.data ?? []) as Sub[];
    const cc = (c.data ?? []) as Cortesia[];
    const ids = [...new Set([...ss.map((x) => x.user_id), ...cc.map((x) => x.user_id)])];
    const p = ids.length ? await db.from("profiles").select("user_id,full_name,email").in("user_id", ids) : { data: [] };
    setPerfis(Object.fromEntries(((p.data ?? []) as Perfil[]).map((x) => [x.user_id, x])));
    setSubs(ss);
    setCortesias(cc);
    setLoading(false);
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  const nome = (id: string) => perfis[id]?.full_name || perfis[id]?.email || "Usuário";

  async function liberar(e: React.FormEvent) {
    e.preventDefault();
    const alvo = email.trim().toLowerCase();
    if (!alvo) return;
    setSalvando(true);
    const { data: p } = await db.from("profiles").select("user_id").ilike("email", alvo).maybeSingle();
    if (!p?.user_id) {
      setSalvando(false);
      return toast.error("Não encontramos uma conta com esse e-mail. Peça para a pessoa criar a conta no site primeiro.");
    }
    const { error } = await db.from("acessos_cortesia").upsert({
      user_id: p.user_id,
      motivo: motivo.trim() || null,
      valido_ate: validade ? new Date(`${validade}T23:59:59`).toISOString() : null,
    });
    setSalvando(false);
    if (error) return toast.error("Não foi possível liberar o acesso.");
    toast.success("Acesso liberado.");
    setEmail(""); setValidade(""); setMotivo("");
    void carregar();
  }

  async function remover(userId: string) {
    const { error } = await db.from("acessos_cortesia").delete().eq("user_id", userId);
    if (error) return toast.error("Não foi possível remover.");
    toast.success("Cortesia removida.");
    void carregar();
  }

  if (loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  const ativos = subs.filter((s) => ["active", "trialing", "past_due"].includes(s.status));
  const receitaMes = ativos.filter((s) => s.status === "active").reduce((t, s) => t + (s.contrato_meses === 6 ? 25.99 : 21.99), 0);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className={card}>
        <h2 className="mb-1 flex items-center gap-2 text-[15px] font-semibold text-foreground"><CreditCard className="h-4 w-4 text-gold" /> Assinantes do app</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {ativos.length} {ativos.length === 1 ? "assinatura ativa" : "assinaturas ativas"} ·{" "}
          {receitaMes.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês em mensalidades pagas
        </p>
        {subs.length === 0 ? (
          <p className="rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">Ainda não há assinantes. Eles aparecem aqui automaticamente quando assinam pelo site.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {subs.map((s, i) => (
              <li key={i} className="flex items-start justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">{nome(s.user_id)}</span>
                  <span className="block text-xs text-muted-foreground">
                    {s.contrato_meses ? `Contrato ${s.contrato_meses} meses` : "Assinatura"}
                    {s.fidelidade_ate && ` · até ${data(s.fidelidade_ate)}`}
                    {s.environment === "sandbox" && " · teste"}
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs">
                  <span className={`block font-semibold ${s.status === "active" || s.status === "trialing" ? "text-success" : s.status === "past_due" ? "text-destructive" : "text-muted-foreground"}`}>
                    {ROTULO_STATUS[s.status] ?? s.status}{s.cancel_at_period_end ? " (cancela)" : ""}
                  </span>
                  <span className="text-muted-foreground">{data(s.current_period_end)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card}>
        <h2 className="mb-1 flex items-center gap-2 text-[15px] font-semibold text-foreground"><Gift className="h-4 w-4 text-gold" /> Liberar acesso de cortesia</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Para parceiros, sorteios ou casos especiais. Clientes da mentoria não precisam: o convite em Clientes já libera o app.
        </p>
        <form onSubmit={liberar} className="space-y-3">
          <Field label="E-mail da conta">
            <input type="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@email.com" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Válido até" hint="Em branco = sem prazo">
              <input type="date" className={inputCls} value={validade} onChange={(e) => setValidade(e.target.value)} />
            </Field>
            <Field label="Motivo">
              <input className={inputCls} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: parceria" />
            </Field>
          </div>
          <Pill variant="solid" type="submit" disabled={salvando}>
            {salvando && <Loader2 className="h-4 w-4 animate-spin" />} Liberar acesso
          </Pill>
        </form>

        {cortesias.length > 0 && (
          <ul className="mt-5 divide-y divide-border border-t border-border text-sm">
            {cortesias.map((c) => {
              const vencida = !!c.valido_ate && new Date(c.valido_ate).getTime() < Date.now();
              return (
                <li key={c.user_id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground">{nome(c.user_id)}</span>
                    <span className={`block text-xs ${vencida ? "text-destructive" : "text-muted-foreground"}`}>
                      {c.motivo ? `${c.motivo} · ` : ""}{c.valido_ate ? `${vencida ? "venceu em" : "até"} ${data(c.valido_ate)}` : "sem prazo"}
                    </span>
                  </span>
                  <button type="button" onClick={() => remover(c.user_id)} aria-label={`Remover cortesia de ${nome(c.user_id)}`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
