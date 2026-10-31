-- =====================================================================================
-- Roleta do sorteio: a roleta mostra só o primeiro nome e o bonequinho de cada inscrito
-- (nada de e-mail ou data de nascimento). Girar continua sendo só da administradora.
-- =====================================================================================

create or replace function public.roleta_sorteio(_sorteio uuid)
returns table (id uuid, nome text, avatar text)
language sql stable security definer set search_path = public
as $$
  select p.id, split_part(btrim(p.nome), ' ', 1), p.avatar
  from public.sorteio_participantes p
  where p.sorteio_id = _sorteio
  order by p.created_at;
$$;
revoke all on function public.roleta_sorteio(uuid) from public;
grant execute on function public.roleta_sorteio(uuid) to anon, authenticated;

-- Limpa o cadastro de teste do Ramon.
delete from public.sorteio_participantes where nome ilike 'ramon%';
