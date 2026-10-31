/* Aba Sorteio: 1) QR Code  2) cadastro com bonequinho  3) roleta que a Marta gira. */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Gift, Loader2, Maximize2, Plus, QrCode, RotateCcw, Trash2, Trophy, Users } from "lucide-react";
import SiteLayout from "@/components/site/SiteLayout";
import RoletaSorteio, { anguloAlvo, type Fatia } from "@/components/site/RoletaSorteio";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AVATARES, corDoAvatar, dbSorteio as db } from "@/lib/sorteio";

type Sorteio = { id: string; titulo: string; premio: string; aberto: boolean; vencedor_id: string | null };
type Inscrito = { id: string; nome: string; email: string; nascimento: string; avatar: string };
const OURO = "#caa24a";
const NAVY = "#13213c";
const CHAVE = (id: string) => `sorteio-inscrito-${id}`;
const campo = "w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:border-[#caa24a] focus:ring-2 focus:ring-[#caa24a]/30";

function Confete() {
  const cores = [OURO, "#f3dfa6", "#ffffff", "#f7d6e0", "#cfe3f7"];
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      <style>{`@keyframes confete{0%{transform:translateY(-10vh) rotate(0)}100%{transform:translateY(110vh) rotate(720deg)}}`}</style>
      {Array.from({ length: 100 }, (_, i) => (
        <span key={i} className="absolute top-0 block h-3 w-2 rounded-sm"
          style={{ left: `${(i * 37) % 100}%`, background: cores[i % cores.length], animation: `confete ${2.5 + (i % 7) * 0.35}s linear ${(i % 10) * 0.15}s forwards` }} />
      ))}
    </div>
  );
}

const Passo = ({ n, titulo, children, id }: { n: number; titulo: string; children: React.ReactNode; id: string }) => (
  <section id={id} className="scroll-mt-24 border-b border-border py-12 lg:py-16">
    <div className="container-prose">
      <div className="mb-8 flex items-center gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full font-display text-2xl font-bold" style={{ background: NAVY, color: OURO }}>{n}</span>
        <h2 className="font-display text-3xl text-foreground lg:text-4xl">{titulo}</h2>
      </div>
      {children}
    </div>
  </section>
);

