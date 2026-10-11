-- Backfill: cria empresa para usuários existentes sem vínculo
DO $$
DECLARE u RECORD; new_empresa_id UUID;
BEGIN
  FOR u IN SELECT p.user_id, p.full_name, p.email FROM public.profiles p
           WHERE NOT EXISTS (SELECT 1 FROM public.usuario_empresas ue WHERE ue.user_id = p.user_id)
  LOOP
    INSERT INTO public.empresas (nome) VALUES (COALESCE(NULLIF(u.full_name,''), u.email, 'Minha empresa'))
      RETURNING id INTO new_empresa_id;
    INSERT INTO public.usuario_empresas (user_id, empresa_id, papel)
      VALUES (u.user_id, new_empresa_id, 'proprietario');
  END LOOP;
END $$;

-- Atualiza handle_new_user para criar empresa automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT;
  new_empresa_id UUID;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, plano, trial_ends_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email, 'trial', now() + interval '7 days'
  );

  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count <= 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  -- Cria empresa padrão e vincula o usuário
  INSERT INTO public.empresas (nome)
    VALUES (COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name',''), NEW.email, 'Minha empresa'))
    RETURNING id INTO new_empresa_id;
  INSERT INTO public.usuario_empresas (user_id, empresa_id, papel)
    VALUES (NEW.id, new_empresa_id, 'proprietario');

  RETURN NEW;
END;
$$;