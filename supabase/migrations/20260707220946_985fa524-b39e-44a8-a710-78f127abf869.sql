-- 1. PRODUTOS
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  sku TEXT,
  tipo TEXT NOT NULL DEFAULT 'produto' CHECK (tipo IN ('produto','servico')),
  descricao TEXT,
  preco_venda NUMERIC(14,2) NOT NULL DEFAULT 0,
  custo NUMERIC(14,2) NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL DEFAULT 'UN',
  estoque_minimo NUMERIC(14,3) NOT NULL DEFAULT 0,
  ncm TEXT, cfop TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "produtos_acesso" ON public.produtos FOR ALL TO authenticated
  USING (public.user_has_empresa_access(auth.uid(), empresa_id))
  WITH CHECK (public.user_has_empresa_access(auth.uid(), empresa_id));
CREATE TRIGGER produtos_upd BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE INDEX idx_produtos_empresa ON public.produtos(empresa_id, ativo);

-- 2. FORNECEDORES
CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, cnpj_cpf TEXT, email TEXT, telefone TEXT,
  endereco TEXT, condicao_pagamento TEXT, observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO authenticated;
GRANT ALL ON public.fornecedores TO service_role;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fornecedores_acesso" ON public.fornecedores FOR ALL TO authenticated
  USING (public.user_has_empresa_access(auth.uid(), empresa_id))
  WITH CHECK (public.user_has_empresa_access(auth.uid(), empresa_id));
CREATE TRIGGER fornecedores_upd BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE INDEX idx_fornecedores_empresa ON public.fornecedores(empresa_id);

-- 3. ESTOQUE
CREATE TABLE public.estoque_movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada','saida','ajuste')),
  quantidade NUMERIC(14,3) NOT NULL,
  custo_unitario NUMERIC(14,2) NOT NULL DEFAULT 0,
  origem TEXT, observacoes TEXT,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque_movimentacoes TO authenticated;
GRANT ALL ON public.estoque_movimentacoes TO service_role;
ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "estoque_acesso" ON public.estoque_movimentacoes FOR ALL TO authenticated
  USING (public.user_has_empresa_access(auth.uid(), empresa_id))
  WITH CHECK (public.user_has_empresa_access(auth.uid(), empresa_id));
CREATE INDEX idx_estoque_produto ON public.estoque_movimentacoes(produto_id);
CREATE INDEX idx_estoque_empresa ON public.estoque_movimentacoes(empresa_id, data DESC);

CREATE OR REPLACE VIEW public.estoque_saldo AS
SELECT p.id AS produto_id, p.empresa_id, p.nome, p.sku, p.unidade, p.estoque_minimo,
  COALESCE(SUM(CASE m.tipo WHEN 'entrada' THEN m.quantidade WHEN 'saida' THEN -m.quantidade WHEN 'ajuste' THEN m.quantidade END), 0) AS saldo
FROM public.produtos p LEFT JOIN public.estoque_movimentacoes m ON m.produto_id = p.id
GROUP BY p.id;
GRANT SELECT ON public.estoque_saldo TO authenticated, service_role;

-- 4. VENDAS
CREATE TABLE public.pedidos_venda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  vendedor_id UUID REFERENCES auth.users(id),
  numero SERIAL,
  status TEXT NOT NULL DEFAULT 'orcamento' CHECK (status IN ('orcamento','pedido','faturado','cancelado')),
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_entrega DATE,
  valor_bruto NUMERIC(14,2) NOT NULL DEFAULT 0,
  desconto NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos_venda TO authenticated;
GRANT ALL ON public.pedidos_venda TO service_role;
ALTER TABLE public.pedidos_venda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pv_acesso" ON public.pedidos_venda FOR ALL TO authenticated
  USING (public.user_has_empresa_access(auth.uid(), empresa_id))
  WITH CHECK (public.user_has_empresa_access(auth.uid(), empresa_id));
