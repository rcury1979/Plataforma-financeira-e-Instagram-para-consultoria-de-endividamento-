/* Painel do sorteio (só a administradora): QR Code no telão, bonequinhos chegando ao vivo e botão Sortear. */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Gift, Loader2, Lock, Maximize2, Plus, RotateCcw, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { corDoAvatar, dbSorteio as db } from "@/lib/sorteio";

type Sorteio = { id: string; titulo: string; premio: string; aberto: boolean; vencedor_id: string | null; created_at: string };
type Participante = { id: string; nome: string; email: string; nascimento: string; avatar: string; created_at: string };
const OURO = "hsl(42 54% 54%)";
const primeiroNome = (n: string) => n.trim().split(/\s+/)[0];
const btnClaro = "border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white";

const CSS = `
@keyframes chega{0%{transform:scale(0) rotate(-20deg);opacity:0}70%{transform:scale(1.2) rotate(6deg);opacity:1}100%{transform:scale(1) rotate(0)}}
@keyframes confete{0%{transform:translateY(-10vh) rotate(0)}100%{transform:translateY(110vh) rotate(720deg)}}
@keyframes brilho{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
`;

function Confete() {
  const cores = ["#caa24a", "#f3dfa6", "#ffffff", "#f7d6e0", "#cfe3f7"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {Array.from({ length: 90 }, (_, i) => (
        <span key={i} className="absolute top-0 block h-3 w-2 rounded-sm"
          style={{ left: `${(i * 37) % 100}%`, background: cores[i % cores.length], animation: `confete ${2.5 + (i % 7) * 0.35}s linear ${(i % 10) * 0.15}s forwards` }} />
      ))}
    </div>
  );
}

