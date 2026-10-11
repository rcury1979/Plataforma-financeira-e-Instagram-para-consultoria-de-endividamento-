
CREATE TABLE public.pf_notas_mensais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ano_mes TEXT NOT NULL, -- formato YYYY-MM
  nota TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, ano_mes)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pf_notas_mensais TO authenticated;
GRANT ALL ON public.pf_notas_mensais TO service_role;

ALTER TABLE public.pf_notas_mensais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own monthly notes"
  ON public.pf_notas_mensais FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER pf_notas_mensais_updated_at
  BEFORE UPDATE ON public.pf_notas_mensais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX pf_notas_mensais_user_mes_idx ON public.pf_notas_mensais (user_id, ano_mes);
