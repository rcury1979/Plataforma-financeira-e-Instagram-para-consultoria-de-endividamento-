-- Área do Cliente (Pessoa Física) e acesso da Educadora.
-- Segurança (Row Level Security em todas as tabelas):
--   * o cliente vê e edita somente as próprias linhas (user_id = auth.uid());
--   * a educadora vê e edita somente as linhas de clientes vinculados a ela em public.clientes
--     (clientes.cliente_user_id = cliente e clientes.user_id/responsavel_id = educadora, não arquivado);
--   * ninguém mais — nem o admin da plataforma — acessa dados financeiros de clientes de outra educadora.

alter table public.profiles add column if not exists avatar_url text;

create or replace function public.is_educador_de(_cliente_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.clientes c
    where c.cliente_user_id = _cliente_user
      and (c.user_id = auth.uid() or c.responsavel_id = auth.uid())
      and coalesce(c.arquivado, false) = false
  )
$$;
revoke all on function public.is_educador_de(uuid) from public;
grant execute on function public.is_educador_de(uuid) to authenticated;

create table if not exists public.cli_contas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null, tipo text not null default 'corrente', saldo_inicial numeric(14,2) not null default 0, arquivada boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cli_contas_user_idx on public.cli_contas(user_id);
alter table public.cli_contas enable row level security;
create policy "cli_contas: dono gerencia" on public.cli_contas for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cli_contas: educadora gerencia" on public.cli_contas for all to authenticated using (public.is_educador_de(user_id)) with check (public.is_educador_de(user_id));
grant select, insert, update, delete on public.cli_contas to authenticated;
grant all on public.cli_contas to service_role;
create trigger cli_contas_updated_at before update on public.cli_contas for each row execute function public.update_updated_at();

create table if not exists public.cli_cartoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null, limite numeric(14,2), dia_fechamento int not null default 1 check (dia_fechamento between 1 and 31), dia_vencimento int not null default 10 check (dia_vencimento between 1 and 31), conta_pagamento_id uuid references public.cli_contas(id) on delete set null, arquivado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cli_cartoes_user_idx on public.cli_cartoes(user_id);
alter table public.cli_cartoes enable row level security;
create policy "cli_cartoes: dono gerencia" on public.cli_cartoes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cli_cartoes: educadora gerencia" on public.cli_cartoes for all to authenticated using (public.is_educador_de(user_id)) with check (public.is_educador_de(user_id));
grant select, insert, update, delete on public.cli_cartoes to authenticated;
grant all on public.cli_cartoes to service_role;
create trigger cli_cartoes_updated_at before update on public.cli_cartoes for each row execute function public.update_updated_at();

create table if not exists public.cli_categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null, tipo text not null default 'despesa' check (tipo in ('despesa','receita')), icone text, parent_id uuid references public.cli_categorias(id) on delete cascade, ordem int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cli_categorias_user_idx on public.cli_categorias(user_id);
alter table public.cli_categorias enable row level security;
create policy "cli_categorias: dono gerencia" on public.cli_categorias for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cli_categorias: educadora gerencia" on public.cli_categorias for all to authenticated using (public.is_educador_de(user_id)) with check (public.is_educador_de(user_id));
grant select, insert, update, delete on public.cli_categorias to authenticated;
grant all on public.cli_categorias to service_role;
create trigger cli_categorias_updated_at before update on public.cli_categorias for each row execute function public.update_updated_at();

create table if not exists public.cli_lancamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('receita','despesa','transferencia')), descricao text not null, valor numeric(14,2) not null check (valor >= 0), data date not null, categoria_id uuid references public.cli_categorias(id) on delete set null, conta_id uuid references public.cli_contas(id) on delete set null, cartao_id uuid references public.cli_cartoes(id) on delete set null, conta_destino_id uuid references public.cli_contas(id) on delete set null, pago boolean not null default true, recorrente boolean not null default false, observacao text, origem text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cli_lancamentos_user_idx on public.cli_lancamentos(user_id);
alter table public.cli_lancamentos enable row level security;
create policy "cli_lancamentos: dono gerencia" on public.cli_lancamentos for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cli_lancamentos: educadora gerencia" on public.cli_lancamentos for all to authenticated using (public.is_educador_de(user_id)) with check (public.is_educador_de(user_id));
grant select, insert, update, delete on public.cli_lancamentos to authenticated;
grant all on public.cli_lancamentos to service_role;
create trigger cli_lancamentos_updated_at before update on public.cli_lancamentos for each row execute function public.update_updated_at();

