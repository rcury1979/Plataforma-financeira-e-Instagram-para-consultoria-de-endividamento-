ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS tipo_pessoa public.tipo_pessoa_enum NOT NULL DEFAULT 'PF',
  ADD COLUMN IF NOT EXISTS cliente_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS responsavel_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.clientes SET responsavel_id = user_id WHERE responsavel_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS clientes_cliente_user_unique
  ON public.clientes(cliente_user_id) WHERE cliente_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS clientes_responsavel_idx ON public.clientes(responsavel_id);

CREATE OR REPLACE FUNCTION public.has_cliente_access(_user_id uuid, _cliente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clientes c
    WHERE c.id = _cliente_id
      AND (c.user_id = _user_id OR c.responsavel_id = _user_id OR c.cliente_user_id = _user_id)
  )
$$;

CREATE TABLE public.cliente_eventos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('cadastro','anamnese','analise','tarefa','reuniao','lancamento','cobranca','documento','nota')),
  titulo text NOT NULL,
  descricao text,
  entidade_id uuid,
  ocorrido_em timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cliente_eventos TO authenticated;
GRANT ALL ON public.cliente_eventos TO service_role;
ALTER TABLE public.cliente_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cliente_eventos_access_select" ON public.cliente_eventos
  FOR SELECT TO authenticated USING (public.has_cliente_access(auth.uid(), cliente_id));
CREATE POLICY "cliente_eventos_owner_insert" ON public.cliente_eventos
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.clientes c WHERE c.id = cliente_id AND (c.user_id = auth.uid() OR c.responsavel_id = auth.uid())
    )
  );
CREATE POLICY "cliente_eventos_owner_update" ON public.cliente_eventos
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_id AND (c.user_id = auth.uid() OR c.responsavel_id = auth.uid()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_id AND (c.user_id = auth.uid() OR c.responsavel_id = auth.uid()))
  );
CREATE POLICY "cliente_eventos_owner_delete" ON public.cliente_eventos
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_id AND (c.user_id = auth.uid() OR c.responsavel_id = auth.uid()))
  );
CREATE TRIGGER cliente_eventos_updated_at BEFORE UPDATE ON public.cliente_eventos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE INDEX cliente_eventos_cliente_data_idx ON public.cliente_eventos(cliente_id, ocorrido_em DESC);

CREATE POLICY "Linked clients can view own cadastro" ON public.clientes
  FOR SELECT TO authenticated USING (cliente_user_id = auth.uid());
CREATE POLICY "Linked clients can view own tarefas" ON public.tarefas
  FOR SELECT TO authenticated USING (cliente_id IS NOT NULL AND public.has_cliente_access(auth.uid(), cliente_id));
CREATE POLICY "Linked clients can view own lancamentos" ON public.lancamentos
  FOR SELECT TO authenticated USING (cliente_id IS NOT NULL AND public.has_cliente_access(auth.uid(), cliente_id));
CREATE POLICY "Linked clients can view own agendamentos" ON public.agendamentos
  FOR SELECT TO authenticated USING (cliente_id IS NOT NULL AND public.has_cliente_access(auth.uid(), cliente_id));
CREATE POLICY "Linked clients can view own anamnese" ON public.cliente_anamnese
  FOR SELECT TO authenticated USING (public.has_cliente_access(auth.uid(), cliente_id));
CREATE POLICY "Linked clients can view reviewed analyses" ON public.cliente_analises
  FOR SELECT TO authenticated USING (revisado = true AND public.has_cliente_access(auth.uid(), cliente_id));

ALTER TABLE public.cliente_analises
  ADD COLUMN IF NOT EXISTS revisado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL;

INSERT INTO public.cliente_eventos (cliente_id, user_id, tipo, titulo, descricao, ocorrido_em)
SELECT c.id, c.user_id, 'cadastro', 'Cliente cadastrado', 'Início da jornada de acompanhamento financeiro.', c.created_at
FROM public.clientes c
WHERE NOT EXISTS (
  SELECT 1 FROM public.cliente_eventos e WHERE e.cliente_id = c.id AND e.tipo = 'cadastro'
);