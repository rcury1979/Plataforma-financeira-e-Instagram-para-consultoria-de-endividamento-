\set ON_ERROR_STOP 0
-- Pessoas: cli (cliente), edu (educadora dela), outra (outra educadora), intruso (outro cliente), admin
insert into auth.users values
 ('11111111-1111-1111-1111-111111111111','cliente@x.com', now()),
 ('22222222-2222-2222-2222-222222222222','edu@x.com', now()),
 ('33333333-3333-3333-3333-333333333333','outra@x.com', now()),
 ('44444444-4444-4444-4444-444444444444','intruso@x.com', now()),
 ('55555555-5555-5555-5555-555555555555','admin@x.com', now());
insert into public.user_roles(user_id, role) values ('55555555-5555-5555-5555-555555555555','admin');
insert into public.profiles(user_id, full_name) values ('11111111-1111-1111-1111-111111111111','Cliente'),('22222222-2222-2222-2222-222222222222','Educadora'),('44444444-4444-4444-4444-444444444444','Intruso');
-- educadora cadastra a cliente pelo e-mail ANTES da cliente confirmar (convite)
insert into auth.users values ('66666666-6666-6666-6666-666666666666','nova@x.com', null);
insert into public.clientes(user_id, nome, email, cliente_user_id) values
 ('22222222-2222-2222-2222-222222222222','Cliente','cliente@x.com','11111111-1111-1111-1111-111111111111'),
 ('22222222-2222-2222-2222-222222222222','Nova','nova@x.com', null);
insert into public.cli_contas(user_id, nome, saldo_inicial) values ('11111111-1111-1111-1111-111111111111','Itaú',1000),('44444444-4444-4444-4444-444444444444','Conta do intruso',5);

set role authenticated;
\echo '--- 1. cliente ve so as proprias contas (esperado: Itaú)'
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111'; select nome from cli_contas;
\echo '--- 2. educadora ve a conta da cliente dela (esperado: Itaú)'
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222'; select nome from cli_contas;
\echo '--- 3. educadora cria tarefa para a cliente (esperado: INSERT 0 1)'
insert into cli_tarefas(user_id, titulo, criado_por) values ('11111111-1111-1111-1111-111111111111','Montar reserva','22222222-2222-2222-2222-222222222222');
\echo '--- 4. outra educadora NAO ve nada (esperado: 0 linhas)'
set request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333'; select count(*) from cli_contas; select count(*) from cli_tarefas;
\echo '--- 5. outra educadora NAO consegue inserir na cliente (esperado: ERRO de RLS)'
insert into cli_contas(user_id, nome) values ('11111111-1111-1111-1111-111111111111','hack');
\echo '--- 6. intruso NAO ve a cliente e NAO altera (esperado: Conta do intruso; UPDATE 0)'
set request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444'; select nome from cli_contas;
update cli_contas set saldo_inicial = 0 where user_id = '11111111-1111-1111-1111-111111111111';
\echo '--- 7. admin da plataforma NAO ve financas de clientes (esperado: 0)'
set request.jwt.claim.sub = '55555555-5555-5555-5555-555555555555'; select count(*) from cli_contas;
\echo '--- 8. anonimo (sem login) NAO ve nada (esperado: 0)'
reset request.jwt.claim.sub; select count(*) from cli_contas;
\echo '--- 9. cliente le o perfil da educadora (esperado: Cliente, Educadora) e nao o do intruso'
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111'; select full_name from profiles order by 1;
\echo '--- 10. educadora le perfil da cliente (esperado: Cliente, Educadora)'
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222'; select full_name from profiles order by 1;
\echo '--- 11. cliente nao consegue gravar linha em nome de outro (esperado: ERRO de RLS)'
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111'; insert into cli_contas(user_id, nome) values ('44444444-4444-4444-4444-444444444444','x');
\echo '--- 12. educadora arquiva a cliente -> perde acesso (esperado: 0)'
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222'; update clientes set arquivado = true where nome='Cliente'; select count(*) from cli_contas; update clientes set arquivado = false where nome='Cliente';
reset role;
\echo '--- 13. convite: Nova confirma e-mail -> vinculo automatico (esperado: 6666...)'
update auth.users set email_confirmed_at = now() where id = '66666666-6666-6666-6666-666666666666';
select nome, cliente_user_id from clientes where nome = 'Nova';
