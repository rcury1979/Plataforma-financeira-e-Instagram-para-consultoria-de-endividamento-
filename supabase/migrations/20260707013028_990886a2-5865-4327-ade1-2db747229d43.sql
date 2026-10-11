
-- Tarefas por usuário
CREATE TABLE public.tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL,
  descricao text,
  status text NOT NULL DEFAULT 'pendente', -- pendente | em_andamento | concluida
  prioridade text NOT NULL DEFAULT 'media', -- baixa | media | alta
  prazo date,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  concluida_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarefas TO authenticated;
GRANT ALL ON public.tarefas TO service_role;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tarefas_own" ON public.tarefas FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tarefas_admin_all" ON public.tarefas FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tarefas_updated BEFORE UPDATE ON public.tarefas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE INDEX idx_tarefas_user ON public.tarefas(user_id, status);

-- Lançamentos (receitas/despesas) por usuário, realizados ou planejados
CREATE TABLE public.lancamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('receita','despesa')),
  descricao text NOT NULL,
  categoria text,
  valor numeric(14,2) NOT NULL,
  data date NOT NULL,
  planejado boolean NOT NULL DEFAULT false, -- true = previsão futura
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  forma_pagamento text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos TO authenticated;
GRANT ALL ON public.lancamentos TO service_role;
ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lanc_own" ON public.lancamentos FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "lanc_admin_read" ON public.lancamentos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER lanc_updated BEFORE UPDATE ON public.lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE INDEX idx_lanc_user_data ON public.lancamentos(user_id, data);