CREATE TRIGGER pv_upd BEFORE UPDATE ON public.pedidos_venda FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE INDEX idx_pv_empresa ON public.pedidos_venda(empresa_id, status);

CREATE TABLE public.pedidos_venda_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos_venda(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  quantidade NUMERIC(14,3) NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(14,2) NOT NULL DEFAULT 0,
  desconto NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos_venda_itens TO authenticated;
GRANT ALL ON public.pedidos_venda_itens TO service_role;
ALTER TABLE public.pedidos_venda_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pvi_acesso" ON public.pedidos_venda_itens FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.pedidos_venda p WHERE p.id = pedido_id AND public.user_has_empresa_access(auth.uid(), p.empresa_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.pedidos_venda p WHERE p.id = pedido_id AND public.user_has_empresa_access(auth.uid(), p.empresa_id)));
CREATE INDEX idx_pvi_pedido ON public.pedidos_venda_itens(pedido_id);

-- 5. COMPRAS
CREATE TABLE public.ordens_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  numero SERIAL,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','recebida','cancelada')),
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_prevista DATE,
  valor_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordens_compra TO authenticated;
GRANT ALL ON public.ordens_compra TO service_role;
ALTER TABLE public.ordens_compra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oc_acesso" ON public.ordens_compra FOR ALL TO authenticated
  USING (public.user_has_empresa_access(auth.uid(), empresa_id))
  WITH CHECK (public.user_has_empresa_access(auth.uid(), empresa_id));
CREATE TRIGGER oc_upd BEFORE UPDATE ON public.ordens_compra FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE INDEX idx_oc_empresa ON public.ordens_compra(empresa_id, status);

CREATE TABLE public.ordens_compra_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_id UUID NOT NULL REFERENCES public.ordens_compra(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  quantidade NUMERIC(14,3) NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordens_compra_itens TO authenticated;
GRANT ALL ON public.ordens_compra_itens TO service_role;
ALTER TABLE public.ordens_compra_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oci_acesso" ON public.ordens_compra_itens FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ordens_compra o WHERE o.id = ordem_id AND public.user_has_empresa_access(auth.uid(), o.empresa_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ordens_compra o WHERE o.id = ordem_id AND public.user_has_empresa_access(auth.uid(), o.empresa_id)));
CREATE INDEX idx_oci_ordem ON public.ordens_compra_itens(ordem_id);

-- 6. PLANO DE CONTAS
CREATE TABLE public.plano_contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL, nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita','despesa')),
  grupo TEXT,
  parent_id UUID REFERENCES public.plano_contas(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, codigo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plano_contas TO authenticated;
GRANT ALL ON public.plano_contas TO service_role;
ALTER TABLE public.plano_contas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pc_acesso" ON public.plano_contas FOR ALL TO authenticated
  USING (public.user_has_empresa_access(auth.uid(), empresa_id))
  WITH CHECK (public.user_has_empresa_access(auth.uid(), empresa_id));
CREATE TRIGGER pc_upd BEFORE UPDATE ON public.plano_contas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 7. CENTROS DE CUSTO
CREATE TABLE public.centros_custo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL, nome TEXT NOT NULL,
  descricao TEXT, ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, codigo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.centros_custo TO authenticated;
GRANT ALL ON public.centros_custo TO service_role;
ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc_acesso" ON public.centros_custo FOR ALL TO authenticated
  USING (public.user_has_empresa_access(auth.uid(), empresa_id))
  WITH CHECK (public.user_has_empresa_access(auth.uid(), empresa_id));
CREATE TRIGGER cc_upd BEFORE UPDATE ON public.centros_custo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 8. CONTRATOS
CREATE TABLE public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(14,2) NOT NULL DEFAULT 0,
  periodicidade TEXT NOT NULL DEFAULT 'mensal' CHECK (periodicidade IN ('mensal','trimestral','semestral','anual')),
  dia_vencimento INT NOT NULL DEFAULT 5 CHECK (dia_vencimento BETWEEN 1 AND 31),
  proxima_cobranca DATE NOT NULL DEFAULT CURRENT_DATE,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos TO authenticated;
GRANT ALL ON public.contratos TO service_role;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contratos_acesso" ON public.contratos FOR ALL TO authenticated
  USING (public.user_has_empresa_access(auth.uid(), empresa_id))
  WITH CHECK (public.user_has_empresa_access(auth.uid(), empresa_id));
CREATE TRIGGER contratos_upd BEFORE UPDATE ON public.contratos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE INDEX idx_contratos_empresa ON public.contratos(empresa_id, ativo, proxima_cobranca);

-- 9. ORDENS DE SERVIÇO
CREATE TABLE public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  tecnico_id UUID REFERENCES auth.users(id),
  numero SERIAL, titulo TEXT NOT NULL, descricao TEXT,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta','em_execucao','concluida','cancelada')),
  prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa','media','alta','urgente')),
  valor NUMERIC(14,2) NOT NULL DEFAULT 0,
  prazo DATE, data_conclusao DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordens_servico TO authenticated;
GRANT ALL ON public.ordens_servico TO service_role;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "os_acesso" ON public.ordens_servico FOR ALL TO authenticated
  USING (public.user_has_empresa_access(auth.uid(), empresa_id))
  WITH CHECK (public.user_has_empresa_access(auth.uid(), empresa_id));
CREATE TRIGGER os_upd BEFORE UPDATE ON public.ordens_servico FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE INDEX idx_os_empresa ON public.ordens_servico(empresa_id, status);

-- 10. COMISSÕES
CREATE TABLE public.comissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  vendedor_id UUID NOT NULL REFERENCES auth.users(id),
  pedido_id UUID REFERENCES public.pedidos_venda(id) ON DELETE CASCADE,
  base_calculo NUMERIC(14,2) NOT NULL DEFAULT 0,
  percentual NUMERIC(6,3) NOT NULL DEFAULT 0,
  valor NUMERIC(14,2) NOT NULL DEFAULT 0,
  pago BOOLEAN NOT NULL DEFAULT false,
  data_pagamento DATE, observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comissoes TO authenticated;
GRANT ALL ON public.comissoes TO service_role;
ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comissoes_acesso" ON public.comissoes FOR ALL TO authenticated
  USING (public.user_has_empresa_access(auth.uid(), empresa_id))
  WITH CHECK (public.user_has_empresa_access(auth.uid(), empresa_id));
CREATE TRIGGER comissoes_upd BEFORE UPDATE ON public.comissoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 11. METAS
CREATE TABLE public.metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  mes DATE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'receita' CHECK (tipo IN ('receita','despesa','margem')),
  categoria TEXT,
  valor_previsto NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_realizado NUMERIC(14,2) NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metas TO authenticated;
GRANT ALL ON public.metas TO service_role;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "metas_acesso" ON public.metas FOR ALL TO authenticated
  USING (public.user_has_empresa_access(auth.uid(), empresa_id))
  WITH CHECK (public.user_has_empresa_access(auth.uid(), empresa_id));
CREATE TRIGGER metas_upd BEFORE UPDATE ON public.metas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE INDEX idx_metas_empresa ON public.metas(empresa_id, mes);

-- 12. ANEXOS
CREATE TABLE public.anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  entidade_tipo TEXT NOT NULL,
  entidade_id UUID NOT NULL,
  nome TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT, tamanho_bytes BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anexos TO authenticated;
GRANT ALL ON public.anexos TO service_role;
ALTER TABLE public.anexos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anexos_acesso" ON public.anexos FOR ALL TO authenticated
  USING (public.user_has_empresa_access(auth.uid(), empresa_id))
  WITH CHECK (public.user_has_empresa_access(auth.uid(), empresa_id));
CREATE INDEX idx_anexos_entidade ON public.anexos(entidade_tipo, entidade_id);
