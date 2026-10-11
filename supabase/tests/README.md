# Testes de segurança (RLS) da Área do Cliente

Rodam num PostgreSQL local, sem tocar no Supabase real:

```sh
createdb rlstest
psql -d rlstest -v ON_ERROR_STOP=1 -f supabase/tests/rls_00_stub_supabase.sql
psql -d rlstest -v ON_ERROR_STOP=1 -f supabase/migrations/20261009000000_area_cliente.sql
psql -d rlstest -f supabase/tests/rls_area_cliente_test.sql
```

Cada bloco imprime o resultado esperado. Cobre: cliente só vê o que é dele; educadora só vê clientes vinculados;
outra educadora, outro cliente, admin da plataforma e visitante sem login não veem nada; arquivar o cliente
corta o acesso; convite por e-mail vincula sozinho quando o cliente confirma o e-mail.
