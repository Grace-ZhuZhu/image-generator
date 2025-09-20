-- Storage policies for bucket `pet-uploads` so users can upload only to their own prefix
BEGIN;

-- Ensure RLS is enabled on storage.objects (it is by default in Supabase)
-- Create policies bound to bucket name 'pet-uploads'

-- Allow authenticated users to insert objects only under uploads/{uid}/raw/*
CREATE POLICY IF NOT EXISTS "Users can upload to their raw folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pet-uploads'
  AND (
    name LIKE ('uploads/' || auth.uid() || '/raw/%')
  )
);

-- Allow users to read their own objects (optional; signed URLs typically used)
CREATE POLICY IF NOT EXISTS "Users can read own objects"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pet-uploads'
  AND (
    name LIKE ('uploads/' || auth.uid() || '/%')
  )
);

-- Service role full access
CREATE POLICY IF NOT EXISTS "Service role manage pet-uploads"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'pet-uploads')
WITH CHECK (bucket_id = 'pet-uploads');

COMMIT;

