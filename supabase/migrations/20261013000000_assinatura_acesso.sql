-- =====================================================================================
-- Assinatura do app R&M 360°: só usa o app quem tem acesso liberado.
--
-- Quem tem acesso (função public.tem_acesso_app()):
--   1. Administradora e educadoras.
--   2. Assinante com assinatura ativa, em teste grátis (7 dias) ou com pagamento em atraso há até 3 dias.
--      Assinatura cancelada continua valendo até o fim do período já pago.
--   3. Cliente da mentoria: cadastrado e vinculado pela educadora em Clientes (não arquivado),
--      com "acesso ao app incluso" marcado.
--   4. Cortesia liberada pela administradora (com ou sem data de validade).
--
-- Sem acesso, o cliente ainda CONSEGUE LER os próprios dados (direito do titular, LGPD),
-- mas não consegue criar, alterar nem apagar nada na Área do Cliente — a regra está no banco.
-- =====================================================================================

-- 1) Dados do contrato na assinatura
alter table public.subscriptions
  add column if not exists contrato_meses integer,
  add column if not exists fidelidade_ate timestamptz;

-- 2) Mentoria: a educadora decide se o cliente vinculado tem o app incluso
alter table public.clientes
  add column if not exists acesso_app_incluso boolean not null default true;

-- 3) Cortesias liberadas pela administradora
create table if not exists public.acessos_cortesia (
  user_id uuid primary key references auth.users(id) on delete cascade,
  motivo text,
  valido_ate timestamptz,
  concedido_por uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.acessos_cortesia enable row level security;
grant select, insert, update, delete on public.acessos_cortesia to authenticated;
grant all on public.acessos_cortesia to service_role;

drop policy if exists "cortesia: admin gerencia" on public.acessos_cortesia;
create policy "cortesia: admin gerencia" on public.acessos_cortesia for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
drop policy if exists "cortesia: titular vê a sua" on public.acessos_cortesia;
create policy "cortesia: titular vê a sua" on public.acessos_cortesia for select to authenticated
  using (auth.uid() = user_id);

-- 4) Regra única de acesso (sempre do usuário logado — não recebe parâmetro)
create or replace function public.tem_acesso_app()
returns boolean
language sql stable security definer set search_path = public
as $$
  select auth.uid() is not null and (
    public.has_role(auth.uid(), 'admin')
    or public.has_role(auth.uid(), 'educador')
    or exists (
      select 1 from public.subscriptions s
      where s.user_id = auth.uid()
        and (
          (s.status in ('active', 'trialing') and (s.current_period_end is null or s.current_period_end > now()))
          or (s.status = 'past_due' and s.current_period_end > now() - interval '3 days')
          or (s.status = 'canceled' and s.current_period_end > now())
        )
    )
    or exists (
      select 1 from public.clientes c
      where c.cliente_user_id = auth.uid() and not c.arquivado and c.acesso_app_incluso
    )
    or exists (
      select 1 from public.acessos_cortesia a
      where a.user_id = auth.uid() and (a.valido_ate is null or a.valido_ate > now())
    )
  );
$$;
revoke all on function public.tem_acesso_app() from public, anon;
grant execute on function public.tem_acesso_app() to authenticated;

-- 5) Situação do acesso para a tela "Minha assinatura" (só do próprio usuário)
create or replace function public.minha_assinatura()
returns table (
  tem_acesso boolean,
  origem text,
  status text,
  contrato_meses integer,
  fidelidade_ate timestamptz,
  proxima_cobranca timestamptz,
  cancela_no_fim boolean
)
language sql stable security definer set search_path = public
as $$
  with s as (
    select * from public.subscriptions
    where user_id = auth.uid()
    order by created_at desc nulls last
    limit 1
  )
  select
    public.tem_acesso_app(),
    case
      when public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'educador') then 'equipe'
      when exists (select 1 from s where s.status in ('active','trialing','past_due') or (s.status = 'canceled' and s.current_period_end > now())) then 'assinatura'
      when exists (select 1 from public.clientes c where c.cliente_user_id = auth.uid() and not c.arquivado and c.acesso_app_incluso) then 'mentoria'
      when exists (select 1 from public.acessos_cortesia a where a.user_id = auth.uid() and (a.valido_ate is null or a.valido_ate > now())) then 'cortesia'
      else 'nenhum'
    end,
    (select status from s),
    (select contrato_meses from s),
    (select fidelidade_ate from s),
    (select current_period_end from s),
    coalesce((select cancel_at_period_end from s), false);
$$;
revoke all on function public.minha_assinatura() from public, anon;
grant execute on function public.minha_assinatura() to authenticated;

-- 6) Área do Cliente: ler sempre; gravar só com acesso liberado
do $$
declare t text;
begin
  foreach t in array array[
    'cli_contas','cli_cartoes','cli_categorias','cli_lancamentos','cli_limites','cli_tarefas',
    'cli_tarefa_comentarios','cli_objetivos','cli_planejamento','cli_dividas','cli_patrimonio',
    'cli_snapshots','cli_despesas_nr','cli_entradas_sazonais','cli_reunioes'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || ': dono gerencia', t);
    execute format('drop policy if exists %I on public.%I', t || ': dono lê', t);
    execute format('drop policy if exists %I on public.%I', t || ': dono cria', t);
    execute format('drop policy if exists %I on public.%I', t || ': dono altera', t);
    execute format('drop policy if exists %I on public.%I', t || ': dono apaga', t);
    execute format('create policy %I on public.%I for select to authenticated using (auth.uid() = user_id)', t || ': dono lê', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (auth.uid() = user_id and public.tem_acesso_app())', t || ': dono cria', t);
    execute format('create policy %I on public.%I for update to authenticated using (auth.uid() = user_id and public.tem_acesso_app()) with check (auth.uid() = user_id and public.tem_acesso_app())', t || ': dono altera', t);
    execute format('create policy %I on public.%I for delete to authenticated using (auth.uid() = user_id and public.tem_acesso_app())', t || ': dono apaga', t);
  end loop;
end $$;

-- 7) A administradora acompanha os assinantes (somente leitura; quem grava é o aviso do Stripe)
drop policy if exists "Admin vê assinaturas" on public.subscriptions;
create policy "Admin vê assinaturas" on public.subscriptions for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
