/* Configurações da educadora → aba "Minha conta" (grade de cartões). */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import {
  Building2, Camera, CalendarDays, Eye, EyeOff, Lock, Mail, ShieldCheck, Trash2, User,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { db, Field, inputCls, Pill } from "../cliente/_shared";

/* ---------- utilidades ---------- */
export const lsGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
export const lsSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } };

/** Máscara de WhatsApp: (21) 98600-0039 */
export const mascaraTel = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

function Card({ icon: Icon, title, children, className = "", iconCls = "text-gold" }: { icon: typeof User; title: ReactNode; children: ReactNode; className?: string; iconCls?: string }) {
  return (
    <section className={`rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_hsl(222_47%_14%/0.06)] sm:p-6 ${className}`}>
      <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-foreground">
        <Icon className={`h-4 w-4 ${iconCls}`} /> {title}
      </h2>
      {children}
    </section>
  );
}

const amigavel = (msg?: string) =>
  msg && /teste|test/i.test(msg) ? "Isso não funciona no site de teste — no app de verdade funciona normalmente." : "Não foi possível concluir agora. Tente de novo em instantes.";

/* ---------- aba ---------- */
export function MinhaConta({ eduId }: { eduId: string }) {
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      const meta = (data.user?.user_metadata ?? {}) as { avatar_url?: string };
      setAvatar(meta.avatar_url || lsGet(`rm-edu-avatar-${eduId}`));
    });
  }, [eduId]);

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      <DadosPerfil eduId={eduId} email={email} />
      <DadosConta eduId={eduId} avatar={avatar} />
      <RedefinirSenha />
      <FotoPerfil eduId={eduId} avatar={avatar} onChange={setAvatar} />
      <DuasEtapas />
      <GoogleAgenda />
      <ZonaPerigo email={email} />
    </div>
  );
}

/* ---------- Dados do perfil ---------- */
function DadosPerfil({ eduId, email }: { eduId: string; email: string }) {
  const [nome, setNome] = useState("");
  const [tel, setTel] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    db.from("profiles").select("full_name, phone").eq("user_id", eduId).maybeSingle().then(({ data }: any) => {
      setNome(data?.full_name ?? "");
      setTel(mascaraTel(data?.phone ?? ""));
    });
  }, [eduId]);

  async function salvar() {
    if (!nome.trim()) return toast.error("Informe seu nome.");
    setSalvando(true);
    const { error } = await db.from("profiles").update({ full_name: nome.trim(), phone: tel || null }).eq("user_id", eduId);
    setSalvando(false);
    if (error) return toast.error("Não foi possível salvar o perfil.");
    toast.success("Perfil atualizado.");
  }

  async function trocarEmail() {
    const e = novoEmail.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) return toast.error("Digite um e-mail válido.");
    if (e === email.toLowerCase()) return toast.error("Esse já é o seu e-mail atual.");
    const { error } = await supabase.auth.updateUser({ email: e });
    if (error) return toast.error(amigavel(error.message));
    setNovoEmail("");
    toast.success("Enviamos um link de confirmação para o novo e-mail. O acesso só muda depois que você confirmar.");
  }

  return (
    <Card icon={User} title="Dados do perfil">
      <div className="space-y-4">
        <Field label="Nome">
          <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} name="nome" />
        </Field>
        <Field label="WhatsApp (opcional)">
          <input className={inputCls} value={tel} onChange={(e) => setTel(mascaraTel(e.target.value))} placeholder="(21) 90000-0000" inputMode="tel" name="whatsapp" />
        </Field>
        <div>
          <p className="text-[13px] text-muted-foreground">E-mail atual</p>
          <p className="mt-0.5 break-all text-sm text-foreground">{email || "—"}</p>
        </div>
        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground"><Mail className="h-3.5 w-3.5" /> Alterar e-mail</p>
          <div className="flex gap-2">
            <input className={inputCls} value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} placeholder="novo@email.com" type="email" name="novo-email" />
            <Pill onClick={trocarEmail} disabled={!novoEmail.trim()}>Confirmar</Pill>
          </div>
          <p className="text-[11px] text-muted-foreground/80">Um link de confirmação será enviado para o novo endereço. O e-mail de acesso só muda após a confirmação.</p>
        </div>
        <div>
          <p className="mb-1.5 text-[13px] text-muted-foreground">Função</p>
          <span className="inline-flex rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Educadora financeira</span>
        </div>
        <Pill variant="solid" onClick={salvar} disabled={salvando}>{salvando ? "Salvando…" : "Salvar"}</Pill>
      </div>
    </Card>
  );
}

