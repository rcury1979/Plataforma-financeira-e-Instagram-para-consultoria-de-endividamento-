CREATE POLICY "Users can update their own import files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'imports' AND owner = auth.uid())
WITH CHECK (bucket_id = 'imports' AND owner = auth.uid());