
-- Tabela de contas bancárias cadastradas
CREATE TABLE public.contas_bancarias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  banco TEXT NOT NULL,
  agencia TEXT,
  conta TEXT,
  tipo TEXT NOT NULL DEFAULT 'corrente',
  saldo_inicial NUMERIC NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contas_bancarias"
ON public.contas_bancarias FOR SELECT USING (true);

CREATE POLICY "Admins can manage contas_bancarias"
ON public.contas_bancarias FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_contas_bancarias_updated_at
BEFORE UPDATE ON public.contas_bancarias
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Tabela de transações importadas do extrato bancário
CREATE TABLE public.extrato_bancario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conta_bancaria_id UUID NOT NULL REFERENCES public.contas_bancarias(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  tipo TEXT NOT NULL, -- 'credito' ou 'debito'
  fitid TEXT, -- ID único da transação no OFX
  memo TEXT,
  saldo NUMERIC,
  origem TEXT NOT NULL DEFAULT 'manual', -- 'ofx', 'csv', 'manual'
  conciliado BOOLEAN NOT NULL DEFAULT false,
  conciliado_com_id UUID, -- ID do lançamento do fluxo_caixa conciliado
  conciliado_com_tabela TEXT, -- 'fluxo_caixa', 'contas_pagar', 'contas_receber'
  conciliado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.extrato_bancario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view extrato_bancario"
ON public.extrato_bancario FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert extrato_bancario"
ON public.extrato_bancario FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update extrato_bancario"
ON public.extrato_bancario FOR UPDATE USING (true);

CREATE POLICY "Admins can delete extrato_bancario"
ON public.extrato_bancario FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Índices para performance
CREATE INDEX idx_extrato_bancario_conta ON public.extrato_bancario(conta_bancaria_id);
CREATE INDEX idx_extrato_bancario_data ON public.extrato_bancario(data);
CREATE INDEX idx_extrato_bancario_conciliado ON public.extrato_bancario(conciliado);
CREATE INDEX idx_extrato_bancario_fitid ON public.extrato_bancario(fitid);
