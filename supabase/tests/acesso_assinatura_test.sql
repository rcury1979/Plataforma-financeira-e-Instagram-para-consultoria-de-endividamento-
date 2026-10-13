\set ON_ERROR_STOP 0
insert into auth.users(id,email,email_confirmed_at) values
 ('a0000000-0000-0000-0000-000000000001','pagante@x.com',now()),
 ('a0000000-0000-0000-0000-000000000002','semplano@x.com',now()),
 ('a0000000-0000-0000-0000-000000000003','mentoria@x.com',now()),
 ('a0000000-0000-0000-0000-000000000004','cortesia@x.com',now()),
 ('a0000000-0000-0000-0000-000000000005','vencido@x.com',now());
-- o primeiro usuário vira admin pelo gatilho; tiramos para testar como cliente comum
delete from public.user_roles where role='admin' and user_id in ('a0000000-0000-0000-0000-000000000001');
insert into auth.users(id,email,email_confirmed_at) values ('e0000000-0000-0000-0000-000000000009','marta@x.com',now());
insert into public.user_roles(user_id,role) values ('e0000000-0000-0000-0000-000000000009','admin');
insert into public.subscriptions(user_id,stripe_subscription_id,stripe_customer_id,product_id,price_id,status,current_period_end,environment) values
 ('a0000000-0000-0000-0000-000000000001','sub_1','cus_1','p','rm360_mensal_12m','trialing',now()+interval '7 days','live'),
 ('a0000000-0000-0000-0000-000000000005','sub_5','cus_5','p','rm360_mensal_6m','canceled',now()-interval '1 day','live');
insert into public.clientes(user_id,nome,cliente_user_id,tipo_pessoa) values ('e0000000-0000-0000-0000-000000000009','Mentorada','a0000000-0000-0000-0000-000000000003','PF');
insert into public.acessos_cortesia(user_id,motivo,concedido_por) values ('a0000000-0000-0000-0000-000000000004','teste','e0000000-0000-0000-0000-000000000009');
set role authenticated;
\echo '--- acesso (esperado: pagante t, semplano f, mentoria t, cortesia t, vencido f, marta t)'
set request.jwt.claim.sub='a0000000-0000-0000-0000-000000000001'; select 'pagante', tem_acesso_app(), (select origem from minha_assinatura());
set request.jwt.claim.sub='a0000000-0000-0000-0000-000000000002'; select 'semplano', tem_acesso_app(), (select origem from minha_assinatura());
set request.jwt.claim.sub='a0000000-0000-0000-0000-000000000003'; select 'mentoria', tem_acesso_app(), (select origem from minha_assinatura());
set request.jwt.claim.sub='a0000000-0000-0000-0000-000000000004'; select 'cortesia', tem_acesso_app(), (select origem from minha_assinatura());
set request.jwt.claim.sub='a0000000-0000-0000-0000-000000000005'; select 'vencido', tem_acesso_app(), (select origem from minha_assinatura());
set request.jwt.claim.sub='e0000000-0000-0000-0000-000000000009'; select 'marta', tem_acesso_app(), (select origem from minha_assinatura());
\echo '--- pagante grava (esperado INSERT 0 1)'
set request.jwt.claim.sub='a0000000-0000-0000-0000-000000000001'; insert into cli_contas(user_id,nome) values ('a0000000-0000-0000-0000-000000000001','Itaú');
\echo '--- sem plano NAO grava (esperado ERRO RLS)'
set request.jwt.claim.sub='a0000000-0000-0000-0000-000000000002'; insert into cli_contas(user_id,nome) values ('a0000000-0000-0000-0000-000000000002','X');
\echo '--- vencido le os proprios dados mas nao altera (esperado: count 1, UPDATE 0)'
reset role; insert into cli_contas(user_id,nome) values ('a0000000-0000-0000-0000-000000000005','Antiga'); set role authenticated;
set request.jwt.claim.sub='a0000000-0000-0000-0000-000000000005'; select count(*) from cli_contas; update cli_contas set nome='Y';
\echo '--- mentorada arquivada perde acesso (esperado f)'
reset role; update clientes set arquivado=true where cliente_user_id='a0000000-0000-0000-0000-000000000003'; set role authenticated;
set request.jwt.claim.sub='a0000000-0000-0000-0000-000000000003'; select tem_acesso_app();
\echo '--- cliente nao consegue se dar cortesia (esperado ERRO RLS)'
set request.jwt.claim.sub='a0000000-0000-0000-0000-000000000002'; insert into acessos_cortesia(user_id) values ('a0000000-0000-0000-0000-000000000002');
\echo '--- anonimo (esperado f)'
reset request.jwt.claim.sub; select tem_acesso_app();
