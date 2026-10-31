-- =====================================================================================
-- Roleta: qualquer pessoa pode girar (é uma interação da palestra).
--  • Enquanto não há vencedora, qualquer um gira — inclusive sem login.
--  • Depois que saiu uma vencedora, girar de novo (sortear outra pessoa) é só da administradora,
--    para ninguém ficar "regirando" até cair em si.
-- =====================================================================================

create or replace function public.sortear(_sorteio uuid, _excluir_atual boolean default false)
returns table (id uuid, nome text, email text)
language plpgsql security definer set search_path = public
as $$
declare v_atual uuid; v_id uuid; v_admin boolean := coalesce(public.has_role(auth.uid(), 'admin'), false);
begin
  select s.vencedor_id into v_atual from public.sorteios s where s.id = _sorteio for update;
  if not found then
    raise exception 'sorteio não encontrado';
  end if;
  if v_atual is not null and not v_admin then
    raise exception 'o sorteio já tem uma vencedora';
  end if;
  select p.id into v_id from public.sorteio_participantes p
   where p.sorteio_id = _sorteio and (not _excluir_atual or v_atual is null or p.id <> v_atual)
   order by random() limit 1;
  if v_id is null then
    raise exception 'não há participantes para sortear';
  end if;
  update public.sorteios set vencedor_id = v_id, sorteado_em = now(), aberto = false where sorteios.id = _sorteio;
  -- O e-mail só volta para a administradora.
  return query select p.id, p.nome, case when v_admin then p.email else null end
    from public.sorteio_participantes p where p.id = v_id;
end;
$$;
revoke all on function public.sortear(uuid, boolean) from public;
grant execute on function public.sortear(uuid, boolean) to anon, authenticated;