/* ---------- Dados da conta ---------- */
function DadosConta({ eduId, avatar }: { eduId: string; avatar: string | null }) {
  const key = `rm-edu-conta-nome-${eduId}`;
  const [nomeConta, setNomeConta] = useState(() => lsGet(key) ?? "");
  // TODO: quando existir coluna própria (ex.: profiles.nome_marca), salvar no banco em vez do navegador.
  const salvar = () => {
    lsSet(key, nomeConta.trim());
    toast.success("Nome da conta salvo neste navegador.");
  };
  return (
    <Card icon={Building2} title="Dados da conta">
      <p className="mb-4 text-sm text-muted-foreground">
        A <strong className="font-semibold text-foreground">foto de perfil</strong> também vira o <strong className="font-semibold text-foreground">logo</strong> que seus clientes veem na área deles — não precisa enviar duas imagens.
      </p>
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-gold-soft text-primary">
          {avatar ? <img src={avatar} alt="Logo" className="h-full w-full object-cover" /> : <Building2 className="h-5 w-5" />}
        </span>
        <span className="text-sm text-foreground">{nomeConta || "Sua marca"}</span>
      </div>
      <div className="space-y-4">
        <Field label="Nome da conta / marca" hint="Por enquanto fica salvo só neste navegador.">
          <input className={inputCls} value={nomeConta} onChange={(e) => setNomeConta(e.target.value)} placeholder="Ex.: Marta Cury Educação Financeira" name="nome-conta" />
        </Field>
        <div>
          <p className="mb-1.5 text-[13px] text-muted-foreground">Tipo</p>
          <span className="inline-flex rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground">Individual</span>
        </div>
        <Pill variant="solid" onClick={salvar}>Salvar</Pill>
      </div>
    </Card>
  );
}

/* ---------- Redefinir senha ---------- */
function SenhaInput({ label, value, onChange, name }: { label: string; value: string; onChange: (v: string) => void; name: string }) {
  const [ver, setVer] = useState(false);
  return (
    <Field label={label}>
      <div className="relative">
        <input type={ver ? "text" : "password"} className={inputCls + " pr-11"} value={value} onChange={(e) => onChange(e.target.value)} name={name} autoComplete={name === "senha-atual" ? "current-password" : "new-password"} />
        <button type="button" onClick={() => setVer((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={ver ? "Esconder senha" : "Mostrar senha"}>
          {ver ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </Field>
  );
}

function RedefinirSenha() {
  const [atual, setAtual] = useState("");
  const [nova, setNova] = useState("");
  const [conf, setConf] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!atual) return toast.error("Digite sua senha atual.");
    if (nova.length < 8) return toast.error("A nova senha precisa ter pelo menos 8 caracteres.");
    if (nova !== conf) return toast.error("A confirmação não confere com a nova senha.");
    if (nova === atual) return toast.error("A nova senha precisa ser diferente da atual.");
    setSalvando(true);
    // confere a senha atual entrando de novo com ela
    const { data: u } = await supabase.auth.getUser();
    const email = u.user?.email;
    if (email) {
      const { error: e1 } = await supabase.auth.signInWithPassword({ email, password: atual });
      if (e1) { setSalvando(false); return toast.error("Senha atual incorreta."); }
    }
    const { error } = await supabase.auth.updateUser({ password: nova });
    setSalvando(false);
    if (error) return toast.error(amigavel(error.message));
    setAtual(""); setNova(""); setConf("");
    toast.success("Senha alterada com sucesso.");
  }

  return (
    <Card icon={Lock} title="Redefinir senha">
      <div className="space-y-4">
        <SenhaInput label="Senha atual" value={atual} onChange={setAtual} name="senha-atual" />
        <SenhaInput label="Nova senha" value={nova} onChange={setNova} name="senha-nova" />
        <SenhaInput label="Confirmar nova senha" value={conf} onChange={setConf} name="senha-confirma" />
        <p className="text-[11px] text-muted-foreground/80">Mínimo de 8 caracteres. Misture letras, números e símbolos.</p>
        <Pill variant="solid" onClick={salvar} disabled={salvando}>{salvando ? "Salvando…" : "Salvar nova senha"}</Pill>
      </div>
    </Card>
  );
}

/* ---------- Foto de perfil ---------- */
function FotoPerfil({ eduId, avatar, onChange }: { eduId: string; avatar: string | null; onChange: (u: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(f: File) {
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return toast.error("Envie uma imagem JPG, PNG ou WebP.");
    if (f.size > 5 * 1024 * 1024) return toast.error("A imagem pode ter no máximo 5 MB.");
    setEnviando(true);
    const ext = f.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${eduId}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, f, { upsert: true, contentType: f.type });
    if (error) { setEnviando(false); return toast.error(amigavel(error.message)); }
    const url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    await supabase.auth.updateUser({ data: { avatar_url: url } });
    lsSet(`rm-edu-avatar-${eduId}`, url);
    onChange(url);
    setEnviando(false);
    toast.success("Foto atualizada.");
  }

  return (
    <Card icon={Camera} title="Foto de perfil">
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-gold-soft text-primary">
          {avatar ? <img src={avatar} alt="Sua foto" className="h-full w-full object-cover" /> : <User className="h-10 w-10" />}
        </span>
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) enviar(f); e.target.value = ""; }} />
        <Pill onClick={() => ref.current?.click()} disabled={enviando}><Camera className="h-4 w-4" /> {enviando ? "Enviando…" : "Enviar foto"}</Pill>
        <p className="text-[11px] text-muted-foreground">JPG, PNG ou WebP · máx. 5 MB</p>
      </div>
    </Card>
  );
}

