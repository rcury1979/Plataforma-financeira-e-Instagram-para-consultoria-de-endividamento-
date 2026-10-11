-- =========================================================
-- 1) contas_bancarias — restringir leitura a authenticated + escopo por empresa
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can view contas_bancarias" ON public.contas_bancarias;
CREATE POLICY "Users can view own empresa contas_bancarias"
  ON public.contas_bancarias FOR SELECT
  TO authenticated
  USING (
    empresa_id IS NULL
    OR public.user_has_empresa_access(auth.uid(), empresa_id)
    OR public.has_role(auth.uid(), 'admin')
  );

-- =========================================================
-- 2) extrato_bancario — todas as policies para authenticated
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can view extrato_bancario" ON public.extrato_bancario;
DROP POLICY IF EXISTS "Authenticated users can insert extrato_bancario" ON public.extrato_bancario;
DROP POLICY IF EXISTS "Authenticated users can update extrato_bancario" ON public.extrato_bancario;
DROP POLICY IF EXISTS "Admins can delete extrato_bancario" ON public.extrato_bancario;

CREATE POLICY "Users can view own empresa extrato_bancario"
  ON public.extrato_bancario FOR SELECT
  TO authenticated
  USING (
    empresa_id IS NULL
    OR public.user_has_empresa_access(auth.uid(), empresa_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert own empresa extrato_bancario"
  ON public.extrato_bancario FOR INSERT
  TO authenticated
  WITH CHECK (
    empresa_id IS NULL
    OR public.user_has_empresa_access(auth.uid(), empresa_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can update own empresa extrato_bancario"
  ON public.extrato_bancario FOR UPDATE
  TO authenticated
  USING (
    empresa_id IS NULL
    OR public.user_has_empresa_access(auth.uid(), empresa_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete extrato_bancario"
  ON public.extrato_bancario FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 3) contas_pagar — escopo por empresa
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can view contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Authenticated users can insert contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Authenticated users can update contas_pagar" ON public.contas_pagar;

CREATE POLICY "Users can view own empresa contas_pagar"
  ON public.contas_pagar FOR SELECT
  TO authenticated
  USING (
    empresa_id IS NULL
    OR public.user_has_empresa_access(auth.uid(), empresa_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert own empresa contas_pagar"
  ON public.contas_pagar FOR INSERT
  TO authenticated
  WITH CHECK (
    empresa_id IS NULL
    OR public.user_has_empresa_access(auth.uid(), empresa_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can update own empresa contas_pagar"
  ON public.contas_pagar FOR UPDATE
  TO authenticated
  USING (
    empresa_id IS NULL
    OR public.user_has_empresa_access(auth.uid(), empresa_id)
    OR public.has_role(auth.uid(), 'admin')
  );

-- =========================================================
-- 4) contas_receber — escopo por empresa
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can view contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Authenticated users can insert contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Authenticated users can update contas_receber" ON public.contas_receber;

CREATE POLICY "Users can view own empresa contas_receber"
  ON public.contas_receber FOR SELECT
  TO authenticated
  USING (
    empresa_id IS NULL
    OR public.user_has_empresa_access(auth.uid(), empresa_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert own empresa contas_receber"
  ON public.contas_receber FOR INSERT
  TO authenticated
  WITH CHECK (
    empresa_id IS NULL
    OR public.user_has_empresa_access(auth.uid(), empresa_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can update own empresa contas_receber"
  ON public.contas_receber FOR UPDATE
  TO authenticated
  USING (
    empresa_id IS NULL
    OR public.user_has_empresa_access(auth.uid(), empresa_id)
    OR public.has_role(auth.uid(), 'admin')
  );

-- =========================================================
-- 5) fluxo_caixa — escopo por empresa
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can view fluxo_caixa" ON public.fluxo_caixa;
DROP POLICY IF EXISTS "Authenticated users can insert fluxo_caixa" ON public.fluxo_caixa;
DROP POLICY IF EXISTS "Authenticated users can update fluxo_caixa" ON public.fluxo_caixa;

CREATE POLICY "Users can view own empresa fluxo_caixa"
  ON public.fluxo_caixa FOR SELECT
  TO authenticated
  USING (
    empresa_id IS NULL
    OR public.user_has_empresa_access(auth.uid(), empresa_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert own empresa fluxo_caixa"
  ON public.fluxo_caixa FOR INSERT
  TO authenticated
  WITH CHECK (
    empresa_id IS NULL
    OR public.user_has_empresa_access(auth.uid(), empresa_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can update own empresa fluxo_caixa"
  ON public.fluxo_caixa FOR UPDATE
  TO authenticated
  USING (
    empresa_id IS NULL
    OR public.user_has_empresa_access(auth.uid(), empresa_id)
    OR public.has_role(auth.uid(), 'admin')
  );

-- =========================================================
-- 6) funcionarios — escopo por empresa
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can view funcionarios" ON public.funcionarios;

CREATE POLICY "Users can view own empresa funcionarios"
  ON public.funcionarios FOR SELECT
  TO authenticated
  USING (
    empresa_id IS NULL
    OR public.user_has_empresa_access(auth.uid(), empresa_id)
    OR public.has_role(auth.uid(), 'admin')
  );

-- =========================================================
-- 7) adiantamentos — escopo por empresa
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can view adiantamentos" ON public.adiantamentos;
DROP POLICY IF EXISTS "Authenticated users can insert adiantamentos" ON public.adiantamentos;

CREATE POLICY "Users can view own empresa adiantamentos"
  ON public.adiantamentos FOR SELECT
  TO authenticated
  USING (
    empresa_id IS NULL
    OR public.user_has_empresa_access(auth.uid(), empresa_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can insert own empresa adiantamentos"
  ON public.adiantamentos FOR INSERT
  TO authenticated
  WITH CHECK (
    empresa_id IS NULL
    OR public.user_has_empresa_access(auth.uid(), empresa_id)
    OR public.has_role(auth.uid(), 'admin')
  );

-- =========================================================
-- 8) leads_planilha — só admins podem ler
-- =========================================================
CREATE POLICY "Only admins can view leads"
  ON public.leads_planilha FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 9) user_roles — bloquear escalação de privilégio
-- =========================================================
-- A ALL policy "Admins can manage all roles" já cobre INSERT só para admins,
-- mas adicionamos uma RESTRICTIVE policy para garantir defesa em profundidade.
CREATE POLICY "Block non-admin role inserts"
  ON public.user_roles AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Block non-admin role updates"
  ON public.user_roles AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 10) Storage bucket "imports" — escopo por dono
-- Convenção: arquivos salvos em `<auth.uid()>/<filename>`
-- =========================================================
DROP POLICY IF EXISTS "Authenticated users can view their imports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload imports" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their imports" ON storage.objects;

CREATE POLICY "Users can view own imports"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'imports'
    AND (owner = auth.uid() OR (storage.foldername(name))[1] = auth.uid()::text)
  );

CREATE POLICY "Users can upload own imports"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'imports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own imports"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'imports'
    AND (owner = auth.uid() OR (storage.foldername(name))[1] = auth.uid()::text)
  );