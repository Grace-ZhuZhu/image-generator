-- Create table to persist user uploads metadata including dimensions and scan status
BEGIN;

CREATE TABLE IF NOT EXISTS public.pet_uploads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket text NOT NULL,
  path text NOT NULL,
  content_type text,
  size integer,
  width integer,
  height integer,
  sha256 text,
  scan_status text NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending','scanning','clean','infected','failed')),
  scan_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(bucket, path)
);

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_pet_uploads_user_created ON public.pet_uploads(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_pet_uploads_sha256 ON public.pet_uploads(sha256);
CREATE INDEX IF NOT EXISTS idx_pet_uploads_scan_status ON public.pet_uploads(scan_status);

-- Enable RLS and policies
ALTER TABLE public.pet_uploads ENABLE ROW LEVEL SECURITY;

-- Owners can read their own records
CREATE POLICY IF NOT EXISTS "Owners can read their uploads"
  ON public.pet_uploads FOR SELECT
  USING (auth.uid() = user_id);

-- Owners can insert their own records only
CREATE POLICY IF NOT EXISTS "Owners can insert their uploads"
  ON public.pet_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage for background jobs
CREATE POLICY IF NOT EXISTS "Service role manage pet_uploads"
  ON public.pet_uploads FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMIT;