export default function Sorteio() {
  const [sorteio, setSorteio] = useState<Sorteio | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [fatias, setFatias] = useState<Fatia[]>([]);
  const [admin, setAdmin] = useState(false);
  // cadastro
  const [avatar, setAvatar] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [aceito, setAceito] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [inscrito, setInscrito] = useState<{ avatar: string; nome: string } | null>(null);
  // roleta
  const [rotacao, setRotacao] = useState(0);
  const [girando, setGirando] = useState(false);
  const [festa, setFesta] = useState(false);
  const [erroRoleta, setErroRoleta] = useState<string | null>(null);
  const pendente = useRef<string | null>(null);
  // ferramentas da Marta
  const [lista, setLista] = useState<Inscrito[]>([]);
  const [novoTitulo, setNovoTitulo] = useState("");

  const urlQr = `${window.location.origin}/sorteio#cadastro`;
  const vencedor = !girando && sorteio?.vencedor_id ? fatias.find((f) => f.id === sorteio.vencedor_id) ?? null : null;

  const carregarSorteio = useCallback(async () => {
    const { data } = await db.from("sorteios").select("id,titulo,premio,aberto,vencedor_id").order("created_at", { ascending: false }).limit(1);
    const s = (data?.[0] ?? null) as Sorteio | null;
    setSorteio(s);
    return s;
  }, []);

  const carregarRoleta = useCallback(async (id: string) => {
    const { data } = await db.rpc<Fatia[]>("roleta_sorteio", { _sorteio: id });
    setFatias(data ?? []);
  }, []);

  const carregarLista = useCallback(async (id: string) => {
    const { data } = await db.from("sorteio_participantes").select("id,nome,email,nascimento,avatar").eq("sorteio_id", id).order("created_at");
    setLista((data ?? []) as Inscrito[]);
  }, []);

  useEffect(() => {
    document.title = "Sorteio ao vivo | R&M Consultoria";
    (async () => {
      const s = await carregarSorteio();
      try { const salvo = s && localStorage.getItem(CHAVE(s.id)); if (salvo) setInscrito(JSON.parse(salvo)); } catch { /* sem armazenamento */ }
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data: ok } = await db.rpc<boolean>("has_role", { _user_id: u.user.id, _role: "admin" });
        setAdmin(!!ok);
      }
      setCarregando(false);
    })();
  }, [carregarSorteio]);

  // Quem chega pelo QR Code (…/sorteio#cadastro) já cai no formulário.
  useEffect(() => {
    if (carregando || !window.location.hash) return;
    const t = window.setTimeout(() => document.querySelector(window.location.hash)?.scrollIntoView({ block: "start" }), 50);
    return () => window.clearTimeout(t);
  }, [carregando]);

  // Atualiza a roleta (e o resultado) a cada 3 segundos, menos enquanto gira.
  useEffect(() => {
    if (!sorteio?.id || girando) return;
    const id = sorteio.id;
    const tick = () => { void carregarRoleta(id); void carregarSorteio(); if (admin) void carregarLista(id); };
    tick();
    const t = window.setInterval(tick, 3000);
    return () => window.clearInterval(t);
  }, [sorteio?.id, girando, admin, carregarRoleta, carregarSorteio, carregarLista]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!sorteio) return;
    setErro(null);
    if (!avatar) return setErro("Escolha o seu bonequinho.");
    if (nome.trim().length < 2) return setErro("Digite seu nome.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setErro("Digite um e-mail válido.");
    if (!nascimento) return setErro("Informe sua data de nascimento.");
    if (!aceito) return setErro("Marque a autorização para participar.");
    setEnviando(true);
    const { data, error } = await db.rpc<string>("inscrever_sorteio", {
      _sorteio: sorteio.id, _nome: nome.trim(), _email: email.trim(), _nascimento: nascimento, _consentimento: true, _avatar: avatar,
    });
    setEnviando(false);
    if (error) return setErro("Não foi possível enviar agora. Confira os dados e tente de novo.");
    if (data === "fechado") return setErro("As inscrições deste sorteio já foram encerradas.");
    const eu = { avatar, nome: nome.trim().split(/\s+/)[0] };
    try { localStorage.setItem(CHAVE(sorteio.id), JSON.stringify(eu)); } catch { /* sem armazenamento */ }
    setInscrito(eu);
    void carregarRoleta(sorteio.id);
    document.getElementById("roleta")?.scrollIntoView({ behavior: "smooth" });
  }

  async function girar(outraPessoa: boolean) {
    if (!sorteio || fatias.length === 0 || girando) return;
    setErroRoleta(null); setFesta(false);
    const { data, error } = await db.rpc<{ id: string }[]>("sortear", { _sorteio: sorteio.id, _excluir_atual: outraPessoa });
    const id = data?.[0]?.id;
    const indice = fatias.findIndex((f) => f.id === id);
    if (error || !id || indice < 0) { setErroRoleta(error?.message ?? "Não foi possível girar. Tente de novo."); return; }
    pendente.current = id;
    setGirando(true);
    requestAnimationFrame(() => setRotacao((r) => anguloAlvo(r, indice, fatias.length)));
  }

  async function fimDoGiro() {
    setGirando(false);
    setFesta(true);
    window.setTimeout(() => setFesta(false), 7000);
    await carregarSorteio();
  }

  async function apagar(p: Inscrito) {
    if (!sorteio || !window.confirm(`Apagar a inscrição de ${p.nome}?`)) return;
    await db.from("sorteio_participantes").delete().eq("id", p.id);
    void carregarLista(sorteio.id); void carregarRoleta(sorteio.id);
  }

  async function alternarInscricoes() {
    if (!sorteio) return;
    await db.from("sorteios").update({ aberto: !sorteio.aberto }).eq("id", sorteio.id);
    await carregarSorteio();
  }

  async function novoSorteio(e: React.FormEvent) {
    e.preventDefault();
    const titulo = novoTitulo.trim();
    if (titulo.length < 2) return;
    await db.from("sorteios").insert({ titulo });
    setNovoTitulo(""); setFatias([]); setLista([]); setRotacao(0);
    await carregarSorteio();
  }

  return (
    <SiteLayout>
      {festa && <Confete />}
      <section className="py-12 text-white lg:py-16" style={{ background: NAVY }}>
        <div className="container-prose text-center">
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider" style={{ background: OURO, color: NAVY }}>
            <Gift className="h-3.5 w-3.5" /> Sorteio ao vivo
          </span>
          <h1 className="mt-4 font-display text-4xl lg:text-6xl">Concorra a {sorteio ? sorteio.premio.charAt(0).toLowerCase() + sorteio.premio.slice(1) : "uma consultoria financeira gratuita"}</h1>
          {sorteio && <p className="mt-3 text-lg text-white/70">{sorteio.titulo}</p>}
          <p className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-lg">
            <Users className="h-5 w-5" style={{ color: OURO }} /> <b className="tabular-nums">{fatias.length}</b> {fatias.length === 1 ? "pessoa no jogo" : "pessoas no jogo"}
          </p>
        </div>
      </section>

      {carregando ? (
        <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin" style={{ color: OURO }} /></div>
      ) : !sorteio ? (
        <p className="py-24 text-center text-muted-foreground">Nenhum sorteio aberto no momento.</p>
      ) : (
        <>
          <Passo n={1} id="qrcode" titulo="Aponte a câmera do celular">
            <div className="grid items-center gap-8 md:grid-cols-[auto_1fr]">
              <div className="mx-auto rounded-3xl bg-white p-6 text-center shadow-xl ring-1 ring-border">
                <QRCodeSVG value={urlQr} size={300} level="M" marginSize={0} fgColor={NAVY} />
                <p className="mt-3 text-sm font-semibold" style={{ color: NAVY }}>{window.location.host}/sorteio</p>
              </div>
              <div className="space-y-3 text-lg text-foreground/85">
                <p className="flex items-center gap-3"><QrCode className="h-6 w-6 shrink-0" style={{ color: OURO }} /> Abra a câmera do celular e aponte para o QR Code.</p>
                <p>Toque no link que aparecer: você cai direto no cadastro (passo 2).</p>
                <p>Escolha seu bonequinho, preencha os dados e pronto — ele aparece na roleta (passo 3).</p>
                <p className="text-sm text-muted-foreground">Já está no celular? É só rolar a página para baixo.</p>
              </div>
            </div>
          </Passo>

          <Passo n={2} id="cadastro" titulo="Faça seu cadastro">
            {inscrito ? (
              <div className="mx-auto max-w-md text-center">
                <style>{`@keyframes pula{0%,100%{transform:translateY(0)}40%{transform:translateY(-12px)}}`}</style>
                <div className="mx-auto grid h-32 w-32 place-items-center rounded-full text-6xl shadow-xl" style={{ background: corDoAvatar(inscrito.avatar), animation: "pula 1.5s ease-in-out infinite" }}>{inscrito.avatar}</div>
                <h3 className="mt-5 font-display text-3xl">Você está no jogo, {inscrito.nome}!</h3>
                <p className="mt-2 text-muted-foreground">Seu bonequinho já está na roleta. Boa sorte! 🍀</p>
              </div>
            ) : !sorteio.aberto ? (
              <p className="text-center text-lg text-muted-foreground">As inscrições deste sorteio estão encerradas.</p>
            ) : (
              <form onSubmit={enviar} className="mx-auto max-w-xl space-y-5" noValidate>
                <fieldset>
                  <legend className="mb-3 font-semibold text-foreground">Escolha o seu bonequinho</legend>
                  <div className="grid grid-cols-6 gap-2 sm:grid-cols-8" role="radiogroup" aria-label="Bonequinho">
                    {AVATARES.map((a) => {
                      const ativo = a === avatar;
                      return (
                        <button key={a} type="button" role="radio" aria-checked={ativo} aria-label={`Bonequinho ${a}`} onClick={() => setAvatar(a)}
                          className={`grid aspect-square place-items-center rounded-2xl text-3xl transition ${ativo ? "scale-110" : "bg-secondary hover:bg-secondary/70"}`}
                          style={ativo ? { background: corDoAvatar(a), boxShadow: `0 0 0 3px ${OURO}` } : undefined}>{a}</button>
                      );
                    })}
                  </div>
                </fieldset>
                <label className="block"><span className="mb-1.5 block text-sm font-medium">Nome completo</span>
                  <input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" maxLength={120} /></label>
                <label className="block"><span className="mb-1.5 block text-sm font-medium">E-mail</span>
                  <input className={campo} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={200} /></label>
                <label className="block"><span className="mb-1.5 block text-sm font-medium">Data de nascimento</span>
                  <input className={campo} type="date" value={nascimento} onChange={(e) => setNascimento(e.target.value)} max={new Date().toISOString().slice(0, 10)} /></label>
                <label className="flex items-start gap-3 text-sm text-muted-foreground">
                  <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[#caa24a]" checked={aceito} onChange={(e) => setAceito(e.target.checked)} />
                  <span>Autorizo a R&amp;M Consultoria a usar meus dados para este sorteio e para entrar em contato comigo, conforme a LGPD.</span>
                </label>
                {erro && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p>}
                <Button type="submit" disabled={enviando} size="lg" className="h-14 w-full rounded-full text-base font-bold hover:opacity-90" style={{ background: OURO, color: NAVY }}>
                  {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Entrar no sorteio {avatar}</>}
                </Button>
              </form>
            )}
          </Passo>

          <Passo n={3} id="roleta" titulo="Roleta do sorteio">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
              <RoletaSorteio fatias={fatias} rotacao={rotacao} girando={girando} onFim={fimDoGiro} destaque={vencedor?.id ?? null} />
              <div className="text-center lg:text-left" aria-live="polite">
                {girando ? (
                  <p className="font-display text-4xl" style={{ color: OURO }}>Girando… 🤞</p>
                ) : vencedor ? (
                  <div>
                    <p className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground lg:justify-start"><Trophy className="h-4 w-4" style={{ color: OURO }} /> Vencedora</p>
                    <div className="mt-3 flex items-center justify-center gap-4 lg:justify-start">
                      <span className="grid h-24 w-24 place-items-center rounded-full text-5xl shadow-xl" style={{ background: corDoAvatar(vencedor.avatar), boxShadow: `0 0 0 5px ${OURO}` }}>{vencedor.avatar}</span>
                      <span className="font-display text-5xl lg:text-6xl" style={{ color: OURO }}>{vencedor.nome}</span>
                    </div>
                    <p className="mt-3 text-muted-foreground">Parabéns! Você ganhou {sorteio.premio.charAt(0).toLowerCase() + sorteio.premio.slice(1)}. 🎉</p>
                  </div>
                ) : (
                  <p className="text-xl text-muted-foreground">{fatias.length ? "A roleta está pronta. Quem será a sortuda?" : "A roleta vai se enchendo de bonequinhos conforme as pessoas se cadastram."}</p>
                )}

                <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                  {!vencedor && (
                    <Button size="lg" disabled={girando || fatias.length === 0} onClick={() => girar(false)}
                      className="h-16 rounded-full px-10 text-xl font-bold hover:opacity-90" style={{ background: OURO, color: NAVY }}>
                      {girando ? <Loader2 className="h-6 w-6 animate-spin" /> : <>🎡 Girar a roleta</>}
                    </Button>
                  )}
                  {admin && vencedor && fatias.length > 1 && (
                    <Button size="lg" variant="outline" disabled={girando} onClick={() => girar(true)} className="h-16 rounded-full px-6">
                      <RotateCcw className="mr-2 h-5 w-5" /> Girar de novo (outra pessoa)
                    </Button>
                  )}
                  <Button size="lg" variant="ghost" className="h-16 rounded-full" onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}>
                    <Maximize2 className="mr-2 h-5 w-5" /> Tela cheia
                  </Button>
                </div>
                {erroRoleta && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erroRoleta}</p>}
                <p className="mt-3 text-xs text-muted-foreground">
                  Qualquer pessoa pode girar — mas só uma vez: ao girar, as inscrições se encerram.
                  {admin ? " “Girar de novo” (só você vê) é para quando a vencedora não estiver presente." : <> Para girar de novo, só a Marta: <Link to={`/app/auth?next=${encodeURIComponent("/sorteio#roleta")}`} className="underline underline-offset-4">entrar</Link>.</>}
                </p>
              </div>
            </div>
          </Passo>

          {admin && (
            <section className="py-10">
              <div className="container-prose space-y-6">
                <details className="rounded-2xl border border-border bg-card p-5">
                  <summary className="cursor-pointer font-semibold">Ferramentas da Marta — inscritos com e-mail ({lista.length}) · não mostrar no telão</summary>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={alternarInscricoes}>{sorteio.aberto ? "Encerrar inscrições" : "Reabrir inscrições"}</Button>
                  </div>
                  <table className="mt-4 w-full text-left text-sm">
                    <thead className="text-muted-foreground"><tr><th className="py-1 font-normal">Nome</th><th className="font-normal">E-mail</th><th className="font-normal">Nascimento</th><th /></tr></thead>
                    <tbody>
                      {lista.map((p) => (
                        <tr key={p.id} className="border-t border-border">
                          <td className="py-2">{p.avatar} {p.nome}{p.id === sorteio.vencedor_id ? " 🏆" : ""}</td>
                          <td>{p.email}</td>
                          <td>{new Date(`${p.nascimento}T12:00:00`).toLocaleDateString("pt-BR")}</td>
                          <td className="text-right">
                            <button type="button" onClick={() => apagar(p)} aria-label={`Apagar ${p.nome}`} className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <form onSubmit={novoSorteio} className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
                    <input value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} placeholder="Começar um sorteio novo (ex.: Palestra Igreja X)" maxLength={120} className={`${campo} min-w-[240px] flex-1 py-2 text-sm`} />
                    <Button type="submit" variant="outline"><Plus className="mr-2 h-4 w-4" /> Novo sorteio</Button>
                  </form>
                </details>
              </div>
            </section>
          )}
        </>
      )}
    </SiteLayout>
  );
}
