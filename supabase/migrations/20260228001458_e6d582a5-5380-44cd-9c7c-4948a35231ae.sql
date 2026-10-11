
-- Create storage bucket for file imports
INSERT INTO storage.buckets (id, name, public) VALUES ('imports', 'imports', false);

-- RLS policies for imports bucket
CREATE POLICY "Authenticated users can upload imports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'imports' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view their imports"
ON storage.objects FOR SELECT
USING (bucket_id = 'imports' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete their imports"
ON storage.objects FOR DELETE
USING (bucket_id = 'imports' AND auth.uid() IS NOT NULL);
