
-- Tabela de empresas
CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  regime_tributario TEXT DEFAULT 'simples_nacional',
  segmento TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Vinculação usuário-empresa (quem tem acesso a qual empresa)
CREATE TABLE public.usuario_empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  papel TEXT NOT NULL DEFAULT 'usuario', -- 'contador', 'admin', 'usuario'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, empresa_id)
);

ALTER TABLE public.usuario_empresas ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário pertence à empresa
CREATE OR REPLACE FUNCTION public.user_has_empresa_access(_user_id UUID, _empresa_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuario_empresas
    WHERE user_id = _user_id AND empresa_id = _empresa_id
  )
$$;

-- RLS para empresas: usuários só veem empresas que estão vinculados
CREATE POLICY "Users can view their empresas"
  ON public.empresas FOR SELECT
  USING (public.user_has_empresa_access(auth.uid(), id));

CREATE POLICY "Admins can insert empresas"
  ON public.empresas FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update empresas"
  ON public.empresas FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete empresas"
  ON public.empresas FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS para usuario_empresas
CREATE POLICY "Users can view own vinculacoes"
  ON public.usuario_empresas FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage vinculacoes"
  ON public.usuario_empresas FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Adicionar empresa_id às tabelas existentes (nullable para não quebrar dados atuais)
ALTER TABLE public.contas_pagar ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.contas_receber ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.fluxo_caixa ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.funcionarios ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.adiantamentos ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.extrato_bancario ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
ALTER TABLE public.contas_bancarias ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);

-- Trigger updated_at para empresas
CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Índices para performance
CREATE INDEX idx_usuario_empresas_user ON public.usuario_empresas(user_id);
CREATE INDEX idx_usuario_empresas_empresa ON public.usuario_empresas(empresa_id);
CREATE INDEX idx_contas_pagar_empresa ON public.contas_pagar(empresa_id);
CREATE INDEX idx_contas_receber_empresa ON public.contas_receber(empresa_id);
CREATE INDEX idx_fluxo_caixa_empresa ON public.fluxo_caixa(empresa_id);
CREATE INDEX idx_funcionarios_empresa ON public.funcionarios(empresa_id);