create table if not exists public.cli_limites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  categoria_id uuid not null references public.cli_categorias(id) on delete cascade, valor numeric(14,2) not null check (valor >= 0), unique (user_id, categoria_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cli_limites_user_idx on public.cli_limites(user_id);
alter table public.cli_limites enable row level security;
create policy "cli_limites: dono gerencia" on public.cli_limites for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cli_limites: educadora gerencia" on public.cli_limites for all to authenticated using (public.is_educador_de(user_id)) with check (public.is_educador_de(user_id));
grant select, insert, update, delete on public.cli_limites to authenticated;
grant all on public.cli_limites to service_role;
create trigger cli_limites_updated_at before update on public.cli_limites for each row execute function public.update_updated_at();

create table if not exists public.cli_tarefas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null, descricao text, prazo date, status text not null default 'pendente' check (status in ('pendente','concluida')), concluida_em timestamptz, criado_por uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cli_tarefas_user_idx on public.cli_tarefas(user_id);
alter table public.cli_tarefas enable row level security;
create policy "cli_tarefas: dono gerencia" on public.cli_tarefas for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cli_tarefas: educadora gerencia" on public.cli_tarefas for all to authenticated using (public.is_educador_de(user_id)) with check (public.is_educador_de(user_id));
grant select, insert, update, delete on public.cli_tarefas to authenticated;
grant all on public.cli_tarefas to service_role;
create trigger cli_tarefas_updated_at before update on public.cli_tarefas for each row execute function public.update_updated_at();

create table if not exists public.cli_tarefa_comentarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tarefa_id uuid not null references public.cli_tarefas(id) on delete cascade, autor_nome text, texto text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cli_tarefa_comentarios_user_idx on public.cli_tarefa_comentarios(user_id);
alter table public.cli_tarefa_comentarios enable row level security;
create policy "cli_tarefa_comentarios: dono gerencia" on public.cli_tarefa_comentarios for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cli_tarefa_comentarios: educadora gerencia" on public.cli_tarefa_comentarios for all to authenticated using (public.is_educador_de(user_id)) with check (public.is_educador_de(user_id));
grant select, insert, update, delete on public.cli_tarefa_comentarios to authenticated;
grant all on public.cli_tarefa_comentarios to service_role;
create trigger cli_tarefa_comentarios_updated_at before update on public.cli_tarefa_comentarios for each row execute function public.update_updated_at();

create table if not exists public.cli_objetivos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null, prioridade text not null default 'sonho' check (prioridade in ('essencial','sonho','desejo')), valor numeric(14,2) not null default 0, idade_alvo int, ativo_venda_id uuid, concluido boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cli_objetivos_user_idx on public.cli_objetivos(user_id);
alter table public.cli_objetivos enable row level security;
create policy "cli_objetivos: dono gerencia" on public.cli_objetivos for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cli_objetivos: educadora gerencia" on public.cli_objetivos for all to authenticated using (public.is_educador_de(user_id)) with check (public.is_educador_de(user_id));
grant select, insert, update, delete on public.cli_objetivos to authenticated;
grant all on public.cli_objetivos to service_role;
create trigger cli_objetivos_updated_at before update on public.cli_objetivos for each row execute function public.update_updated_at();

create table if not exists public.cli_planejamento (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idade_atual int, aposentar_aos int default 65, renda_mes numeric(14,2), aporte_mes numeric(14,2), taxa_aa numeric(6,2) default 8, inflacao numeric(6,2) default 4, viver_ate int default 90, usar_patrimonio boolean not null default true, unique (user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cli_planejamento_user_idx on public.cli_planejamento(user_id);
alter table public.cli_planejamento enable row level security;
create policy "cli_planejamento: dono gerencia" on public.cli_planejamento for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cli_planejamento: educadora gerencia" on public.cli_planejamento for all to authenticated using (public.is_educador_de(user_id)) with check (public.is_educador_de(user_id));
grant select, insert, update, delete on public.cli_planejamento to authenticated;
grant all on public.cli_planejamento to service_role;
create trigger cli_planejamento_updated_at before update on public.cli_planejamento for each row execute function public.update_updated_at();

create table if not exists public.cli_dividas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null, tipo text not null default 'outro', juros_mes numeric(6,3), dia_vencimento int, quitada boolean not null default false, observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cli_dividas_user_idx on public.cli_dividas(user_id);
alter table public.cli_dividas enable row level security;
create policy "cli_dividas: dono gerencia" on public.cli_dividas for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cli_dividas: educadora gerencia" on public.cli_dividas for all to authenticated using (public.is_educador_de(user_id)) with check (public.is_educador_de(user_id));
grant select, insert, update, delete on public.cli_dividas to authenticated;
grant all on public.cli_dividas to service_role;
create trigger cli_dividas_updated_at before update on public.cli_dividas for each row execute function public.update_updated_at();

create table if not exists public.cli_patrimonio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null, tipo text not null default 'outro' check (tipo in ('imovel','veiculo','investimento','conta','outro')), observacao text, liquido boolean not null default false, vendido boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cli_patrimonio_user_idx on public.cli_patrimonio(user_id);
alter table public.cli_patrimonio enable row level security;
create policy "cli_patrimonio: dono gerencia" on public.cli_patrimonio for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cli_patrimonio: educadora gerencia" on public.cli_patrimonio for all to authenticated using (public.is_educador_de(user_id)) with check (public.is_educador_de(user_id));
grant select, insert, update, delete on public.cli_patrimonio to authenticated;
grant all on public.cli_patrimonio to service_role;
create trigger cli_patrimonio_updated_at before update on public.cli_patrimonio for each row execute function public.update_updated_at();

create table if not exists public.cli_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_tipo text not null check (item_tipo in ('divida','patrimonio')), item_id uuid not null, ano_mes text not null check (ano_mes ~ '^[0-9]{4}-[0-9]{2}$'), valor numeric(14,2) not null default 0, parcela numeric(14,2), em_atraso boolean not null default false, unique (item_tipo, item_id, ano_mes),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cli_snapshots_user_idx on public.cli_snapshots(user_id);
alter table public.cli_snapshots enable row level security;
create policy "cli_snapshots: dono gerencia" on public.cli_snapshots for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cli_snapshots: educadora gerencia" on public.cli_snapshots for all to authenticated using (public.is_educador_de(user_id)) with check (public.is_educador_de(user_id));
grant select, insert, update, delete on public.cli_snapshots to authenticated;
grant all on public.cli_snapshots to service_role;
create trigger cli_snapshots_updated_at before update on public.cli_snapshots for each row execute function public.update_updated_at();

create table if not exists public.cli_despesas_nr (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  descricao text not null, valor numeric(14,2) not null default 0, mes int not null check (mes between 1 and 12), categoria_id uuid references public.cli_categorias(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cli_despesas_nr_user_idx on public.cli_despesas_nr(user_id);
alter table public.cli_despesas_nr enable row level security;
create policy "cli_despesas_nr: dono gerencia" on public.cli_despesas_nr for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cli_despesas_nr: educadora gerencia" on public.cli_despesas_nr for all to authenticated using (public.is_educador_de(user_id)) with check (public.is_educador_de(user_id));
grant select, insert, update, delete on public.cli_despesas_nr to authenticated;
grant all on public.cli_despesas_nr to service_role;
create trigger cli_despesas_nr_updated_at before update on public.cli_despesas_nr for each row execute function public.update_updated_at();

create table if not exists public.cli_entradas_sazonais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  descricao text not null, valor numeric(14,2) not null default 0, mes int not null check (mes between 1 and 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cli_entradas_sazonais_user_idx on public.cli_entradas_sazonais(user_id);
alter table public.cli_entradas_sazonais enable row level security;
create policy "cli_entradas_sazonais: dono gerencia" on public.cli_entradas_sazonais for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cli_entradas_sazonais: educadora gerencia" on public.cli_entradas_sazonais for all to authenticated using (public.is_educador_de(user_id)) with check (public.is_educador_de(user_id));
grant select, insert, update, delete on public.cli_entradas_sazonais to authenticated;
grant all on public.cli_entradas_sazonais to service_role;
create trigger cli_entradas_sazonais_updated_at before update on public.cli_entradas_sazonais for each row execute function public.update_updated_at();

create table if not exists public.cli_reunioes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null default current_date, titulo text not null, resumo text, material_url text, created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cli_reunioes_user_idx on public.cli_reunioes(user_id);
alter table public.cli_reunioes enable row level security;
create policy "cli_reunioes: dono gerencia" on public.cli_reunioes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cli_reunioes: educadora gerencia" on public.cli_reunioes for all to authenticated using (public.is_educador_de(user_id)) with check (public.is_educador_de(user_id));
grant select, insert, update, delete on public.cli_reunioes to authenticated;
grant all on public.cli_reunioes to service_role;
create trigger cli_reunioes_updated_at before update on public.cli_reunioes for each row execute function public.update_updated_at();

create index if not exists cli_lancamentos_user_data_idx on public.cli_lancamentos(user_id, data);
create index if not exists cli_snapshots_item_idx on public.cli_snapshots(item_tipo, item_id, ano_mes);

-- Perfis: a educadora lê o perfil dos clientes dela; o cliente lê o perfil da educadora dele.
create policy "profiles: educadora le clientes" on public.profiles
  for select to authenticated using (public.is_educador_de(user_id));
create or replace function public.is_cliente_de(_educadora uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.clientes c
    where c.cliente_user_id = auth.uid()
      and (c.user_id = _educadora or c.responsavel_id = _educadora)
      and coalesce(c.arquivado, false) = false
  )
$$;
revoke all on function public.is_cliente_de(uuid) from public;
grant execute on function public.is_cliente_de(uuid) to authenticated;
create policy "profiles: cliente le educadora" on public.profiles
  for select to authenticated using (public.is_cliente_de(user_id));

-- Convite: quando o cliente confirma o e-mail, vincula o cadastro que a educadora criou com esse e-mail.
create or replace function public.vincular_cliente_por_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is null then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if old.email_confirmed_at is not null then
      return new; -- já estava confirmado
    end if;
  end if;
  update public.clientes
     set cliente_user_id = new.id
   where cliente_user_id is null
     and lower(email) = lower(new.email);
  return new;
end $$;
drop trigger if exists on_auth_user_confirmed_vincular on auth.users;
create trigger on_auth_user_confirmed_vincular
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.vincular_cliente_por_email();

-- Perfil de acesso "educador" (para vender a plataforma a outras educadoras).
alter type public.app_role add value if not exists 'educador';

-- Categorias padrão que a educadora define para os clientes novos dela.
create table if not exists public.edu_categorias_padrao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade, -- educadora
  nome text not null,
  tipo text not null default 'despesa' check (tipo in ('despesa','receita')),
  icone text,
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.edu_categorias_padrao enable row level security;
create policy "edu_categorias_padrao: dona gerencia" on public.edu_categorias_padrao
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "edu_categorias_padrao: clientes leem" on public.edu_categorias_padrao
  for select to authenticated using (public.is_cliente_de(user_id));
grant select, insert, update, delete on public.edu_categorias_padrao to authenticated;
create trigger edu_categorias_padrao_updated_at before update on public.edu_categorias_padrao
  for each row execute function public.update_updated_at();
