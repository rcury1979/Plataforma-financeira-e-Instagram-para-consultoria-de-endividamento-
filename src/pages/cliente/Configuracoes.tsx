/* Configurações: dados cadastrais, contas, cartões e categorias. */
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Camera, MessageCircle, User, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { db, useEducadorView, useUserId, useCadastros, PageHeader, Panel, PanelTitle, Pill, Field, inputCls } from "./_shared";
import { ContasTab, CartoesTab, CategoriasTab } from "./_configuracoes-cadastros";
import { AssinaturaTab } from "./_assinatura";

type Aba = "dados" | "contas" | "cartoes" | "categorias" | "plano";
const ABAS: { id: Aba; label: string }[] = [
  { id: "dados", label: "Dados" }, { id: "contas", label: "Contas" }, { id: "cartoes", label: "Cartões" }, { id: "categorias", label: "Categorias" },
  { id: "plano", label: "Plano" },
];

export default function Configuracoes() {
  const userId = useUserId();
  const cad = useCadastros(userId);
  const [params] = useSearchParams();
  const [aba, setAba] = useState<Aba>(params.get("aba") === "plano" ? "plano" : "dados");
  // A aba "Plano" é do próprio cliente; a educadora, vendo a ficha dele, não a enxerga.
  const educador = useEducadorView();
  const abas = educador ? ABAS.filter((a) => a.id !== "plano") : ABAS;

  return (
    <div>
      <PageHeader title="Configurações" desc="Dados cadastrais, contas bancárias, cartões, categorias e seu plano." />
      <div role="tablist" className={`mb-5 grid ${abas.length === 5 ? "grid-cols-5" : "grid-cols-4"} rounded-full border border-border bg-secondary p-1 text-[12px] sm:text-sm`}>
        {abas.map((a) => (
          <button key={a.id} role="tab" type="button" aria-selected={aba === a.id} onClick={() => setAba(a.id)}
            className={`rounded-full py-2 transition ${aba === a.id ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {a.label}
          </button>
        ))}
      </div>
      {userId && aba === "dados" && <DadosTab userId={userId} />}
      {userId && aba === "contas" && <ContasTab userId={userId} contas={cad.contas} reload={cad.reload} />}
      {userId && aba === "cartoes" && <CartoesTab userId={userId} cartoes={cad.cartoes} contas={cad.contas} contaById={cad.contaById} reload={cad.reload} />}
      {userId && aba === "categorias" && <CategoriasTab userId={userId} categorias={cad.categorias} reload={cad.reload} />}
      {!educador && aba === "plano" && <AssinaturaTab />}
    </div>
  );
}

/** (21) 99999-9999 */
const mascaraTelefone = (s: string) => {
  const d = s.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : "";
  const resto = d.slice(2);
  const corte = d.length === 11 ? 5 : 4;
  return `(${d.slice(0, 2)}) ${resto.slice(0, corte)}${resto.length > corte ? "-" + resto.slice(corte) : ""}`;
};

function DadosTab({ userId }: { userId: string }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const [{ data: u }, { data: p }] = await Promise.all([
        supabase.auth.getUser(),
        db.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      ]);
      setEmail(u.user?.email ?? p?.email ?? "");
      setNome(p?.full_name ?? "");
      setTel(mascaraTelefone(p?.phone ?? ""));
      setAvatar(p?.avatar_url ?? null);
    })();
  }, [userId]);

  const salvar = async () => {
    if (!nome.trim()) return toast.error("Informe seu nome completo.");
    const dig = tel.replace(/\D/g, "");
    if (dig && dig.length < 10) return toast.error("Telefone incompleto. Use o formato (21) 99999-9999.");
    setSaving(true);
    const { error } = await db.from("profiles").update({ full_name: nome.trim(), phone: tel || null }).eq("user_id", userId);
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar seus dados.");
    toast.success("Dados salvos.");
  };

  const enviarFoto = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return toast.error("Use uma imagem JPG, PNG ou WebP.");
    if (file.size > 5 * 1024 * 1024) return toast.error("A foto deve ter no máximo 5 MB.");
    setEnviando(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error } = await db.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      setEnviando(false);
      return toast.info("Envio de foto indisponível por aqui", { description: "No site de teste não dá para enviar arquivos. No app de verdade sua foto aparece na hora." });
    }
    const url = db.storage.from("avatars").getPublicUrl(path).data?.publicUrl ?? null;
    await db.from("profiles").update({ avatar_url: url }).eq("user_id", userId);
    setAvatar(url);
    setEnviando(false);
    toast.success("Foto atualizada.");
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Panel className="sm:p-6">
        <PanelTitle>Dados cadastrais</PanelTitle>
        <div className="space-y-4">
          <Field label="Nome completo *"><input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} /></Field>
          <Field label="E-mail" hint="Para trocar o e-mail, fale com sua educadora.">
            <input className={inputCls + " cursor-not-allowed opacity-70"} value={email} readOnly />
          </Field>
          <Field label="Telefone">
            <div className="flex gap-2">
              <span className="grid h-10 w-14 shrink-0 place-items-center rounded-full border border-border bg-secondary text-base" aria-label="Brasil">🇧🇷</span>
              <input className={inputCls} inputMode="tel" value={tel} onChange={(e) => setTel(mascaraTelefone(e.target.value))} placeholder="(21) 99999-9999" />
            </div>
          </Field>
          <div className="flex justify-end">
            <Pill variant="solid" onClick={salvar} disabled={saving}>Salvar</Pill>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4 border-t border-border pt-6 sm:justify-center">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-gold-soft text-gold ring-1 ring-gold/30">
            {avatar ? <img src={avatar} alt="Sua foto" className="h-full w-full object-cover" /> : <UserRound className="h-8 w-8" />}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Foto do cliente</p>
            <Pill className="mt-1.5 h-8 px-3 text-xs" onClick={() => fileRef.current?.click()} disabled={enviando}>
              <Camera className="h-3.5 w-3.5" /> {enviando ? "Enviando..." : "Enviar foto"}
            </Pill>
            <p className="mt-1 text-[11px] text-muted-foreground">JPG, PNG ou WebP · máx. 5 MB</p>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) enviarFoto(f); }} />
          </div>
        </div>
      </Panel>

      <Panel className="self-start sm:p-6">
        <PanelTitle icon={User}>Sua educadora financeira</PanelTitle>
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary font-display text-lg text-primary-foreground">MC</span>
          <div className="min-w-0">
            <p className="font-medium text-foreground">Marta Cury</p>
            <p className="text-xs text-muted-foreground">Acompanha suas finanças aqui na R&amp;M&nbsp;360°</p>
          </div>
        </div>
        <a href="https://wa.me/5521986000039" target="_blank" rel="noreferrer"
          className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-full bg-success px-4 text-sm font-medium text-success-foreground hover:bg-success/90">
          <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
        </a>
      </Panel>
    </div>
  );
}
