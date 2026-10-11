/* Início da educadora: "A régua de hoje", números da carteira, movimento dos clientes e atalhos. */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarClock, CalendarDays, ChevronRight, CircleAlert, ClipboardCheck, ListTodo, PhoneCall, Sparkles, UserPlus, Users,
} from "lucide-react";
import { db, brl, DIAS_SEMANA, MESES, PageHeader, Panel, rangeAnoMes, anoMesOf, todayISO } from "../cliente/_shared";
import { primeiroNome, useEducadora, type ClienteCad } from "./_clientes-utils";

type ItemRegua = {
  key: string;
  hora: string | null; // "HH:MM" para itens com hora
  ordem: string;
  titulo: string;
  sub: string;
  alerta?: string; // ex.: "venceu há 3 dias" (vermelho)
  tipo: "cliente" | "minha" | "lead" | "agenda";
  to: string;
};

const MAX_ITENS = 6;
type LancMin = { user_id: string; tipo: string; valor: number; data: string; origem: string };

const diasEntre = (a: string, b: string) => {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 864e5);
};
const venceuTxt = (prazo: string, hoje: string) => {
  const n = diasEntre(prazo, hoje);
  return n <= 0 ? "vence hoje" : `venceu há ${n} dia${n > 1 ? "s" : ""}`;
};
const isoDiasAtras = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function EduInicio() {
  const me = useEducadora();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [itens, setItens] = useState<ItemRegua[]>([]);
  const [nums, setNums] = useState({ ativos: 0, esperando: 0, semMovimento: 0 });
  const [mesStats, setMesStats] = useState({ receitas: 0, despesas: 0, lancaram: 0, importaram: 0, vinculados: 0 });

  useEffect(() => {
    if (!me) return;
    (async () => {
      const hoje = todayISO();
      const { inicio: iniMes, fim: fimMes } = rangeAnoMes(anoMesOf(new Date()));
      const ini30 = isoDiasAtras(30);
      const desde = ini30 < iniMes ? ini30 : iniMes;
      const d0 = new Date(); d0.setHours(0, 0, 0, 0);
      const d1 = new Date(d0); d1.setDate(d1.getDate() + 1);

      const { data: cads } = await db.from("clientes").select("*").eq("user_id", me.id);
      const clientes: ClienteCad[] = (cads ?? []).filter((c: ClienteCad) => !c.arquivado);
      const vinculados = clientes.filter((c) => c.cliente_user_id);
      const ids = vinculados.map((c) => c.cliente_user_id as string);
      const nomePorUser = new Map(vinculados.map((c) => [c.cliente_user_id as string, c.nome]));

      const vazio = Promise.resolve({ data: [] });
      const [tCli, tMinhas, ags, leads, lancs] = await Promise.all([
        ids.length ? db.from("cli_tarefas").select("*").in("user_id", ids).eq("status", "pendente") : vazio,
        db.from("cli_tarefas").select("*").eq("user_id", me.id).eq("status", "pendente"),
        db.from("agendamentos").select("*").eq("user_id", me.id).gte("inicio", d0.toISOString()).lt("inicio", d1.toISOString()).order("inicio"),
        db.from("leads").select("*").eq("user_id", me.id).eq("arquivado", false).lte("proximo_contato", hoje),
        ids.length ? db.from("cli_lancamentos").select("user_id,tipo,valor,data,origem").in("user_id", ids).gte("data", desde) : vazio,
      ]);

      const lista: ItemRegua[] = [];
      for (const a of ags.data ?? []) {
        if (String(a.status).startsWith("cancel")) continue;
        const dt = new Date(a.inicio);
        const hora = `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
        lista.push({ key: "a" + a.id, hora, ordem: a.inicio, titulo: a.assunto || "Atendimento", sub: a.nome_contato, tipo: "agenda", to: "/educador/agenda" });
      }
      for (const t of tCli.data ?? []) {
        if (!t.prazo || t.prazo > hoje) continue;
        lista.push({
          key: "c" + t.id, hora: null, ordem: t.prazo, titulo: t.titulo, sub: nomePorUser.get(t.user_id) ?? "Cliente",
          alerta: venceuTxt(t.prazo, hoje), tipo: "cliente", to: `/educador/clientes/${t.user_id}/tarefas`,
        });
      }
      for (const t of tMinhas.data ?? []) {
        if (!t.prazo || t.prazo > hoje) continue;
        lista.push({ key: "m" + t.id, hora: null, ordem: t.prazo, titulo: t.titulo, sub: "Sua tarefa", alerta: venceuTxt(t.prazo, hoje), tipo: "minha", to: "/educador/tarefas" });
      }
      for (const l of leads.data ?? []) {
        if (!l.proximo_contato || l.proximo_contato > hoje) continue;
        const n = diasEntre(l.proximo_contato, hoje);
        lista.push({
          key: "l" + l.id, hora: null, ordem: l.proximo_contato, titulo: `Falar com ${l.nome}`, sub: `CRM · ${l.etapa}`,
          alerta: n > 0 ? `contato atrasado há ${n} dia${n > 1 ? "s" : ""}` : undefined, tipo: "lead", to: "/educador/crm",
        });
      }
      // com hora primeiro (por horário); sem hora do mais atrasado ao mais recente
      lista.sort((a, b) => (a.hora && b.hora ? a.ordem.localeCompare(b.ordem) : a.hora ? -1 : b.hora ? 1 : a.ordem.localeCompare(b.ordem)));
      setItens(lista);

      const ls: LancMin[] = lancs.data ?? [];
      const ativos30 = new Set(ls.filter((l) => l.data >= ini30).map((l) => l.user_id));
      const doMes = ls.filter((l) => l.data >= iniMes && l.data <= fimMes);
      setNums({
        ativos: vinculados.length,
        esperando: clientes.filter((c) => !c.cliente_user_id).length,
        semMovimento: ids.filter((id) => !ativos30.has(id)).length,
      });
      setMesStats({
        receitas: doMes.filter((l) => l.tipo === "receita").reduce((s, l) => s + Number(l.valor || 0), 0),
        despesas: doMes.filter((l) => l.tipo === "despesa").reduce((s, l) => s + Number(l.valor || 0), 0),
        lancaram: new Set(doMes.map((l) => l.user_id)).size,
        importaram: new Set(doMes.filter((l) => l.origem === "ia").map((l) => l.user_id)).size,
        vinculados: ids.length,
      });
      setLoading(false);
    })();
  }, [me]);

  const d = new Date();
  const saudacao = `Olá${me ? `, ${primeiroNome(me.nome)}` : ""}. Hoje é ${DIAS_SEMANA[d.getDay()].toLowerCase()}, ${String(d.getDate()).padStart(2, "0")} de ${MESES[d.getMonth()].toLowerCase()}.`;

  const visiveis = itens.slice(0, MAX_ITENS);
  const comHora = visiveis.filter((i) => i.hora);
  const semHora = visiveis.filter((i) => !i.hora);
  const totalCom = itens.filter((i) => i.hora).length;
  const totalSem = itens.length - totalCom;
  const resto = itens.length - visiveis.length;

  const resumo = useMemo(() => {
    const p: string[] = [];
    if (totalCom) p.push(`${totalCom} com hora`);
    if (totalSem) p.push(`${totalSem} sem hora`);
    return p.join(" · ");
  }, [totalCom, totalSem]);

  return (
    <div>
      <PageHeader title="Início" desc={saudacao} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* A régua de hoje */}
        <Panel className="lg:row-span-3 lg:self-start">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">A régua de hoje</h2>
            {resumo && <span className="text-xs text-muted-foreground">{resumo}</span>}
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : itens.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center">
              <ClipboardCheck className="mx-auto h-7 w-7 text-gold" />
              <p className="mt-2 font-medium text-foreground">Dia tranquilo por aqui</p>
              <p className="mt-1 text-sm text-muted-foreground">Nenhuma tarefa vencida, atendimento ou contato marcado para hoje.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {comHora.length > 0 && <Grupo rotulo="Com hora" itens={comHora} onOpen={(to) => navigate(to)} />}
              {semHora.length > 0 && <Grupo rotulo="Sem hora" itens={semHora} onOpen={(to) => navigate(to)} />}
              {resto > 0 && <p className="pl-[76px] text-xs text-muted-foreground sm:pl-[92px]">e mais {resto}</p>}
            </div>
          )}
        </Panel>

        {/* Números */}
        <Panel>
          <div className="grid grid-cols-3 gap-3">
            <Numero n={nums.ativos} label="clientes ativos" to="/educador/clientes" />
            <Numero n={nums.esperando} label="esperando ativação" to="/educador/clientes" />
            <Numero n={nums.semMovimento} label="sem movimento há 30 dias" to="/educador/clientes" alerta={nums.semMovimento > 0} />
          </div>
        </Panel>

        {/* Seus clientes este mês */}
        <Panel>
          <h2 className="mb-3 text-[15px] font-semibold text-foreground">Seus clientes este mês</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="tabular-nums text-lg font-semibold text-success">{brl(mesStats.receitas)}</p>
              <p className="text-xs text-muted-foreground">receitas lançadas</p>
            </div>
            <div>
              <p className="tabular-nums text-lg font-semibold text-destructive">{brl(mesStats.despesas)}</p>
              <p className="text-xs text-muted-foreground">despesas lançadas</p>
            </div>
          </div>
          <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{mesStats.lancaram}</span> de {mesStats.vinculados} lançaram algo
            {" · "}
            <span className="font-semibold text-foreground">{mesStats.importaram}</span> importaram com IA
          </p>
        </Panel>

        {/* Atalhos */}
        <Panel>
          <h2 className="mb-3 text-[15px] font-semibold text-foreground">Atalhos</h2>
          <div className="grid grid-cols-2 gap-2">
            <Atalho to="/educador/clientes?novo=1" icon={UserPlus}>Adicionar cliente</Atalho>
            <Atalho to="/educador/tarefas" icon={ListTodo}>Nova tarefa</Atalho>
            <Atalho to="/educador/agenda" icon={CalendarDays}>Abrir agenda</Atalho>
            <Atalho to="/educador/crm" icon={Users}>Ver CRM</Atalho>
          </div>
        </Panel>
      </div>

      {/* Faixa do método */}
      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-border bg-gold-soft/60 px-5 py-3 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 shrink-0 text-gold" />
        <span className="font-semibold text-foreground">Método GCPM</span>
        <span>Gerar · Cuidar · Proteger · Multiplicar — um passo de cada vez com cada cliente.</span>
      </div>
    </div>
  );
}

const ICONE = { cliente: CircleAlert, minha: ClipboardCheck, lead: PhoneCall, agenda: CalendarClock } as const;

function Grupo({ rotulo, itens, onOpen }: { rotulo: string; itens: ItemRegua[]; onOpen: (to: string) => void }) {
  const comHora = rotulo === "Com hora";
  return (
    <div className="flex gap-3 sm:gap-5">
      <div className="w-[52px] shrink-0 pt-2 text-center text-[10px] font-semibold uppercase leading-tight tracking-wider text-muted-foreground sm:w-[60px]">
        {comHora ? "Com hora" : <>Sem<br />hora</>}
      </div>
      <ul className="min-w-0 flex-1 space-y-1 border-l border-dashed border-border pl-3 sm:pl-4">
        {itens.map((i) => {
          const Icon = ICONE[i.tipo];
          return (
            <li key={i.key}>
              <button
                type="button"
                onClick={() => onOpen(i.to)}
                className="group flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-secondary"
              >
                {i.hora ? (
                  <span className="mt-0.5 w-11 shrink-0 tabular-nums text-sm font-semibold text-primary">{i.hora}</span>
                ) : (
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${i.alerta?.startsWith("venceu") || i.alerta?.startsWith("contato") ? "text-destructive" : "text-gold"}`} />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] text-foreground">{i.titulo}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {i.sub}
                    {i.alerta && (
                      <> · <span className={i.alerta === "vence hoje" ? "font-medium text-warning" : "font-medium text-destructive"}>{i.alerta}</span></>
                    )}
                  </span>
                </span>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-foreground" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Numero({ n, label, to, alerta }: { n: number; label: string; to: string; alerta?: boolean }) {
  return (
    <Link to={to} className="rounded-xl p-1 transition hover:bg-secondary">
      <p className={`font-display text-3xl tabular-nums ${alerta ? "text-warning" : "text-primary"}`}>{n}</p>
      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{label}</p>
    </Link>
  );
}

function Atalho({ to, icon: Icon, children }: { to: string; icon: typeof Users; children: React.ReactNode }) {
  return (
    <Link to={to} className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary">
      <Icon className="h-4 w-4 shrink-0 text-gold" />
      <span className="truncate">{children}</span>
    </Link>
  );
}
