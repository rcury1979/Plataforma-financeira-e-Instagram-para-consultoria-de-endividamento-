/* Sorteio ao vivo — página que o público abre pelo QR Code na palestra. */
import { useEffect, useState } from "react";
import { Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AVATARES, corDoAvatar, dbSorteio as db } from "@/lib/sorteio";

type Sorteio = { id: string; titulo: string; premio: string; aberto: boolean };
const CHAVE = (id: string) => `sorteio-inscrito-${id}`;
const OURO = "hsl(42 54% 54%)";
const campo = "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 outline-none focus:border-[hsl(42_54%_54%)]";

export default function Sorteio() {
  const [sorteio, setSorteio] = useState<Sorteio | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [avatar, setAvatar] = useState<string>("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [aceito, setAceito] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [inscrito, setInscrito] = useState<{ avatar: string; nome: string } | null>(null);

  useEffect(() => {
    document.title = "Sorteio | R&M Consultoria";
    (async () => {
      const id = new URLSearchParams(window.location.search).get("s");
      let q = db.from("sorteios").select("id,titulo,premio,aberto");
      q = id && /^[0-9a-f-]{36}$/i.test(id) ? q.eq("id", id) : q.order("created_at", { ascending: false });
      const { data } = await q.limit(1);
      const s = (data?.[0] ?? null) as Sorteio | null;
      setSorteio(s);
      try {
        const salvo = s && localStorage.getItem(CHAVE(s.id));
        if (salvo) setInscrito(JSON.parse(salvo));
      } catch { /* sem armazenamento */ }
      setCarregando(false);
    })();
  }, []);

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
  }

  return (
    <div className="min-h-screen bg-[hsl(222_47%_14%)] px-5 py-8 text-white">
      <style>{`@keyframes pula{0%,100%{transform:translateY(0) rotate(0)}30%{transform:translateY(-14px) rotate(-6deg)}60%{transform:translateY(0) rotate(4deg)}}`}</style>
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-2.5">
          <span className="border px-2 py-1 font-display text-xl" style={{ borderColor: OURO, color: OURO }}>R&amp;M</span>
          <span className="text-sm text-white/70">Consultoria Financeira · Marta Cury</span>
        </div>

        {carregando ? (
          <div className="flex justify-center py-24"><Loader2 className="h-7 w-7 animate-spin" style={{ color: OURO }} /></div>
        ) : !sorteio ? (
          <p className="mt-16 text-center text-white/80">Nenhum sorteio aberto no momento.</p>
        ) : inscrito ? (
          <div className="mt-14 text-center">
            <div className="mx-auto grid h-36 w-36 place-items-center rounded-full text-7xl shadow-2xl"
              style={{ background: corDoAvatar(inscrito.avatar), animation: "pula 1.6s ease-in-out infinite" }}>{inscrito.avatar}</div>
            <h1 className="mt-6 font-display text-3xl">Você está no jogo, {inscrito.nome}!</h1>
            <p className="mt-3 text-white/75">Olhe para o telão: o seu bonequinho já está lá. O resultado sai ao vivo. Boa sorte! 🍀</p>
            <p className="mt-8 text-sm text-white/50">{sorteio.titulo}</p>
          </div>
        ) : !sorteio.aberto ? (
          <div className="mt-16 text-center">
            <h1 className="font-display text-3xl">Inscrições encerradas</h1>
            <p className="mt-3 text-white/75">O sorteio já foi realizado. Obrigada por estar aqui!</p>
          </div>
        ) : (
          <>
            <div className="mt-8">
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-[hsl(222_47%_14%)]" style={{ background: OURO }}>
                <Gift className="h-3.5 w-3.5" /> Sorteio ao vivo
              </span>
              <h1 className="mt-4 font-display text-3xl leading-tight">Concorra a {sorteio.premio.charAt(0).toLowerCase() + sorteio.premio.slice(1)}</h1>
              <p className="mt-2 text-white/70">{sorteio.titulo}</p>
            </div>

            <form onSubmit={enviar} className="mt-7 space-y-5" noValidate>
              <fieldset>
                <legend className="mb-2 text-sm text-white/80">1. Escolha o seu bonequinho</legend>
                <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Avatar">
                  {AVATARES.map((a) => {
                    const ativo = a === avatar;
                    return (
                      <button key={a} type="button" role="radio" aria-checked={ativo} aria-label={`Avatar ${a}`} onClick={() => setAvatar(a)}
                        className={`grid aspect-square place-items-center rounded-2xl text-3xl transition ${ativo ? "scale-110 ring-4" : "bg-white/10 hover:bg-white/20"}`}
                        style={ativo ? { background: corDoAvatar(a), boxShadow: `0 0 0 3px ${OURO}` } : undefined}>
                        {a}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <p className="text-sm text-white/80">2. Seus dados</p>
              <label className="block">
                <span className="mb-1.5 block text-sm text-white/70">Nome completo</span>
                <input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" maxLength={120} required />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-white/70">E-mail</span>
                <input className={campo} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={200} required />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-white/70">Data de nascimento</span>
                <input className={`${campo} [color-scheme:dark]`} type="date" value={nascimento} onChange={(e) => setNascimento(e.target.value)} max={new Date().toISOString().slice(0, 10)} required />
              </label>
              <label className="flex items-start gap-3 text-sm text-white/75">
                <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[hsl(42_54%_54%)]" checked={aceito} onChange={(e) => setAceito(e.target.checked)} />
                <span>Autorizo a R&amp;M Consultoria a usar meus dados para este sorteio e para entrar em contato comigo, conforme a LGPD.</span>
              </label>
              {erro && <p role="alert" className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{erro}</p>}
              <Button type="submit" disabled={enviando} size="lg" className="h-14 w-full rounded-full text-base font-bold text-[hsl(222_47%_14%)] hover:opacity-90" style={{ background: OURO }}>
                {enviando ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Entrar no sorteio {avatar}</>}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
