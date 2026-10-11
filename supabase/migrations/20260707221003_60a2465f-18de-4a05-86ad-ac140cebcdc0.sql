DROP VIEW IF EXISTS public.estoque_saldo;
CREATE VIEW public.estoque_saldo
WITH (security_invoker = true) AS
SELECT p.id AS produto_id, p.empresa_id, p.nome, p.sku, p.unidade, p.estoque_minimo,
  COALESCE(SUM(CASE m.tipo
    WHEN 'entrada' THEN m.quantidade
    WHEN 'saida' THEN -m.quantidade
    WHEN 'ajuste' THEN m.quantidade
  END), 0) AS saldo
FROM public.produtos p
LEFT JOIN public.estoque_movimentacoes m ON m.produto_id = p.id
GROUP BY p.id;
GRANT SELECT ON public.estoque_saldo TO authenticated, service_role;