export default function SorteioPainel() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<"carregando" | "negado" | "ok">("carregando");
  const [sorteios, setSorteios] = useState<Sorteio[]>([]);
  const [atualId, setAtualId] = useState<string | null>(null);
  const [lista, setLista] = useState<Participante[]>([]);
  const [girando, setGirando] = useState(false);
  const [naTela, setNaTela] = useState<Participante | null>(null);
  const [festa, setFesta] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [novoTitulo, setNovoTitulo] = useState("");
  const timer = useRef<number | null>(null);

  const atual = sorteios.find((s) => s.id === atualId) ?? null;
  const url = `${window.location.origin}/treinamento/sorteio${atual ? `?s=${atual.id}` : ""}`;
  const vencedor = atual?.vencedor_id ? lista.find((p) => p.id === atual.vencedor_id) ?? null : null;

  const carregarSorteios = useCallback(async () => {
    const { data } = await db.from("sorteios").select("id,titulo,premio,aberto,vencedor_id,created_at").order("created_at", { ascending: false });
    const ss = (data ?? []) as Sorteio[];
    setSorteios(ss);
    setAtualId((id) => id ?? ss[0]?.id ?? null);
  }, []);

  const carregarLista = useCallback(async (id: string) => {
    const { data } = await db.from("sorteio_participantes").select("id,nome,email,nascimento,avatar,created_at").eq("sorteio_id", id).order("created_at", { ascending: true });
    setLista((data ?? []) as Participante[]);
  }, []);

  useEffect(() => {
    document.title = "Painel do sorteio | R&M Consultoria";
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { navigate(`/app/auth?next=${encodeURIComponent("/treinamento/sorteio/painel")}`, { replace: true }); return; }
      const { data: admin } = await db.rpc<boolean>("has_role", { _user_id: u.user.id, _role: "admin" });
      if (!admin) { setEstado("negado"); return; }
      await carregarSorteios();
      setEstado("ok");
    })();
  }, [navigate, carregarSorteios]);

  // Novos inscritos aparecem a cada 3 segundos.
  useEffect(() => {
    if (estado !== "ok" || !atualId) return;
    void carregarLista(atualId);
    const t = window.setInterval(() => void carregarLista(atualId), 3000);
    return () => window.clearInterval(t);
  }, [estado, atualId, carregarLista]);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  async function sortear(excluirAtual: boolean) {
    if (!atual || lista.length === 0 || girando) return;
    setErro(null); setFesta(false); setGirando(true);
    const { data, error } = await db.rpc<{ id: string }[]>("sortear", { _sorteio: atual.id, _excluir_atual: excluirAtual });
    const ganhadorId = data?.[0]?.id;
    if (error || !ganhadorId) { setGirando(false); setErro(error?.message ?? "Não foi possível sortear."); return; }
    // Suspense: bonequinhos passando na tela, desacelerando, até parar na vencedora.
    let passo = 0; let atraso = 55;
    const girar = () => {
      passo += 1; atraso *= 1.045;
      if (passo < 40) {
        setNaTela(lista[Math.floor(Math.random() * lista.length)]);
        timer.current = window.setTimeout(girar, atraso);
      } else {
        void (async () => {
          await Promise.all([carregarLista(atual.id), carregarSorteios()]);
          setNaTela(null); setGirando(false); setFesta(true);
          timer.current = window.setTimeout(() => setFesta(false), 7000);
        })();
      }
    };
    girar();
  }

  async function alternarInscricoes() {
    if (!atual) return;
    await db.from("sorteios").update({ aberto: !atual.aberto }).eq("id", atual.id);
    await carregarSorteios();
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    const titulo = novoTitulo.trim();
    if (titulo.length < 2) return;
    const { data, error } = await db.from("sorteios").insert({ titulo }).select("id").single();
    if (error) { setErro("Não foi possível criar o sorteio."); return; }
    setNovoTitulo("");
    setAtualId(data.id);
    await carregarSorteios();
  }

  if (estado === "carregando") return <div className="grid min-h-screen place-items-center bg-[hsl(222_47%_14%)]"><Loader2 className="h-8 w-8 animate-spin" style={{ color: OURO }} /></div>;
  if (estado === "negado") return (
    <div className="grid min-h-screen place-items-center bg-[hsl(222_47%_14%)] p-6 text-center text-white">
      <div><Lock className="mx-auto h-10 w-10" style={{ color: OURO }} /><p className="mt-4">Este painel é só da administradora.</p></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(222_47%_14%)] text-white">
      <style>{CSS}</style>
      {festa && <Confete />}
      <div className="mx-auto max-w-7xl px-5 py-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="border px-2 py-1 font-display text-xl" style={{ borderColor: OURO, color: OURO }}>R&amp;M</span>
            <select value={atualId ?? ""} onChange={(e) => setAtualId(e.target.value)} aria-label="Escolher sorteio"
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white [color-scheme:dark]">
              {sorteios.map((s) => <option key={s.id} value={s.id}>{s.titulo}{s.aberto ? "" : " (encerrado)"}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className={btnClaro} onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}>
              <Maximize2 className="mr-2 h-4 w-4" /> Tela cheia
            </Button>
            {atual && (
              <Button variant="outline" size="sm" className={btnClaro} onClick={alternarInscricoes}>
                {atual.aberto ? "Encerrar inscrições" : "Reabrir inscrições"}
              </Button>
            )}
          </div>
        </header>

        {!atual ? (
          <p className="mt-20 text-center text-white/70">Crie um sorteio abaixo para começar.</p>
        ) : (
          <>
            <div className="mt-6 grid items-start gap-8 lg:grid-cols-[auto_1fr]">
              <div className="rounded-3xl bg-white p-6 text-center text-[hsl(222_47%_14%)]">
                <QRCodeSVG value={url} size={280} level="M" marginSize={0} fgColor="#13213c" />
                <p className="mt-4 font-semibold">Aponte a câmera do celular 📱</p>
                <p className="text-xs text-neutral-500">{`${window.location.host}/treinamento/sorteio`}</p>
              </div>

              <div>
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-[hsl(222_47%_14%)]" style={{ background: OURO }}>
                  <Gift className="h-3.5 w-3.5" /> {atual.premio}
                </span>
                <h1 className="mt-3 font-display text-4xl lg:text-5xl">{atual.titulo}</h1>
                <p className="mt-3 flex flex-wrap items-center gap-2 text-2xl">
                  <Users className="h-6 w-6" style={{ color: OURO }} /> <b className="tabular-nums">{lista.length}</b> {lista.length === 1 ? "pessoa no jogo" : "pessoas no jogo"}
                  <span className={`rounded-full px-2.5 py-0.5 text-xs ${atual.aberto ? "bg-green-500/20 text-green-200" : "bg-white/10 text-white/60"}`}>{atual.aberto ? "inscrições abertas" : "inscrições encerradas"}</span>
                </p>

                <div className="mt-6 grid min-h-[230px] place-items-center rounded-3xl border border-white/15 bg-white/5 p-6 text-center" aria-live="polite">
                  {girando && naTela ? (
                    <div>
                      <div className="mx-auto grid h-28 w-28 place-items-center rounded-full text-6xl" style={{ background: corDoAvatar(naTela.avatar) }}>{naTela.avatar}</div>
                      <p className="mt-3 font-display text-4xl" style={{ color: OURO }}>{primeiroNome(naTela.nome)}</p>
                    </div>
                  ) : vencedor ? (
                    <div>
                      <div className="mx-auto grid h-36 w-36 place-items-center rounded-full text-7xl shadow-2xl"
                        style={{ background: corDoAvatar(vencedor.avatar), animation: "brilho 1.2s ease-in-out infinite", boxShadow: `0 0 0 6px ${OURO}` }}>{vencedor.avatar}</div>
                      <p className="mt-4 flex items-center justify-center gap-2 text-sm uppercase tracking-[0.25em] text-white/70"><Trophy className="h-4 w-4" style={{ color: OURO }} /> Vencedora</p>
                      <p className="mt-1 font-display text-5xl lg:text-7xl" style={{ color: OURO }}>{vencedor.nome}</p>
                    </div>
                  ) : (
                    <p className="text-xl text-white/60">{lista.length ? "Tudo pronto! Quando quiser, aperte Sortear." : "Aguardando os primeiros bonequinhos…"}</p>
                  )}
                </div>

                {erro && <p role="alert" className="mt-4 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{erro}</p>}

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button size="lg" disabled={girando || lista.length === 0} onClick={() => sortear(false)}
                    className="h-16 rounded-full px-10 text-xl font-bold text-[hsl(222_47%_14%)] hover:opacity-90" style={{ background: OURO }}>
                    {girando ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Trophy className="mr-2 h-6 w-6" /> Sortear</>}
                  </Button>
                  {vencedor && !girando && lista.length > 1 && (
                    <Button size="lg" variant="outline" onClick={() => sortear(true)} className={`h-16 rounded-full px-6 ${btnClaro}`}>
                      <RotateCcw className="mr-2 h-5 w-5" /> Sortear outra pessoa
                    </Button>
                  )}
                </div>
                <p className="mt-2 text-xs text-white/50">Ao sortear, as inscrições se encerram. “Sortear outra pessoa” é para quando a vencedora não estiver presente.</p>
              </div>
            </div>

            {/* Mural de bonequinhos: cada inscrição nova "pula" na tela */}
            {lista.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                {lista.map((p) => (
                  <div key={p.id} className="flex w-20 flex-col items-center" style={{ animation: "chega .6s ease-out both" }} title={p.nome}>
                    <div className={`grid h-14 w-14 place-items-center rounded-full text-3xl ${p.id === atual.vencedor_id ? "ring-4 ring-[hsl(42_54%_54%)]" : ""}`}
                      style={{ background: corDoAvatar(p.avatar) }}>{p.avatar}</div>
                    <span className="mt-1 w-full truncate text-center text-xs text-white/80">{primeiroNome(p.nome)}</span>
                  </div>
                ))}
              </div>
            )}

            {lista.length > 0 && (
              <details className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-4">
                <summary className="cursor-pointer text-sm text-white/80">Lista completa com e-mails ({lista.length}) — não mostrar no telão</summary>
                <table className="mt-3 w-full text-left text-sm">
                  <thead className="text-white/50"><tr><th className="py-1 font-normal">Nome</th><th className="font-normal">E-mail</th><th className="font-normal">Nascimento</th></tr></thead>
                  <tbody>
                    {lista.map((p) => (
                      <tr key={p.id} className="border-t border-white/10">
                        <td className="py-1.5">{p.avatar} {p.nome}{p.id === atual.vencedor_id ? " 🏆" : ""}</td><td>{p.email}</td><td>{new Date(`${p.nascimento}T12:00:00`).toLocaleDateString("pt-BR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
          </>
        )}

        <form onSubmit={criar} className="mt-8 flex flex-wrap gap-2 border-t border-white/10 pt-6">
          <input value={novoTitulo} onChange={(e) => setNovoTitulo(e.target.value)} placeholder="Nome de um novo sorteio (ex.: Palestra Igreja X)" maxLength={120}
            className="min-w-[260px] flex-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40" />
          <Button type="submit" variant="outline" className={btnClaro}><Plus className="mr-2 h-4 w-4" /> Novo sorteio</Button>
        </form>
      </div>
    </div>
  );
}
