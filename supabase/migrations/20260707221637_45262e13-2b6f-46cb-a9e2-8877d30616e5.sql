
-- Add PF/PJ profile type + PF-specific fields
DO $$ BEGIN
  CREATE TYPE public.tipo_pessoa_enum AS ENUM ('PF','PJ');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tipo_pessoa public.tipo_pessoa_enum NOT NULL DEFAULT 'PJ',
  ADD COLUMN IF NOT EXISTS cpf TEXT,
  ADD COLUMN IF NOT EXISTS data_nascimento DATE,
  ADD COLUMN IF NOT EXISTS objetivo_financeiro TEXT;

-- Update signup trigger to persist tipo_pessoa from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_count INT;
  new_empresa_id UUID;
  v_tipo public.tipo_pessoa_enum;
BEGIN
  v_tipo := COALESCE(NULLIF(NEW.raw_user_meta_data->>'tipo_pessoa','')::public.tipo_pessoa_enum, 'PJ');

  INSERT INTO public.profiles (user_id, full_name, email, plano, trial_ends_at, tipo_pessoa)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email, 'trial', now() + interval '7 days',
    v_tipo
  );

  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count <= 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  -- Cria empresa/espaço padrão e vincula o usuário (serve para PF como "espaço pessoal")
  INSERT INTO public.empresas (nome)
    VALUES (COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name',''), NEW.email, CASE WHEN v_tipo='PF' THEN 'Meu espaço pessoal' ELSE 'Minha empresa' END))
    RETURNING id INTO new_empresa_id;
  INSERT INTO public.usuario_empresas (user_id, empresa_id, papel)
    VALUES (NEW.id, new_empresa_id, 'proprietario');

  RETURN NEW;
END;
$function$;
