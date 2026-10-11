CREATE OR REPLACE FUNCTION public.can_download_signup_gifts()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email_confirmed_at IS NOT NULL);
$$;
REVOKE ALL ON FUNCTION public.can_download_signup_gifts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_download_signup_gifts() TO authenticated;
CREATE POLICY signup_gifts_confirmed_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'cadastro-brindes' AND name IN ('metodo-gcpm.pdf', 'organizacao-financeira.pdf') AND public.can_download_signup_gifts());
CREATE POLICY signup_gifts_admin_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'cadastro-brindes' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY signup_gifts_admin_update ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'cadastro-brindes' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'cadastro-brindes' AND public.has_role(auth.uid(), 'admin'));