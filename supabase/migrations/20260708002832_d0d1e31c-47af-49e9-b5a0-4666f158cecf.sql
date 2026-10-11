CREATE POLICY "Users can update own imports"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'imports' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'imports' AND auth.uid()::text = (storage.foldername(name))[1]);