-- Réplica mínima do Supabase para testar RLS
do $$ begin if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; create role service_role nologin bypassrls; create role anon nologin; end if; end $$;
create schema auth;
create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
grant usage on schema public to authenticated;
create type public.app_role as enum ('admin','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid, role app_role);
create function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create function public.update_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create table public.profiles (id uuid primary key default gen_random_uuid(), user_id uuid unique, full_name text, created_at timestamptz default now(), updated_at timestamptz default now());
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
grant select, insert, update, delete on public.profiles to authenticated;
create table public.clientes (id uuid primary key default gen_random_uuid(), user_id uuid not null, nome text, email text, arquivado boolean default false, cliente_user_id uuid unique, responsavel_id uuid);
alter table public.clientes enable row level security;
create policy "own clientes" on public.clientes for all to authenticated using (auth.uid()=user_id) with check (auth.uid()=user_id);
grant select, insert, update, delete on public.clientes to authenticated;
