
-- Fix empresas policies: drop restrictive, create permissive
DROP POLICY IF EXISTS "Admins can insert empresas" ON public.empresas;
DROP POLICY IF EXISTS "Admins can update empresas" ON public.empresas;
DROP POLICY IF EXISTS "Admins can delete empresas" ON public.empresas;
DROP POLICY IF EXISTS "Users can view their empresas" ON public.empresas;

CREATE POLICY "Admins can insert empresas"
  ON public.empresas FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update empresas"
  ON public.empresas FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete empresas"
  ON public.empresas FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their empresas"
  ON public.empresas FOR SELECT
  TO authenticated
  USING (public.user_has_empresa_access(auth.uid(), id) OR public.has_role(auth.uid(), 'admin'));

-- Fix usuario_empresas policies
DROP POLICY IF EXISTS "Users can view own vinculacoes" ON public.usuario_empresas;
DROP POLICY IF EXISTS "Admins can manage vinculacoes" ON public.usuario_empresas;

CREATE POLICY "Users can view own vinculacoes"
  ON public.usuario_empresas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert vinculacoes"
  ON public.usuario_empresas FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update vinculacoes"
  ON public.usuario_empresas FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete vinculacoes"
  ON public.usuario_empresas FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
