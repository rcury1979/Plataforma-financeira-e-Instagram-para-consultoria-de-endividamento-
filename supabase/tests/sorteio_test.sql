\set ON_ERROR_STOP 0
insert into auth.users(id,email,email_confirmed_at) values ('e0000000-0000-0000-0000-000000000009','marta@x.com',now()),('a0000000-0000-0000-0000-000000000002','cliente@x.com',now()) on conflict do nothing;
insert into public.user_roles(user_id,role) values ('e0000000-0000-0000-0000-000000000009','admin') on conflict do nothing;
delete from public.user_roles where role='admin' and user_id='a0000000-0000-0000-0000-000000000002';
\echo '--- público (anon): vê o sorteio aberto'
set role anon; select titulo, aberto from sorteios;
\echo '--- anon se inscreve (ok, ok, repetido)'
select inscrever_sorteio((select id from sorteios limit 1),'Ana','ana@x.com','1990-05-01',true,'🦊');
select inscrever_sorteio((select id from sorteios limit 1),'Bia','bia@x.com','1985-02-10',true);
select inscrever_sorteio((select id from sorteios limit 1),'Ana 2','ANA@x.com','1990-05-01',true,'🦊');
\echo '--- anon sem consentimento (erro)'
select inscrever_sorteio((select id from sorteios limit 1),'C','c@x.com','1990-05-01',false);
\echo '--- anon NAO lê participantes (erro de permissão)'
select count(*) from sorteio_participantes;
\echo '--- anon vê só o total (2)'
select total_inscritos_sorteio((select id from sorteios limit 1));
\echo '--- anon NAO sorteia (erro)'
select * from sortear((select id from sorteios limit 1));
reset role; set role authenticated;
\echo '--- cliente comum NAO lê nem sorteia (0 linhas, erro)'
set request.jwt.claim.sub='a0000000-0000-0000-0000-000000000002'; select count(*) from sorteio_participantes; select * from sortear((select id from sorteios limit 1));
\echo '--- Marta lê (2) e sorteia (1 nome); sorteio fecha'
set request.jwt.claim.sub='e0000000-0000-0000-0000-000000000009'; select count(*) from sorteio_participantes;
select nome from sortear((select id from sorteios limit 1)); select aberto, vencedor_id is not null from sorteios;
\echo '--- sortear de novo excluindo o atual dá o outro nome'
select (select p.nome from sorteio_participantes p join sorteios s on s.vencedor_id=p.id) as antes, (select nome from sortear((select id from sorteios limit 1), true)) as depois;
reset role; set role anon;
\echo '--- inscrição após fechar (fechado)'
select inscrever_sorteio((select id from sorteios limit 1),'D','d@x.com','1990-05-01',true,'🦊');
reset role;
set role authenticated; set request.jwt.claim.sub='e0000000-0000-0000-0000-000000000009'; select nome, avatar from sorteio_participantes; reset role;
