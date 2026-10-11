-- 1) Backfill: registros órfãos com empresa_id NULL serão removidos (não há como atribuir com segurança)
DELETE FROM public.contas_pagar WHERE empresa_id IS NULL;
DELETE FROM public.contas_receber WHERE empresa_id IS NULL;
DELETE FROM public.fluxo_caixa WHERE empresa_id IS NULL;
DELETE FROM public.contas_bancarias WHERE empresa_id IS NULL;
DELETE FROM public.extrato_bancario WHERE empresa_id IS NULL;
DELETE FROM public.adiantamentos WHERE empresa_id IS NULL;
DELETE FROM public.funcionarios WHERE empresa_id IS NULL;

-- 2) NOT NULL constraints
ALTER TABLE public.contas_pagar       ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.contas_receber     ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.fluxo_caixa        ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.contas_bancarias   ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.extrato_bancario   ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.adiantamentos      ALTER COLUMN empresa_id SET NOT NULL;
ALTER TABLE public.funcionarios       ALTER COLUMN empresa_id SET NOT NULL;

-- 3) Recreate RLS policies WITHOUT the `empresa_id IS NULL` bypass

-- contas_pagar
DROP POLICY IF EXISTS "Users can view own empresa contas_pagar"   ON public.contas_pagar;
DROP POLICY IF EXISTS "Users can insert own empresa contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Users can update own empresa contas_pagar" ON public.contas_pagar;
CREATE POLICY "Users can view own empresa contas_pagar"   ON public.contas_pagar FOR SELECT TO authenticated
  USING (user_has_empresa_access(auth.uid(), empresa_id) OR has_role(auth.uid(),'admin'));
CREATE POLICY "Users can insert own empresa contas_pagar" ON public.contas_pagar FOR INSERT TO authenticated
  WITH CHECK (user_has_empresa_access(auth.uid(), empresa_id) OR has_role(auth.uid(),'admin'));
CREATE POLICY "Users can update own empresa contas_pagar" ON public.contas_pagar FOR UPDATE TO authenticated
  USING (user_has_empresa_access(auth.uid(), empresa_id) OR has_role(auth.uid(),'admin'));

-- contas_receber
DROP POLICY IF EXISTS "Users can view own empresa contas_receber"   ON public.contas_receber;
DROP POLICY IF EXISTS "Users can insert own empresa contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Users can update own empresa contas_receber" ON public.contas_receber;
CREATE POLICY "Users can view own empresa contas_receber"   ON public.contas_receber FOR SELECT TO authenticated
  USING (user_has_empresa_access(auth.uid(), empresa_id) OR has_role(auth.uid(),'admin'));
CREATE POLICY "Users can insert own empresa contas_receber" ON public.contas_receber FOR INSERT TO authenticated
  WITH CHECK (user_has_empresa_access(auth.uid(), empresa_id) OR has_role(auth.uid(),'admin'));
CREATE POLICY "Users can update own empresa contas_receber" ON public.contas_receber FOR UPDATE TO authenticated
  USING (user_has_empresa_access(auth.uid(), empresa_id) OR has_role(auth.uid(),'admin'));

-- fluxo_caixa
DROP POLICY IF EXISTS "Users can view own empresa fluxo_caixa"   ON public.fluxo_caixa;
DROP POLICY IF EXISTS "Users can insert own empresa fluxo_caixa" ON public.fluxo_caixa;
DROP POLICY IF EXISTS "Users can update own empresa fluxo_caixa" ON public.fluxo_caixa;
CREATE POLICY "Users can view own empresa fluxo_caixa"   ON public.fluxo_caixa FOR SELECT TO authenticated
  USING (user_has_empresa_access(auth.uid(), empresa_id) OR has_role(auth.uid(),'admin'));
CREATE POLICY "Users can insert own empresa fluxo_caixa" ON public.fluxo_caixa FOR INSERT TO authenticated
  WITH CHECK (user_has_empresa_access(auth.uid(), empresa_id) OR has_role(auth.uid(),'admin'));
CREATE POLICY "Users can update own empresa fluxo_caixa" ON public.fluxo_caixa FOR UPDATE TO authenticated
  USING (user_has_empresa_access(auth.uid(), empresa_id) OR has_role(auth.uid(),'admin'));

-- contas_bancarias
DROP POLICY IF EXISTS "Users can view own empresa contas_bancarias" ON public.contas_bancarias;
CREATE POLICY "Users can view own empresa contas_bancarias" ON public.contas_bancarias FOR SELECT TO authenticated
  USING (user_has_empresa_access(auth.uid(), empresa_id) OR has_role(auth.uid(),'admin'));

-- extrato_bancario
DROP POLICY IF EXISTS "Users can view own empresa extrato_bancario"   ON public.extrato_bancario;
DROP POLICY IF EXISTS "Users can insert own empresa extrato_bancario" ON public.extrato_bancario;
DROP POLICY IF EXISTS "Users can update own empresa extrato_bancario" ON public.extrato_bancario;
CREATE POLICY "Users can view own empresa extrato_bancario"   ON public.extrato_bancario FOR SELECT TO authenticated
  USING (user_has_empresa_access(auth.uid(), empresa_id) OR has_role(auth.uid(),'admin'));
CREATE POLICY "Users can insert own empresa extrato_bancario" ON public.extrato_bancario FOR INSERT TO authenticated
  WITH CHECK (user_has_empresa_access(auth.uid(), empresa_id) OR has_role(auth.uid(),'admin'));
CREATE POLICY "Users can update own empresa extrato_bancario" ON public.extrato_bancario FOR UPDATE TO authenticated
  USING (user_has_empresa_access(auth.uid(), empresa_id) OR has_role(auth.uid(),'admin'));

-- adiantamentos
DROP POLICY IF EXISTS "Users can view own empresa adiantamentos"   ON public.adiantamentos;
DROP POLICY IF EXISTS "Users can insert own empresa adiantamentos" ON public.adiantamentos;
CREATE POLICY "Users can view own empresa adiantamentos"   ON public.adiantamentos FOR SELECT TO authenticated
  USING (user_has_empresa_access(auth.uid(), empresa_id) OR has_role(auth.uid(),'admin'));
CREATE POLICY "Users can insert own empresa adiantamentos" ON public.adiantamentos FOR INSERT TO authenticated
  WITH CHECK (user_has_empresa_access(auth.uid(), empresa_id) OR has_role(auth.uid(),'admin'));

-- funcionarios
DROP POLICY IF EXISTS "Users can view own empresa funcionarios" ON public.funcionarios;
CREATE POLICY "Users can view own empresa funcionarios" ON public.funcionarios FOR SELECT TO authenticated
  USING (user_has_empresa_access(auth.uid(), empresa_id) OR has_role(auth.uid(),'admin'));
