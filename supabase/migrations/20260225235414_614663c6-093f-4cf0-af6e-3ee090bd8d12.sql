
-- Notas Fiscais table
CREATE TABLE public.notas_fiscais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'nfs-e', -- 'nf-e' or 'nfs-e'
  numero TEXT,
  serie TEXT DEFAULT '1',
  natureza_operacao TEXT DEFAULT 'Prestação de Serviços',
  cliente_nome TEXT NOT NULL,
  cliente_cnpj_cpf TEXT,
  descricao TEXT NOT NULL,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  base_calculo NUMERIC NOT NULL DEFAULT 0,
  aliquota_iss NUMERIC DEFAULT 0,
  valor_iss NUMERIC DEFAULT 0,
  aliquota_icms NUMERIC DEFAULT 0,
  valor_icms NUMERIC DEFAULT 0,
  aliquota_pis NUMERIC DEFAULT 0.65,
  valor_pis NUMERIC DEFAULT 0,
  aliquota_cofins NUMERIC DEFAULT 3,
  valor_cofins NUMERIC DEFAULT 0,
  aliquota_irpj NUMERIC DEFAULT 0,
  valor_irpj NUMERIC DEFAULT 0,
  aliquota_csll NUMERIC DEFAULT 0,
  valor_csll NUMERIC DEFAULT 0,
  valor_simples NUMERIC DEFAULT 0,
  aliquota_simples NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'emitida', -- emitida, cancelada, pendente
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_competencia DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with empresa access can view notas"
  ON public.notas_fiscais FOR SELECT
  TO authenticated
  USING (public.user_has_empresa_access(auth.uid(), empresa_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users with empresa access can insert notas"
  ON public.notas_fiscais FOR INSERT
  TO authenticated
  WITH CHECK (public.user_has_empresa_access(auth.uid(), empresa_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users with empresa access can update notas"
  ON public.notas_fiscais FOR UPDATE
  TO authenticated
  USING (public.user_has_empresa_access(auth.uid(), empresa_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete notas"
  ON public.notas_fiscais FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Apuração de impostos mensal
CREATE TABLE public.apuracao_impostos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
  competencia TEXT NOT NULL, -- '2026-02'
  regime_tributario TEXT NOT NULL,
  faturamento_bruto NUMERIC NOT NULL DEFAULT 0,
  valor_iss NUMERIC DEFAULT 0,
  valor_icms NUMERIC DEFAULT 0,
  valor_pis NUMERIC DEFAULT 0,
  valor_cofins NUMERIC DEFAULT 0,
  valor_irpj NUMERIC DEFAULT 0,
  valor_csll NUMERIC DEFAULT 0,
  valor_simples NUMERIC DEFAULT 0,
  valor_total_impostos NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aberta', -- aberta, fechada
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(empresa_id, competencia)
);

ALTER TABLE public.apuracao_impostos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with empresa access can view apuracao"
  ON public.apuracao_impostos FOR SELECT
  TO authenticated
  USING (public.user_has_empresa_access(auth.uid(), empresa_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage apuracao"
  ON public.apuracao_impostos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_notas_fiscais_updated_at
  BEFORE UPDATE ON public.notas_fiscais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_apuracao_impostos_updated_at
  BEFORE UPDATE ON public.apuracao_impostos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
