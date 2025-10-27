-- Create notify_subscribers table for public email subscriptions
-- Includes: lowercasing trigger, unique index, minimal RLS policy for anon INSERT

BEGIN;

-- 1) Table
CREATE TABLE IF NOT EXISTS public.notify_subscribers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT notify_subscribers_email_lower CHECK (email = lower(email))
);

-- 2) Unique index to guarantee de-duplication (idempotent insert)
CREATE UNIQUE INDEX IF NOT EXISTS notify_subscribers_email_key
  ON public.notify_subscribers(email);

-- 3) Normalization trigger: auto-trim and lowercase email on INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.normalize_notify_subscriber_email()
RETURNS trigger AS $$
BEGIN
  NEW.email := lower(trim(NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_normalize_notify_email ON public.notify_subscribers;
CREATE TRIGGER trg_normalize_notify_email
  BEFORE INSERT OR UPDATE ON public.notify_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.normalize_notify_subscriber_email();

-- 4) Enable RLS and allow anon INSERT only (no SELECT) for privacy
ALTER TABLE public.notify_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert emails" ON public.notify_subscribers;
CREATE POLICY "Allow public insert emails"
  ON public.notify_subscribers
  FOR INSERT
  TO anon
  WITH CHECK (true);

COMMIT;

