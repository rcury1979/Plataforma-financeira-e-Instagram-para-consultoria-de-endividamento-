-- =====================================================================================
-- Sorteio ao vivo nas palestras.
--  • O público entra pelo QR Code (/sorteio) e se inscreve com nome, e-mail e data de nascimento.
--  • Só a administradora vê a lista e faz o sorteio (/sorteio/painel).
--  • Ninguém de fora lê os dados dos participantes: a inscrição passa por uma função que só grava.
-- =====================================================================================

create table if not exists public.sorteios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 2 and 120),
  premio text not null default 'Uma consultoria financeira gratuita' check (char_length(premio) between 2 and 160),
  aberto boolean not null default true,
  vencedor_id uuid,
  sorteado_em timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.sorteio_participantes (
  id uuid primary key default gen_random_uuid(),
  sorteio_id uuid not null references public.sorteios(id) on delete cascade,
  nome text not null check (char_length(nome) between 2 and 120),
  email text not null check (char_length(email) between 5 and 200 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  nascimento date not null check (nascimento between date '1900-01-01' and current_date),
  avatar text not null default '🙂' check (char_length(avatar) between 1 and 16),
  consentimento boolean not null check (consentimento),
  created_at timestamptz not null default now()
);
create unique index if not exists sorteio_participantes_email_unico
  on public.sorteio_participantes (sorteio_id, lower(email));
create index if not exists sorteio_participantes_sorteio on public.sorteio_participantes (sorteio_id);

do $$ begin
  alter table public.sorteios
    add constraint sorteios_vencedor_fk foreign key (vencedor_id)
    references public.sorteio_participantes(id) on delete set null;
exception when duplicate_object then null; end $$;

alter table public.sorteios enable row level security;
alter table public.sorteio_participantes enable row level security;

grant select on public.sorteios to anon, authenticated;
grant insert, update, delete on public.sorteios to authenticated;
grant select, delete on public.sorteio_participantes to authenticated;
grant all on public.sorteios, public.sorteio_participantes to service_role;

-- Sorteios: qualquer um vê título/prêmio/se está aberto; só a administradora cria e altera.
drop policy if exists "sorteios: todos veem" on public.sorteios;
create policy "sorteios: todos veem" on public.sorteios for select to anon, authenticated using (true);
drop policy if exists "sorteios: admin gerencia" on public.sorteios;
create policy "sorteios: admin gerencia" on public.sorteios for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Participantes: só a administradora lê e apaga. Inscrição só pela função abaixo.
drop policy if exists "participantes: admin lê" on public.sorteio_participantes;
create policy "participantes: admin lê" on public.sorteio_participantes for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
drop policy if exists "participantes: admin apaga" on public.sorteio_participantes;
create policy "participantes: admin apaga" on public.sorteio_participantes for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

alter table public.sorteio_participantes add column if not exists avatar text not null default '🙂';

-- Inscrição pública (sem login). Retorna 'ok', 'repetido' ou 'fechado'.
drop function if exists public.inscrever_sorteio(uuid, text, text, date, boolean);
create or replace function public.inscrever_sorteio(
  _sorteio uuid, _nome text, _email text, _nascimento date, _consentimento boolean, _avatar text default '🙂'
) returns text
language plpgsql security definer set search_path = public
as $$
begin
  if not coalesce(_consentimento, false) then
    raise exception 'consentimento obrigatório';
  end if;
  if not exists (select 1 from public.sorteios s where s.id = _sorteio and s.aberto) then
    return 'fechado';
  end if;
  insert into public.sorteio_participantes (sorteio_id, nome, email, nascimento, avatar, consentimento)
  values (_sorteio, btrim(_nome), lower(btrim(_email)), _nascimento, left(coalesce(nullif(btrim(_avatar), ''), '🙂'), 16), true);
  return 'ok';
exception when unique_violation then
  return 'repetido';
end;
$$;
revoke all on function public.inscrever_sorteio(uuid, text, text, date, boolean, text) from public;
grant execute on function public.inscrever_sorteio(uuid, text, text, date, boolean, text) to anon, authenticated;

-- Quantos inscritos (público pode ver o número, não os nomes).
create or replace function public.total_inscritos_sorteio(_sorteio uuid)
returns integer language sql stable security definer set search_path = public
as $$ select count(*)::int from public.sorteio_participantes where sorteio_id = _sorteio; $$;
revoke all on function public.total_inscritos_sorteio(uuid) from public;
grant execute on function public.total_inscritos_sorteio(uuid) to anon, authenticated;

-- Sorteio: só a administradora. Escolhe um participante ao acaso (pode excluir o vencedor anterior).
create or replace function public.sortear(_sorteio uuid, _excluir_atual boolean default false)
returns table (id uuid, nome text, email text)
language plpgsql security definer set search_path = public
as $$
declare v_atual uuid; v_id uuid;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'apenas a administradora pode sortear';
  end if;
  select s.vencedor_id into v_atual from public.sorteios s where s.id = _sorteio for update;
  select p.id into v_id from public.sorteio_participantes p
   where p.sorteio_id = _sorteio and (not _excluir_atual or v_atual is null or p.id <> v_atual)
   order by random() limit 1;
  if v_id is null then
    raise exception 'não há participantes para sortear';
  end if;
  update public.sorteios set vencedor_id = v_id, sorteado_em = now(), aberto = false where sorteios.id = _sorteio;
  return query select p.id, p.nome, p.email from public.sorteio_participantes p where p.id = v_id;
end;
$$;
revoke all on function public.sortear(uuid, boolean) from public, anon;
grant execute on function public.sortear(uuid, boolean) to authenticated;

-- Primeiro sorteio já pronto para a palestra.
insert into public.sorteios (titulo)
select 'Palestra Mulheres Empreendedoras'
where not exists (select 1 from public.sorteios);
