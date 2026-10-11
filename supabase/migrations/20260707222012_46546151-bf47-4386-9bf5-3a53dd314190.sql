
-- Enums
DO $$ BEGIN
  CREATE TYPE public.pf_transacao_tipo AS ENUM ('receita','despesa');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.pf_patrimonio_tipo AS ENUM ('imovel','veiculo','investimento','conta','outro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1) pf_transacoes
CREATE TABLE IF NOT EXISTS public.pf_transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo public.pf_transacao_tipo NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT,
  valor NUMERIC(14,2) NOT NULL CHECK (valor >= 0),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  recorrente BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pf_transacoes TO authenticated;
GRANT ALL ON public.pf_transacoes TO service_role;
ALTER TABLE public.pf_transacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pf_transacoes_owner" ON public.pf_transacoes
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER pf_transacoes_updated BEFORE UPDATE ON public.pf_transacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE INDEX IF NOT EXISTS pf_transacoes_user_data_idx ON public.pf_transacoes(user_id, data DESC);

-- 2) pf_dividas
CREATE TABLE IF NOT EXISTS public.pf_dividas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credor TEXT NOT NULL,
  descricao TEXT,
  valor_total NUMERIC(14,2) NOT NULL CHECK (valor_total >= 0),
  valor_pago NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (valor_pago >= 0),
  taxa_juros_mensal NUMERIC(6,3),
  parcelas_total INT,
  parcelas_pagas INT NOT NULL DEFAULT 0,
  vencimento DATE,
  quitada BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pf_dividas TO authenticated;
GRANT ALL ON public.pf_dividas TO service_role;
ALTER TABLE public.pf_dividas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pf_dividas_owner" ON public.pf_dividas
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER pf_dividas_updated BEFORE UPDATE ON public.pf_dividas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3) pf_patrimonio
CREATE TABLE IF NOT EXISTS public.pf_patrimonio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo public.pf_patrimonio_tipo NOT NULL,
  descricao TEXT NOT NULL,
  valor_atual NUMERIC(14,2) NOT NULL CHECK (valor_atual >= 0),
  liquido BOOLEAN NOT NULL DEFAULT false,
  instituicao TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pf_patrimonio TO authenticated;
GRANT ALL ON public.pf_patrimonio TO service_role;
ALTER TABLE public.pf_patrimonio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pf_patrimonio_owner" ON public.pf_patrimonio
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER pf_patrimonio_updated BEFORE UPDATE ON public.pf_patrimonio
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4) pf_metas_pessoais
CREATE TABLE IF NOT EXISTS public.pf_metas_pessoais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  categoria TEXT,
  valor_alvo NUMERIC(14,2) NOT NULL CHECK (valor_alvo > 0),
  valor_atual NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (valor_atual >= 0),
  prazo DATE,
  concluida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pf_metas_pessoais TO authenticated;
GRANT ALL ON public.pf_metas_pessoais TO service_role;
ALTER TABLE public.pf_metas_pessoais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pf_metas_owner" ON public.pf_metas_pessoais
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER pf_metas_updated BEFORE UPDATE ON public.pf_metas_pessoais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
