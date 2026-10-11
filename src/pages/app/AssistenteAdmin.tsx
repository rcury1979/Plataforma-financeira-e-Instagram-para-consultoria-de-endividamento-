import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, type UIMessage } from "ai";
import { Link } from "react-router-dom";
import { ChevronLeft, Copy, Download, ShieldCheck, MessageSquareText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse, MessageActions, MessageAction } from "@/components/ai-elements/message";
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from "@/components/ai-elements/prompt-input";
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";

function AdminChat({ userId, initialMessages }: { userId: string; initialMessages: UIMessage[] }) {
  const [input, setInput] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const transport = useMemo(() => new DefaultChatTransport({
    api: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-assistant`,
    headers: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Entre novamente na sua conta.");
      return { Authorization: `Bearer ${session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY };
    },
    prepareSendMessagesRequest: ({ messages, headers, credentials, api }) => ({ api, headers, credentials, body: {
      messages: messages.filter(m => m.role !== "system").map(m => ({ id: m.id, role: m.role, parts: m.parts.filter(p => p.type === "text").map(p => ({ type: "text", text: p.text })) })),
    } }),
  }), []);
  const { messages, sendMessage, stop, status, error } = useChat({ id: userId, messages: initialMessages, transport, onError: e => toast.error(e.message) });
  const busy = status === "submitted" || status === "streaming";
  useEffect(() => { textarea.current?.focus(); }, [status]);
  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    setInput("");
    await sendMessage({ text: text.trim() });
  };
  const download = () => {
    const text = messages.map(m => `${m.role === "user" ? "Administrador" : "Assistente R&M"}\n${m.parts.filter(p => p.type === "text").map(p => p.text).join("\n")}`).join("\n\n---\n\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "conversa-assistente-rm.txt"; link.click(); URL.revokeObjectURL(url);
  };
  const names: Record<string, string> = { consultar_clientes: "Consultar clientes", consultar_jornada: "Consultar jornada do cliente", consultar_operacao: "Consultar operação" };
  return <div className="flex h-[min(760px,75dvh)] min-h-[420px] flex-col">
    <div className="flex items-center justify-between border-b border-border pb-3">
      <span className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" />Histórico privado da sua conta</span>
      <Button variant="ghost" size="icon" title="Baixar conversa" aria-label="Baixar conversa" disabled={!messages.length} onClick={download}><Download className="h-4 w-4" /></Button>
    </div>
    <Conversation className="min-h-0 flex-1">
      <ConversationContent className="px-0 py-5">
        {!messages.length && <div className="py-10 text-center"><MessageSquareText className="mx-auto mb-4 h-9 w-9 text-primary" /><h2 className="text-lg font-medium">Como posso ajudar hoje?</h2><div className="mt-6 flex flex-wrap justify-center gap-2">{["Quais clientes precisam de atenção?", "Prepare um plano de mentoria financeira", "Resuma minhas tarefas e próximos atendimentos", "Ajude a revisar as categorias de um cliente"].map(s => <Button key={s} variant="outline" size="sm" className="h-auto whitespace-normal py-2" onClick={() => send(s)}>{s}</Button>)}</div></div>}
        {messages.map(m => <Message key={m.id} from={m.role} className="max-w-full">
          <MessageContent className={m.role === "user" ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground" : "w-full"}>
            {m.parts.map((p, i) => {
              if (p.type === "text") return <MessageResponse key={i}>{p.text}</MessageResponse>;
              if (p.type === "reasoning") return <Reasoning key={i} defaultOpen={false} isStreaming={busy && p.state === "streaming"}><ReasoningTrigger getThinkingMessage={streaming => streaming ? "Analisando…" : "Análise da assistente"} /><ReasoningContent>{p.text}</ReasoningContent></Reasoning>;
              if (isToolUIPart(p)) return <Tool key={i} defaultOpen={false}><ToolHeader type="dynamic-tool" toolName={p.type === "dynamic-tool" ? p.toolName : p.type.replace("tool-", "")} state={p.state} title={names[p.type.replace("tool-", "")] || "Consulta autorizada"} /><ToolContent><ToolInput input={p.input} /><ToolOutput output={p.output} errorText={p.errorText} /></ToolContent></Tool>;
              return null;
            })}
          </MessageContent>
          {m.role === "assistant" && <MessageActions><MessageAction tooltip="Copiar resposta" onClick={() => { void navigator.clipboard.writeText(m.parts.filter(p => p.type === "text").map(p => p.text).join("\n")); }}><Copy className="h-4 w-4" /></MessageAction></MessageActions>}
        </Message>)}
        {status === "submitted" && <Shimmer>Consultando e preparando sua resposta…</Shimmer>}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
    {error && <div role="alert" className="mb-3 break-words rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error.message}<Button size="sm" variant="outline" className="mt-2" onClick={async () => { const { error: resumeError } = await supabase.functions.invoke("admin-assistant", { body: { action: "resume" } }); if (resumeError) toast.error("A pausa não pôde ser liberada. Verifique o acesso à IA e os créditos."); else toast.success("Pausa liberada. Envie uma nova pergunta quando quiser."); }}>Já regularizei os créditos</Button></div>}
    <PromptInput onSubmit={({ text }) => send(text)}>
      <PromptInputTextarea ref={textarea} autoFocus aria-label="Pedido para a assistente" placeholder="O que você precisa resolver hoje?" value={input} onChange={e => setInput(e.target.value)} maxLength={12000} className="min-h-[90px]" />
      <PromptInputFooter><span className="text-xs text-muted-foreground">Lovable AI · Recomendações para sua revisão</span><PromptInputSubmit status={status} onStop={stop} disabled={!busy && !input.trim()} aria-label={busy ? "Parar resposta" : "Enviar pedido"} /></PromptInputFooter>
    </PromptInput>
  </div>;
}

export default function AssistenteAdmin() {
  const [ready, setReady] = useState(false), [userId, setUserId] = useState<string | null>(null), [history, setHistory] = useState<UIMessage[]>([]), [failure, setFailure] = useState("");
  useEffect(() => { let active = true; void (async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { if (active) setReady(true); return; }
    const role = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (role.error || role.data !== true) { if (active) setReady(true); return; }
    const saved = await supabase.from("admin_ai_conversations").select("messages").eq("user_id", user.id).maybeSingle();
    if (active) { if (saved.error) setFailure("Não foi possível carregar seu histórico. Atualize a página antes de enviar um pedido."); else { setUserId(user.id); setHistory((saved.data?.messages ?? []) as unknown as UIMessage[]); } setReady(true); }
  })(); return () => { active = false; }; }, []);
  if (!ready) return <p className="text-muted-foreground">Carregando assistente…</p>;
  return <div className="space-y-4"><Link to="/app/mais" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ChevronLeft className="h-4 w-4" />Voltar</Link><h1 className="text-2xl font-semibold">Assistente R&amp;M</h1>{failure ? <p role="alert" className="text-destructive">{failure}</p> : userId ? <AdminChat userId={userId} initialMessages={history} /> : <p>Esta assistente é exclusiva do administrador.</p>}</div>;
}