CREATE TABLE public.admin_ai_conversations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL UNIQUE,
 messages jsonb NOT NULL DEFAULT '[]'::jsonb,
 access_blocked boolean NOT NULL DEFAULT false,
 blocked_status integer,
 blocked_reason text,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_ai_conversations TO authenticated;
GRANT ALL ON public.admin_ai_conversations TO service_role;
ALTER TABLE public.admin_ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_ai_private_read ON public.admin_ai_conversations FOR SELECT TO authenticated USING (user_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));
CREATE INDEX admin_ai_conversations_user_idx ON public.admin_ai_conversations(user_id);