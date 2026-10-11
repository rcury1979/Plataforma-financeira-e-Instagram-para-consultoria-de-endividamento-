CREATE TABLE public.reels_destaque (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL,
  titulo text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.reels_destaque TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reels_destaque TO authenticated;
GRANT ALL ON public.reels_destaque TO service_role;

ALTER TABLE public.reels_destaque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reels ativos sao publicos" ON public.reels_destaque
FOR SELECT TO anon, authenticated USING (ativo = true);

CREATE POLICY "Admins podem ver todos os reels" ON public.reels_destaque
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem inserir reels" ON public.reels_destaque
FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar reels" ON public.reels_destaque
FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem remover reels" ON public.reels_destaque
FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER reels_destaque_updated_at BEFORE UPDATE ON public.reels_destaque
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.reels_destaque (code, titulo, ordem)
VALUES ('Db8XL80uDKc', 'Organize suas contas e recomece com um plano possível', 1);