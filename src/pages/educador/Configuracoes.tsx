/* Configurações da educadora: Minha conta, Assinatura, Notificações e Categorias padrão. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CreditCard, Info, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { db, fmtDate, PageHeader, Pill, useUserId } from "../cliente/_shared";
import { lsGet, lsSet, MinhaConta } from "./_config-conta";
import { CategoriasPadrao } from "./_config-categorias";

type Aba = "conta" | "assinatura" | "notificacoes" | "categorias";
const ABAS: [Aba, string][] = [
  ["conta", "Minha conta"], ["assinatura", "Assinatura"], ["notificacoes", "Notificações"], ["categorias", "Categorias padrão"],
];

export default function EduConfiguracoes() {
  const eduId = useUserId();
  const [aba, setAba] = useState<Aba>("conta");

  return (
    <div>
      <PageHeader title="Configurações" desc="Dados da sua conta, perfil de acesso e informações do plano contratado." />

      <div className="mb-6 grid grid-cols-2 gap-1 rounded-3xl bg-secondary p-1 sm:grid-cols-4 sm:rounded-full" role="tablist">
        {ABAS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={aba === k}
            onClick={() => setAba(k)}
            className={`h-10 rounded-full px-2 text-sm transition ${aba === k ? "bg-card font-semibold text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {!eduId ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : aba === "conta" ? (
        <MinhaConta eduId={eduId} />
      ) : aba === "assinatura" ? (
        <Assinatura eduId={eduId} />
      ) : aba === "notificacoes" ? (
        <Notificacoes eduId={eduId} />
      ) : (
        <CategoriasPadrao eduId={eduId} />
      )}
    </div>
  );
}

/* ---------- Assinatura ---------- */
const PLANOS: Record<string, { nome: string; limite: number }> = {
  trial: { nome: "Período de teste", limite: 7 },
  basic: { nome: "Basic", limite: 10 },
  professional: { nome: "Professional", limite: 30 },
  premium: { nome: "Premium", limite: 100 },
};

function Assinatura({ eduId }: { eduId: string }) {
  const navigate = useNavigate();
  const [plano, setPlano] = useState<string>("trial");
  const [trialEnds, setTrialEnds] = useState<string | null>(null);
  const [nClientes, setNClientes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [p, c] = await Promise.all([
        db.from("profiles").select("plano, trial_ends_at").eq("user_id", eduId).maybeSingle(),
        db.from("clientes").select("id, arquivado").eq("user_id", eduId),
      ]);
      setPlano(p.data?.plano || "trial");
      setTrialEnds(p.data?.trial_ends_at ?? null);
      setNClientes((c.data ?? []).filter((x: any) => !x.arquivado).length);
      setLoading(false);
    })();
  }, [eduId]);

  const info = PLANOS[plano] ?? { nome: plano, limite: PLANOS.trial.limite };
  const dias = trialEnds ? Math.ceil((new Date(trialEnds).getTime() - Date.now()) / 864e5) : null;
  const pct = Math.min(100, Math.round((nClientes / info.limite) * 100));

  if (loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_hsl(222_47%_14%/0.06)] sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-foreground"><CreditCard className="h-4 w-4 text-gold" /> Plano atual</h2>
        <p className="font-display text-3xl text-primary">{info.nome}</p>
        {plano === "trial" && dias !== null && (
          <p className={`mt-2 text-sm ${dias <= 2 ? "font-medium text-destructive" : "text-muted-foreground"}`}>
            {dias > 0 ? `Faltam ${dias} ${dias === 1 ? "dia" : "dias"} de teste (até ${fmtDate(trialEnds!)}).` : "Seu período de teste terminou."}
          </p>
        )}
        <p className="mt-3 text-sm text-muted-foreground">
          {plano === "trial"
            ? "Aproveite o teste para cadastrar seus clientes e conhecer o Método GCPM no app. Depois, escolha o plano que cabe no seu momento."
            : "Obrigada por confiar no R&M 360°. Você pode mudar de plano quando quiser."}
        </p>
        <Pill variant="solid" className="mt-5" onClick={() => navigate("/planos")}>Ver planos</Pill>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_hsl(222_47%_14%/0.06)] sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-foreground"><Users className="h-4 w-4 text-gold" /> Limite de clientes</h2>
        <p className="text-sm text-muted-foreground">
          <span className="font-display text-3xl text-foreground">{nClientes}</span> de {info.limite} clientes ativos
        </p>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary">
          <div className={`h-full rounded-full ${pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-warning" : "bg-gold"}`} style={{ width: `${pct}%` }} />
        </div>
        <ul className="mt-5 space-y-1.5 text-sm">
          {Object.entries(PLANOS).map(([k, p]) => (
            <li key={k} className={`flex justify-between rounded-full px-3 py-1.5 ${k === plano ? "bg-gold-soft font-semibold text-primary" : "text-muted-foreground"}`}>
              <span>{p.nome}</span><span>até {p.limite} clientes</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-muted-foreground">Clientes arquivados não contam no limite.</p>
      </section>
    </div>
  );
}

/* ---------- Notificações ---------- */
const NOTIFS: { k: string; titulo: string; desc: string; padrao: boolean }[] = [
  { k: "resumo_diario", titulo: "Resumo diário da régua por e-mail", desc: "Todo dia de manhã, quem precisa de atenção hoje.", padrao: true },
  { k: "tarefa_vencida", titulo: "Tarefa vencida de cliente", desc: "Aviso quando um cliente deixa passar o prazo de uma tarefa.", padrao: true },
  { k: "sem_movimento", titulo: "Cliente sem movimento há 30 dias", desc: "Quando um cliente fica 30 dias sem lançar nada no app.", padrao: true },
  { k: "novidades", titulo: "Novidades do produto", desc: "Melhorias e recursos novos do R&M 360°.", padrao: false },
];

function Notificacoes({ eduId }: { eduId: string }) {
  const key = `rm-edu-notificacoes-${eduId}`;
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const base = Object.fromEntries(NOTIFS.map((n) => [n.k, n.padrao]));
    try { return { ...base, ...JSON.parse(lsGet(key) || "{}") }; } catch { return base; }
  });
  const alterar = (k: string, v: boolean) => {
    const novo = { ...prefs, [k]: v };
    setPrefs(novo);
    lsSet(key, JSON.stringify(novo));
  };

  return (
    <section className="max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_hsl(222_47%_14%/0.06)] sm:p-6">
      <h2 className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-foreground"><Bell className="h-4 w-4 text-gold" /> Notificações</h2>
      <div className="divide-y divide-border">
        {NOTIFS.map((n) => (
          <label key={n.k} className="flex cursor-pointer items-center justify-between gap-4 py-4">
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground">{n.titulo}</span>
              <span className="block text-[13px] text-muted-foreground">{n.desc}</span>
            </span>
            <Switch checked={!!prefs[n.k]} onCheckedChange={(v) => alterar(n.k, v)} aria-label={n.titulo} />
          </label>
        ))}
      </div>
      <p className="mt-3 flex items-start gap-2 rounded-2xl bg-secondary px-4 py-3 text-[13px] text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        Suas preferências ficam salvas neste navegador. O envio real dos avisos depende do servidor e será ativado em breve.
      </p>
    </section>
  );
}
