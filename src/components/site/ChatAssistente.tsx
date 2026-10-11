import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles, ShieldCheck } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { respostaLocal } from "./chatRespostasLocais";

type Msg = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "rm-chat-assistente-v1";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

const BOAS_VINDAS: Msg = {
  role: "assistant",
  content:
    "Oi! 💛 Sou a assistente virtual da RM Consultoria.\n\nPosso tirar dúvidas sobre **finanças pessoais, dívidas, palestras, cursos e a nossa plataforma**. Como posso te ajudar hoje?",
};

const SUGESTOES = [
  "Estou endividado, por onde começo?",
  "Como funcionam as palestras gratuitas?",
  "Quais são os planos da plataforma?",
  "Quero baixar a planilha grátis",
];

export default function ChatAssistente() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([BOAS_VINDAS]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // load from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
    } catch {}
  }, []);

  // persist
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming, open]);

  // focus on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  async function enviar(texto?: string) {
    const conteudo = (texto ?? input).trim();
    if (!conteudo || streaming) return;

    const novasUser: Msg[] = [...messages, { role: "user", content: conteudo }];
    setMessages(novasUser);
    setInput("");
    setStreaming(true);
    // placeholder do assistant
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const escrever = (texto: string) =>
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: texto };
        return copy;
      });

    // Site de teste ou sem servidor configurado: responde com as respostas prontas.
    if (import.meta.env.VITE_TEST_SITE === "1" || !SUPABASE_URL || !SUPABASE_KEY) {
      await new Promise((r) => setTimeout(r, 400));
      escrever(respostaLocal(conteudo));
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }

    // Se a IA não começar a responder em 25 s, cancela e usa a resposta pronta.
    const ctrl = new AbortController();
    let timer = window.setTimeout(() => ctrl.abort(), 25000);
    let acc = "";
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/chat-assistente`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
        },
        body: JSON.stringify({ messages: novasUser }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Erro ${res.status}`);
      }
      if (!res.body) throw new Error("Sem resposta do servidor");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // Chegou dado: renova o prazo (a resposta pode demorar a terminar).
        window.clearTimeout(timer);
        timer = window.setTimeout(() => ctrl.abort(), 25000);
        buffer += decoder.decode(value, { stream: true });
        const linhas = buffer.split("\n");
        buffer = linhas.pop() ?? "";
        for (const linha of linhas) {
          const t = linha.trim();
          if (!t || !t.startsWith("data:")) continue;
          const payload = t.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const j = JSON.parse(payload);
            const delta = j?.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              acc += delta;
              escrever(acc);
            }
          } catch {
            /* linha incompleta: ignora */
          }
        }
      }
      if (!acc.trim()) throw new Error("Resposta vazia");
    } catch (e) {
      console.warn("chat-assistente indisponível, usando resposta pronta:", e);
      // Se a IA chegou a escrever algo, mantém; senão, usa a resposta pronta.
      if (!acc.trim()) escrever(respostaLocal(conteudo));
    } finally {
      window.clearTimeout(timer);
      setStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function limpar() {
    setMessages([BOAS_VINDAS]);
  }

  return (
    <>
      {/* Botão flutuante — à esquerda do WhatsApp */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir chat de dúvidas"
          className="fixed bottom-6 right-24 z-50 group flex items-center gap-3"
        >
          <span className="hidden sm:flex items-center px-4 py-2 rounded-full bg-card text-foreground text-sm font-medium shadow-card border border-border opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
            Tire suas dúvidas
          </span>
          <span
            className="relative flex items-center justify-center w-14 h-14 rounded-full text-white shadow-lg hover:scale-110 transition-transform"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(20 70% 45%) 100%)",
              boxShadow: "0 10px 30px -8px hsl(var(--primary) / 0.6)",
            }}
          >
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-background" />
            <MessageCircle className="w-7 h-7" />
          </span>
        </button>
      )}

      {/* Janela do chat */}
      {open && (
        <div
          role="dialog"
          aria-label="Chat de dúvidas"
          className="fixed z-50 bg-background border border-border shadow-2xl flex flex-col
                     inset-x-3 bottom-3 top-16 rounded-2xl
                     sm:inset-auto sm:bottom-6 sm:right-6 sm:top-auto sm:w-[380px] sm:h-[560px]"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 rounded-t-2xl text-white"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(20 70% 45%) 100%)" }}
          >
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-white/20 grid place-items-center">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <p className="font-semibold text-sm leading-tight">Assistente RM</p>
                <p className="text-xs text-white/85 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Online — responde na hora
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar chat"
              className="p-1.5 rounded-lg hover:bg-white/20 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mensagens */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card text-foreground border border-border rounded-bl-sm shadow-sm"
                  }`}
                >
                  {m.role === "assistant" && m.content === "" && streaming ? (
                    <span className="inline-flex gap-1 items-center py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  ) : m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-a:text-primary">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  )}
                </div>
              </div>
            ))}

            {messages.length <= 1 && !streaming && (
              <div className="pt-2 space-y-2">
                <p className="text-xs text-muted-foreground px-1">Sugestões rápidas:</p>
                {SUGESTOES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => enviar(s)}
                    className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-card border border-border hover:border-primary hover:text-primary transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rodapé com input */}
          <div className="border-t border-border bg-card rounded-b-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                enviar();
              }}
              className="flex items-end gap-2 p-3"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    enviar();
                  }
                }}
                rows={1}
                placeholder="Digite sua pergunta..."
                disabled={streaming}
                maxLength={1000}
                className="flex-1 resize-none max-h-24 text-sm px-3 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                aria-label="Enviar"
                className="w-10 h-10 rounded-xl bg-primary text-primary-foreground grid place-items-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between px-3 pb-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Protegido pela LGPD
              </span>
              <button
                type="button"
                onClick={limpar}
                className="hover:text-foreground transition"
              >
                Limpar conversa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
