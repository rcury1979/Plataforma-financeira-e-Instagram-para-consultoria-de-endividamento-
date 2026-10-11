CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_cliente_access(_user_id uuid, _cliente_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clientes c
    WHERE c.id = _cliente_id
      AND (c.user_id = _user_id OR c.responsavel_id = _user_id OR c.cliente_user_id = _user_id)
  )
$$;
REVOKE ALL ON FUNCTION private.has_cliente_access(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_cliente_access(uuid, uuid) TO authenticated, service_role;

ALTER POLICY "cliente_eventos_access_select" ON public.cliente_eventos
  USING (private.has_cliente_access(auth.uid(), cliente_id));
ALTER POLICY "Linked clients can view own tarefas" ON public.tarefas
  USING (cliente_id IS NOT NULL AND private.has_cliente_access(auth.uid(), cliente_id));
ALTER POLICY "Linked clients can view own lancamentos" ON public.lancamentos
  USING (cliente_id IS NOT NULL AND private.has_cliente_access(auth.uid(), cliente_id));
ALTER POLICY "Linked clients can view own agendamentos" ON public.agendamentos
  USING (cliente_id IS NOT NULL AND private.has_cliente_access(auth.uid(), cliente_id));
ALTER POLICY "Linked clients can view own anamnese" ON public.cliente_anamnese
  USING (private.has_cliente_access(auth.uid(), cliente_id));
ALTER POLICY "Linked clients can view reviewed analyses" ON public.cliente_analises
  USING (revisado = true AND private.has_cliente_access(auth.uid(), cliente_id));

DROP FUNCTION public.has_cliente_access(uuid, uuid);