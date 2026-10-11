import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, User, Building2 } from "lucide-react";

function safeNext(value: string | null): string {
  if (!value) return "/app";
  // only same-origin relative paths
  if (!value.startsWith("/") || value.startsWith("//")) return "/app";
  return value;
}

export default function Auth() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<"login" | "signup">(params.get("mode") === "signup" ? "signup" : "login");
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ">("PF");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate(next, { replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (session) navigate(next, { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, next]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/app/auth?next=${encodeURIComponent(next !== "/app" ? next : "/app/brindes")}`,
            data: { full_name: nome, tipo_pessoa: tipoPessoa },
          },
        });
        if (error) throw error;
        toast.success(next.startsWith("/planos") ? "Conta criada! Abra o e-mail de confirmação que enviamos — o link traz você de volta para concluir o pagamento." : "Conta criada! Confirme seu e-mail para receber seus dois e-books de presente.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}${next}`,
      });
      if (res.error) toast.error("Falha no Google Sign-in");
    } catch (err: any) {
      toast.error(err.message ?? "Erro no Google");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) return toast.error("Digite seu e-mail para receber o link de recuperação.");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Enviamos um link de redefinição para seu e-mail.");
  };

  const pill = "h-12 rounded-full border-border bg-secondary px-5 text-[15px] focus-visible:ring-primary";

  return (
    <div className="cliente-area min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-[440px] rounded-[28px] border border-border bg-card px-6 py-9 sm:px-9 shadow-[0_20px_60px_-24px_hsl(222_47%_14%/0.25)]">
        {/* Marca */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3">
            <div className="relative inline-flex h-12 w-12 items-center justify-center">
              <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full" aria-hidden>
                <circle cx="32" cy="32" r="29" fill="none" stroke="hsl(var(--gold) / 0.5)" strokeWidth="1.2" strokeDasharray="2 3" />
                <circle cx="32" cy="32" r="23" fill="hsl(var(--gold))" />
              </svg>
              <span className="relative font-display italic text-[12px] leading-none text-primary tracking-tight">R&amp;M</span>
            </div>
            <span className="font-display text-[32px] leading-none text-primary">R&amp;M <span className="text-gold">360°</span></span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {mode === "login" ? "Entre na sua conta para continuar" : "Crie sua conta e comece sua jornada"}
          </p>
          <div className="mt-4 flex items-center justify-center gap-1.5" aria-label="Método GCPM: Gerar, Cuidar, Proteger e Multiplicar">
            {[["G", "Gerar"], ["C", "Cuidar"], ["P", "Proteger"], ["M", "Multiplicar"]].map(([l, t]) => (
              <span key={l} title={t} className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold-soft px-2.5 py-1 text-[11px] text-primary">
                <b className="font-semibold text-gold">{l}</b><span className="text-muted-foreground">{t}</span>
              </span>
            ))}
          </div>
        </div>

        {import.meta.env.VITE_TEST_SITE === "1" && (
          <div className="mt-6 rounded-2xl border border-gold/40 bg-gold-soft p-3 text-sm">
            <p className="font-medium text-foreground">Site de teste: dados simulados</p>
            <p className="mt-1 text-muted-foreground">PJ (admin): <b className="text-foreground">teste@rmconsultoria.com</b><br />PF: <b className="text-foreground">pf@rmconsultoria.com</b><br />Senha: <b className="text-foreground">Teste@2026</b></p>
          </div>
        )}

        {next.startsWith("/planos") && (
          <div className="mt-6 rounded-2xl border border-gold/40 bg-gold-soft p-3 text-sm">
            <p className="font-semibold text-primary">Passo 1 de 2: crie seu acesso</p>
            <p className="mt-1 text-muted-foreground">
              {mode === "signup"
                ? "O e-mail e a senha que você criar aqui serão o seu login no app. Depois de confirmar o e-mail, você volta para o pagamento do plano."
                : "Entre com seu e-mail e senha para continuar para o pagamento do plano."}
            </p>
          </div>
        )}

        <form onSubmit={handleEmail} className="mt-7 space-y-4">
          {mode === "signup" && <p className="text-sm text-primary border-l-2 border-primary pl-3">Cadastre-se e receba grátis os e-books Método GCPM e Organização financeira após confirmar seu e-mail.</p>}
          {mode === "signup" && (
            <>
              <div className="space-y-2">
                <Label>Você é</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([["PF", "Pessoa Física", User], ["PJ", "Pessoa Jurídica", Building2]] as const).map(([v, t, Icon]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setTipoPessoa(v)}
                      className={`flex h-11 items-center justify-center gap-2 rounded-full border text-sm transition ${
                        tipoPessoa === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {t}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {tipoPessoa === "PF" ? "Foco em finanças pessoais, metas e mentoria." : "Foco em gestão financeira, fiscal e ERP da empresa."}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input id="nome" className={pill} value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" autoComplete="email" className={pill} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className={`${pill} pr-12`}
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="h-12 w-full rounded-full text-[15px] font-semibold shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)]" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-card px-3 text-muted-foreground">ou</span>
          </div>
        </div>

        <Button variant="outline" className="h-12 w-full rounded-full border-border bg-transparent text-[15px] hover:bg-secondary" onClick={handleGoogle} disabled={loading}>
          <svg className="mr-2 h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Entrar com Google
        </Button>

        <div className="mt-6 space-y-3 text-center text-sm">
          {mode === "login" && (
            <button type="button" onClick={handleForgot} className="text-muted-foreground hover:text-primary">
              Esqueci minha senha
            </button>
          )}
          <p className="text-muted-foreground">
            {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
            <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="font-medium text-primary hover:underline">
              {mode === "login" ? "Cadastre-se" : "Entrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
