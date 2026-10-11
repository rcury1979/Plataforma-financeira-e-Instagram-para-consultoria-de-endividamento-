CREATE TABLE public.leads_planilha (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  origem TEXT DEFAULT 'planilha-gratis',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_planilha_email ON public.leads_planilha(email);

ALTER TABLE public.leads_planilha ENABLE ROW LEVEL SECURITY;

-- Cadastro público (formulário aberto)
CREATE POLICY "Qualquer um pode se inscrever"
ON public.leads_planilha
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(nome)) > 1
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

-- Sem leitura pública: só service role acessa