
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles RLS
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles RLS
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + admin role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INT;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  -- First user gets admin role, others get user role
  SELECT COUNT(*) INTO user_count FROM auth.users;
  IF user_count <= 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Company settings
CREATE TABLE public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  cnpj TEXT,
  segment TEXT DEFAULT 'restaurante',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage company" ON public.company_settings FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view company" ON public.company_settings FOR SELECT TO authenticated USING (true);

-- Contas a Pagar
CREATE TABLE public.contas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  valor DECIMAL(12,2) NOT NULL,
  vencimento DATE NOT NULL,
  pago BOOLEAN DEFAULT false,
  data_pagamento DATE,
  forma_pagamento TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view contas_pagar" ON public.contas_pagar FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert contas_pagar" ON public.contas_pagar FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update contas_pagar" ON public.contas_pagar FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete contas_pagar" ON public.contas_pagar FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_contas_pagar_updated_at BEFORE UPDATE ON public.contas_pagar FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Contas a Receber
CREATE TABLE public.contas_receber (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente TEXT NOT NULL,
  descricao TEXT,
  valor DECIMAL(12,2) NOT NULL,
  vencimento DATE NOT NULL,
  recebido BOOLEAN DEFAULT false,
  data_recebimento DATE,
  forma_pagamento TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view contas_receber" ON public.contas_receber FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert contas_receber" ON public.contas_receber FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update contas_receber" ON public.contas_receber FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete contas_receber" ON public.contas_receber FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_contas_receber_updated_at BEFORE UPDATE ON public.contas_receber FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Fluxo de Caixa
CREATE TABLE public.fluxo_caixa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  descricao TEXT NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  forma_pagamento TEXT,
  categoria TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fluxo_caixa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view fluxo_caixa" ON public.fluxo_caixa FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert fluxo_caixa" ON public.fluxo_caixa FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update fluxo_caixa" ON public.fluxo_caixa FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete fluxo_caixa" ON public.fluxo_caixa FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Funcionários
CREATE TABLE public.funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL,
  salario DECIMAL(12,2) NOT NULL,
  admissao DATE NOT NULL,
  telefone TEXT,
  status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Férias', 'Afastado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view funcionarios" ON public.funcionarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage funcionarios" ON public.funcionarios FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_funcionarios_updated_at BEFORE UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Adiantamentos
CREATE TABLE public.adiantamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE CASCADE NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  motivo TEXT,
  parcelas INTEGER DEFAULT 1,
  status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Aprovado', 'Negado')),
  aprovado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.adiantamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view adiantamentos" ON public.adiantamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert adiantamentos" ON public.adiantamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update adiantamentos" ON public.adiantamentos FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_adiantamentos_updated_at BEFORE UPDATE ON public.adiantamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
