/* Configurações da educadora: Minha conta, Assinantes (assinaturas e cortesias), Notificações e Categorias padrão. */
import { useState } from "react";
import { Bell, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { PageHeader, useUserId } from "../cliente/_shared";
import { lsGet, lsSet, MinhaConta } from "./_config-conta";
import { CategoriasPadrao } from "./_config-categorias";
import { Assinantes } from "./_config-assinantes";

type Aba = "conta" | "assinatura" | "notificacoes" | "categorias";
const ABAS: [Aba, string][] = [
  ["conta", "Minha conta"], ["assinatura", "Assinantes"], ["notificacoes", "Notificações"], ["categorias", "Categorias padrão"],
];

export default function EduConfiguracoes() {
  const eduId = useUserId();
  const [aba, setAba] = useState<Aba>("conta");

  return (
    <div>
      <PageHeader title="Configurações" desc="Dados da sua conta, assinantes do app, cortesias e preferências." />

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
        <Assinantes />
      ) : aba === "notificacoes" ? (
        <Notificacoes eduId={eduId} />
      ) : (
        <CategoriasPadrao eduId={eduId} />
      )}
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
