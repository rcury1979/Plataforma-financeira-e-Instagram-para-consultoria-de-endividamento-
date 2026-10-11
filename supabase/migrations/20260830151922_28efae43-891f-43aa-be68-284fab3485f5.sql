-- 1) Limites de gasto por categoria (PF)
CREATE TABLE IF NOT EXISTS public.pf_limites_categoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  limite_mensal NUMERIC(14,2) NOT NULL CHECK (limite_mensal > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, categoria)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pf_limites_categoria TO authenticated;
GRANT ALL ON public.pf_limites_categoria TO service_role;
ALTER TABLE public.pf_limites_categoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pf_limites_owner" ON public.pf_limites_categoria
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER pf_limites_updated BEFORE UPDATE ON public.pf_limites_categoria
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2) CRM: etapas do funil + captacao publica
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS etapa TEXT NOT NULL DEFAULT 'novo';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS proximo_contato DATE;

CREATE TABLE IF NOT EXISTS public.captacao_publica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  tipo_pessoa TEXT,
  mensagem TEXT,
  origem TEXT DEFAULT 'pagina-publica',
  processado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.captacao_publica TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.captacao_publica TO authenticated;
GRANT ALL ON public.captacao_publica TO service_role;
ALTER TABLE public.captacao_publica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "captacao_publica_anon_insert" ON public.captacao_publica
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "captacao_publica_auth_insert" ON public.captacao_publica
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "captacao_publica_admin_read" ON public.captacao_publica
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "captacao_publica_admin_update" ON public.captacao_publica
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "captacao_publica_admin_delete" ON public.captacao_publica
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3) Anamnese e analises do cliente
CREATE TABLE IF NOT EXISTS public.cliente_anamnese (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  respostas JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cliente_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cliente_anamnese TO authenticated;
GRANT ALL ON public.cliente_anamnese TO service_role;
ALTER TABLE public.cliente_anamnese ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cliente_anamnese_owner" ON public.cliente_anamnese
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER cliente_anamnese_updated BEFORE UPDATE ON public.cliente_anamnese
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE IF NOT EXISTS public.cliente_analises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  revisado BOOLEAN NOT NULL DEFAULT false,
  revisado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cliente_analises TO authenticated;
GRANT ALL ON public.cliente_analises TO service_role;
ALTER TABLE public.cliente_analises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cliente_analises_owner" ON public.cliente_analises
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER cliente_analises_updated BEFORE UPDATE ON public.cliente_analises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4) Agenda e agendamento publico
CREATE TABLE IF NOT EXISTS public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  nome_contato TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  assunto TEXT,
  inicio TIMESTAMPTZ NOT NULL,
  duracao_min INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'pendente',
  origem TEXT NOT NULL DEFAULT 'interno',
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.agendamentos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agendamentos TO authenticated;
GRANT ALL ON public.agendamentos TO service_role;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agendamentos_anon_insert" ON public.agendamentos
  FOR INSERT TO anon WITH CHECK (user_id IS NULL AND origem = 'publico');
CREATE POLICY "agendamentos_owner_read" ON public.agendamentos
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR (user_id IS NULL AND public.has_role(auth.uid(), 'admin')));
CREATE POLICY "agendamentos_owner_insert" ON public.agendamentos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "agendamentos_owner_update" ON public.agendamentos
  FOR UPDATE TO authenticated USING (auth.uid() = user_id OR (user_id IS NULL AND public.has_role(auth.uid(), 'admin')))
  WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND public.has_role(auth.uid(), 'admin')));
CREATE POLICY "agendamentos_owner_delete" ON public.agendamentos
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR (user_id IS NULL AND public.has_role(auth.uid(), 'admin')));
CREATE TRIGGER agendamentos_updated BEFORE UPDATE ON public.agendamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE INDEX IF NOT EXISTS agendamentos_inicio_idx ON public.agendamentos(inicio);