/* ---------- Autenticação em duas etapas ---------- */
type Enroll = { factorId: string; qr: string; secret: string };
function DuasEtapas() {
  const [ativa, setAtiva] = useState<boolean | null>(null);
  const [enroll, setEnroll] = useState<Enroll | null>(null);
  const [codigo, setCodigo] = useState("");
  const [verificando, setVerificando] = useState(false);
  const mfa = (supabase.auth as any).mfa;

  useEffect(() => {
    if (!mfa?.listFactors) { setAtiva(false); return; }
    mfa.listFactors().then(({ data }: any) => setAtiva(!!data?.totp?.some((f: any) => f.status === "verified"))).catch(() => setAtiva(false));
  }, [mfa]);

  async function configurar() {
    if (!mfa?.enroll) return toast.error("A autenticação em duas etapas não funciona no site de teste — no app de verdade funciona normalmente.");
    try {
      const { data, error } = await mfa.enroll({ factorType: "totp", friendlyName: `R&M 360° ${Date.now()}` });
      if (error || !data) throw error;
      setEnroll({ factorId: data.id, qr: data.totp.uri, secret: data.totp.secret });
      setCodigo("");
    } catch (e: any) {
      toast.error(amigavel(e?.message));
    }
  }

  async function verificar() {
    if (!enroll || codigo.replace(/\D/g, "").length !== 6) return toast.error("Digite o código de 6 números do aplicativo.");
    setVerificando(true);
    try {
      const ch = await mfa.challenge({ factorId: enroll.factorId });
      if (ch.error) throw ch.error;
      const v = await mfa.verify({ factorId: enroll.factorId, challengeId: ch.data.id, code: codigo.replace(/\D/g, "") });
      if (v.error) throw v.error;
      setAtiva(true);
      setEnroll(null);
      toast.success("Autenticação em duas etapas ativada.");
    } catch {
      toast.error("Código inválido ou expirado. Confira o aplicativo e tente de novo.");
    }
    setVerificando(false);
  }

  return (
    <Card icon={ShieldCheck} title="Autenticação em duas etapas">
      {ativa ? (
        <p className="text-sm text-muted-foreground"><strong className="font-semibold text-success">Ativada.</strong> Além da senha, pedimos o código do seu aplicativo autenticador ao entrar.</p>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            <strong className="font-semibold text-foreground">Não configurada.</strong> Sem ela, qualquer pessoa que descubra sua senha pode acessar sua conta. Recomendamos ativar para proteger os dados dos seus clientes.
          </p>
          <Pill variant="solid" onClick={configurar} disabled={ativa === null}><ShieldCheck className="h-4 w-4" /> Configurar autenticação</Pill>
        </>
      )}

      <Dialog open={!!enroll} onOpenChange={(v) => !v && setEnroll(null)}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar autenticação</DialogTitle>
            <DialogDescription>Abra o Google Authenticator (ou similar), leia o QR Code e digite o código que aparecer.</DialogDescription>
          </DialogHeader>
          {enroll && (
            <div className="space-y-4">
              <div className="mx-auto w-fit rounded-2xl border border-border bg-white p-3">
                <QRCodeSVG value={enroll.qr} size={180} />
              </div>
              <p className="break-all text-center text-[11px] text-muted-foreground">Ou digite a chave: <span className="font-mono text-foreground">{enroll.secret}</span></p>
              <Field label="Código de 6 números">
                <input className={inputCls + " text-center tracking-[0.4em]"} value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="000000" />
              </Field>
              <div className="flex justify-end gap-2">
                <Pill variant="ghost" onClick={() => setEnroll(null)}>Cancelar</Pill>
                <Pill variant="solid" onClick={verificar} disabled={verificando}>{verificando ? "Verificando…" : "Ativar"}</Pill>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/* ---------- Google Agenda ---------- */
function GoogleAgenda() {
  return (
    <Card icon={CalendarDays} title={<>Google Agenda <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">Em breve</span></>}>
      <p className="mb-4 text-sm text-muted-foreground">
        Conecte sua agenda do Google para marcar reuniões com clientes direto pelo R&amp;M 360°. Cada reunião entra na sua agenda e o cliente recebe o convite por e-mail automaticamente.
      </p>
      <Pill disabled><CalendarDays className="h-4 w-4" /> Conectar Google Agenda</Pill>
    </Card>
  );
}

/* ---------- Zona de perigo ---------- */
function ZonaPerigo({ email }: { email: string }) {
  const [aberto, setAberto] = useState(false);
  const [txt, setTxt] = useState("");

  function pedir() {
    const assunto = encodeURIComponent("Pedido de exclusão de conta — R&M 360°");
    const corpo = encodeURIComponent(
      `Olá, equipe R&M.\n\nSolicito a exclusão definitiva da minha conta de educadora no R&M 360° e de todos os dados vinculados, conforme a LGPD.\n\nE-mail da conta: ${email}\n\nObrigada.`,
    );
    window.location.href = `mailto:contato@rmconsultoria.finance?subject=${assunto}&body=${corpo}`;
    setAberto(false);
    setTxt("");
    toast.success("Abrimos seu e-mail com o pedido pronto. É só enviar.");
  }

  return (
    <Card icon={Trash2} iconCls="text-destructive" title={<span className="font-display text-xl font-normal text-destructive">Zona de perigo</span>} className="border-destructive/30">
      <p className="mb-4 text-sm text-muted-foreground">
        A exclusão da conta é permanente e remove todos os dados vinculados (clientes, lançamentos, tarefas, reuniões, dívidas, patrimônio e acessos). Pagamentos já efetuados não são reembolsados.
      </p>
      <button type="button" onClick={() => setAberto(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:bg-destructive/90">
        <Trash2 className="h-4 w-4" /> Excluir minha conta
      </button>

      <Dialog open={aberto} onOpenChange={(v) => { setAberto(v); if (!v) setTxt(""); }}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Excluir minha conta</DialogTitle>
            <DialogDescription>
              Por segurança, a exclusão é feita pela nossa equipe em até <strong>15 dias</strong>, conforme a LGPD. Vamos abrir seu e-mail com o pedido pronto para <strong>contato@rmconsultoria.finance</strong>.
            </DialogDescription>
          </DialogHeader>
          <Field label="Para confirmar, digite EXCLUIR">
            <input className={inputCls} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="EXCLUIR" name="confirma-exclusao" />
          </Field>
          <div className="flex justify-end gap-2">
            <Pill variant="ghost" onClick={() => setAberto(false)}>Cancelar</Pill>
            <button type="button" disabled={txt.trim() !== "EXCLUIR"} onClick={pedir} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50">
              Enviar pedido de exclusão
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
