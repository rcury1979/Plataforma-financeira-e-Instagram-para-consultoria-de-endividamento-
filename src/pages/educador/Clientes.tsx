/* Clientes da educadora: uso do plano, lista (ativos/arquivados), convite e cadastro de novos clientes. */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Archive, ArchiveRestore, ChevronRight, Copy, Mail, MessageCircle, Phone, Search, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { db, EmptyState, Field, inputCls, PageHeader, Pill, rangeAnoMes, anoMesOf } from "../cliente/_shared";
import {
  avatarCls, iniciais, limiteDoPlano, linkConvite, mensagemConvite, useEducadora, whatsappUrl, type ClienteCad,
} from "./_clientes-utils";

type Aba = "ativos" | "arquivados";

export default function EduClientes() {
  const me = useEducadora();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [clientes, setClientes] = useState<ClienteCad[]>([]);
  const [importacoes, setImportacoes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState<Aba>("ativos");
  const [busca, setBusca] = useState("");
  const [novoAberto, setNovoAberto] = useState(false);
  const [convite, setConvite] = useState<ClienteCad | null>(null);
  const [arquivando, setArquivando] = useState<ClienteCad | null>(null);

  const load = useCallback(async () => {
    if (!me) return;
    const { data } = await db.from("clientes").select("*").eq("user_id", me.id).order("nome");
    const lista: ClienteCad[] = data ?? [];
    setClientes(lista);
    // importações por IA dos clientes vinculados no mês
    const ids = lista.filter((c) => c.cliente_user_id && !c.arquivado).map((c) => c.cliente_user_id as string);
    if (ids.length) {
      const { inicio, fim } = rangeAnoMes(anoMesOf(new Date()));
      const { data: ls } = await db.from("cli_lancamentos").select("id").in("user_id", ids).eq("origem", "ia").gte("data", inicio).lte("data", fim);
      setImportacoes((ls ?? []).length);
    } else setImportacoes(0);
    setLoading(false);
  }, [me]);
  useEffect(() => { load(); }, [load]);

  // atalho do Início: /educador/clientes?novo=1
  useEffect(() => {
    if (params.get("novo") === "1") {
      setNovoAberto(true);
      params.delete("novo");
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const ativos = clientes.filter((c) => !c.arquivado);
  const arquivados = clientes.filter((c) => c.arquivado);
  const vagas = limiteDoPlano(me?.plano);
  const usadas = ativos.length;
  const semVagas = usadas >= vagas;
  const limiteImport = vagas * 3;
  const limiteAnalises = vagas * 3;
  // TODO: contar as análises geradas pelos clientes no mês quando a tela de análises registrar o uso.
  const analises = 0;

  const lista = useMemo(() => {
    const base = aba === "ativos" ? ativos : arquivados;
    const q = busca.trim().toLowerCase();
    if (!q) return base;
    const qDig = q.replace(/\D/g, "");
    return base.filter((c) =>
      c.nome.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.telefone ?? "").toLowerCase().includes(q) ||
      (!!qDig && (c.telefone ?? "").replace(/\D/g, "").includes(qDig)),
    );
  }, [aba, busca, clientes]); // eslint-disable-line react-hooks/exhaustive-deps

  function abrir(c: ClienteCad) {
    if (c.cliente_user_id) navigate(`/educador/clientes/${c.cliente_user_id}`);
    else setConvite(c);
  }

  async function confirmarArquivo() {
    if (!arquivando || !me) return;
    const novo = !arquivando.arquivado;
    const { error } = await db.from("clientes").update({ arquivado: novo }).eq("id", arquivando.id).eq("user_id", me.id);
    setArquivando(null);
    if (error) return toast.error("Não foi possível atualizar o cliente.");
    toast.success(novo ? "Cliente arquivado." : "Cliente restaurado.");
    load();
  }

  function pedirRestaurar(c: ClienteCad) {
    if (semVagas) return toast.error("Suas vagas estão todas em uso. Arquive alguém ou aumente o plano para restaurar.");
    setArquivando(c);
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        right={
          <Pill variant="solid" onClick={() => setNovoAberto(true)}>
            <UserPlus className="h-4 w-4" /> Adicionar cliente
          </Pill>
        }
      />

      {/* uso do plano */}
      <div className="mb-6 space-y-3">
        <BarraUso
          label={`${usadas} de ${vagas} vagas utilizadas`}
          usado={usadas}
          total={vagas}
          extra={<Link to="/planos" className="text-xs font-medium text-primary underline-offset-2 hover:underline">Aumentar plano</Link>}
        />
        <BarraUso label={`${importacoes} de ${limiteImport} importações usadas este mês`} usado={importacoes} total={limiteImport} />
        <BarraUso label={`${analises} de ${limiteAnalises} análises usadas este mês`} usado={analises} total={limiteAnalises} />
      </div>

      {/* abas + busca */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex self-start rounded-full border border-border bg-card p-1">
          {([["ativos", "Ativos", ativos.length], ["arquivados", "Arquivados", arquivados.length]] as const).map(([k, label, n]) => (
            <button
              key={k}
              type="button"
              onClick={() => setAba(k)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full px-4 text-sm transition ${aba === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {label} <span className="text-[11px] opacity-80">({n})</span>
            </button>
          ))}
        </div>
        <label className="relative block w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input className={inputCls + " pl-10"} placeholder="Buscar por nome, e-mail ou telefone" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar clientes" />
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : lista.length === 0 ? (
        busca ? (
          <EmptyState title="Nenhum cliente encontrado" desc="Tente buscar por outro nome, e-mail ou telefone." />
        ) : aba === "arquivados" ? (
          <EmptyState title="Nenhum cliente arquivado" desc="Clientes arquivados ficam guardados aqui e podem ser restaurados." />
        ) : (
          <EmptyState
            title="Você ainda não tem clientes"
            desc="Adicione o primeiro cliente e envie o convite para ele criar a conta."
            action={<Pill variant="solid" onClick={() => setNovoAberto(true)}><UserPlus className="h-4 w-4" /> Adicionar cliente</Pill>}
          />
        )
      ) : (
        <ul className="space-y-3">
          {lista.map((c) => (
            <li key={c.id}>
              <ClienteCard
                c={c}
                onOpen={() => abrir(c)}
                onArquivar={() => (c.arquivado ? pedirRestaurar(c) : setArquivando(c))}
              />
            </li>
          ))}
        </ul>
      )}

      {me && (
        <NovoClienteDialog
          open={novoAberto}
          onOpenChange={setNovoAberto}
          educadoraId={me.id}
          semVagas={semVagas}
          vagas={vagas}
          existentes={clientes}
          onCreated={(c) => { load(); setConvite(c); }}
        />
      )}

      <ConviteDialog cliente={convite} educadora={me?.nome ?? ""} onClose={() => setConvite(null)} />

      <AlertDialog open={!!arquivando} onOpenChange={(v) => !v && setArquivando(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{arquivando?.arquivado ? "Restaurar cliente?" : "Arquivar cliente?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {arquivando?.arquivado
                ? `${arquivando?.nome} volta para a lista de ativos e passa a ocupar uma vaga do plano.`
                : `${arquivando?.nome} sai da lista de ativos e libera uma vaga. Os dados ficam guardados e você pode restaurar quando quiser.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-full" onClick={confirmarArquivo}>
              {arquivando?.arquivado ? "Restaurar" : "Arquivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BarraUso({ label, usado, total, extra }: { label: string; usado: number; total: number; extra?: React.ReactNode }) {
  const pct = total > 0 ? Math.min(100, (usado / total) * 100) : 0;
  const cor = pct >= 100 ? "bg-destructive" : pct >= 80 ? "bg-gold" : "bg-primary";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {extra}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${cor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Selo({ c }: { c: ClienteCad }) {
  if (c.arquivado) return <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Arquivado</span>;
  if (c.cliente_user_id) return <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">Ativo</span>;
  return <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-semibold text-gold">Convite pendente</span>;
}

function ClienteCard({ c, onOpen, onArquivar }: { c: ClienteCad; onOpen: () => void; onArquivar: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-[0_1px_3px_hsl(222_47%_14%/0.06)] transition hover:border-primary/30 sm:gap-4 sm:p-4">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4" aria-label={`Abrir ${c.nome}`}>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold ${avatarCls(c.nome)}`}>{iniciais(c.nome)}</span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate font-medium text-foreground">{c.nome}</span>
            <Selo c={c} />
          </span>
          <span className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            {c.email && <span className="inline-flex min-w-0 items-center gap-1"><Mail className="h-3 w-3 shrink-0" /><span className="truncate">{c.email}</span></span>}
            {c.telefone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" />{c.telefone}</span>}
          </span>
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onArquivar}
          title={c.arquivado ? "Restaurar" : "Arquivar"}
          aria-label={c.arquivado ? `Restaurar ${c.nome}` : `Arquivar ${c.nome}`}
          className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          {c.arquivado ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
        </button>
        {!c.arquivado && (
          <button type="button" onClick={onOpen} aria-label={`Abrir ${c.nome}`} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground">
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function NovoClienteDialog({
  open, onOpenChange, educadoraId, semVagas, vagas, existentes, onCreated,
}: {
  open: boolean; onOpenChange: (v: boolean) => void; educadoraId: string; semVagas: boolean; vagas: number;
  existentes: ClienteCad[]; onCreated: (c: ClienteCad) => void;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipo, setTipo] = useState<"PF" | "PJ">("PF");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNome(""); setEmail(""); setTelefone(""); setTipo("PF");
  }, [open]);

  async function salvar() {
    if (semVagas) return;
    const n = nome.trim();
    const e = email.trim().toLowerCase();
    if (!n) return toast.error("Informe o nome do cliente.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return toast.error("Informe um e-mail válido.");
    if (existentes.some((c) => (c.email ?? "").toLowerCase() === e)) return toast.error("Você já tem um cliente com esse e-mail.");
    setSaving(true);
    const { data, error } = await db.from("clientes").insert({
      user_id: educadoraId, responsavel_id: educadoraId, nome: n, email: e, telefone: telefone.trim() || null,
      tipo_pessoa: tipo, arquivado: false, cliente_user_id: null,
    }).select().single();
    setSaving(false);
    if (error || !data) return toast.error("Não foi possível adicionar o cliente.");
    toast.success("Cliente adicionado. Agora é só enviar o convite.");
    onOpenChange(false);
    onCreated(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar cliente</DialogTitle>
          <DialogDescription>O vínculo acontece quando o cliente cria a conta com este e-mail e confirma o cadastro.</DialogDescription>
        </DialogHeader>
        {semVagas ? (
          <div className="rounded-2xl bg-gold-soft p-4 text-sm text-foreground">
            <p className="font-medium">Suas {vagas} vagas estão em uso.</p>
            <p className="mt-1 text-muted-foreground">Arquive um cliente que não acompanha mais ou aumente o plano para adicionar novos.</p>
            <Link to="/planos" className="mt-3 inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground">Ver planos</Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <Field label="Nome *"><input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" autoFocus /></Field>
              <Field label="E-mail *"><input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" /></Field>
              <Field label="Telefone"><input type="tel" className={inputCls} value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(21) 90000-0000" /></Field>
              <div className="space-y-1.5">
                <span className="text-[13px] text-muted-foreground">Tipo</span>
                <div className="grid grid-cols-2 gap-2">
                  {(["PF", "PJ"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setTipo(t)}
                      className={`h-10 rounded-full border text-sm transition ${tipo === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"}`}>
                      {t === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <Pill onClick={() => onOpenChange(false)}>Cancelar</Pill>
              <Pill variant="solid" onClick={salvar} disabled={saving}>{saving ? "Salvando…" : "Adicionar"}</Pill>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ConviteDialog({ cliente, educadora, onClose }: { cliente: ClienteCad | null; educadora: string; onClose: () => void }) {
  const link = linkConvite();
  const texto = cliente ? mensagemConvite(cliente.nome, educadora, cliente.email) : "";

  async function copiar(v: string, msg: string) {
    try {
      await navigator.clipboard.writeText(v);
      toast.success(msg);
    } catch {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  }

  return (
    <Dialog open={!!cliente} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Convite para {cliente?.nome}</DialogTitle>
          <DialogDescription>
            Envie o link abaixo. Quando {cliente ? cliente.nome.split(" ")[0] : "o cliente"} criar a conta com o e-mail
            {cliente?.email ? ` ${cliente.email}` : " cadastrado"} e confirmar, o vínculo acontece sozinho.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Link de cadastro">
            <div className="flex items-center gap-2">
              <input readOnly className={inputCls} value={link} onFocus={(e) => e.currentTarget.select()} aria-label="Link do convite" />
              <button type="button" onClick={() => copiar(link, "Link copiado.")} aria-label="Copiar link"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-card hover:bg-secondary">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </Field>
          <Field label="Mensagem pronta">
            <textarea readOnly className={inputCls.replace("rounded-full", "rounded-2xl") + " h-40 py-2 leading-relaxed"} value={texto} aria-label="Mensagem do convite" />
          </Field>
        </div>
        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Pill onClick={() => copiar(texto, "Mensagem copiada.")}><Copy className="h-4 w-4" /> Copiar mensagem</Pill>
          <a
            href={cliente ? whatsappUrl(cliente.telefone, texto) : "#"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-success px-4 text-sm font-medium text-success-foreground hover:bg-success/90"
          >
            <MessageCircle className="h-4 w-4" /> Enviar pelo WhatsApp
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
