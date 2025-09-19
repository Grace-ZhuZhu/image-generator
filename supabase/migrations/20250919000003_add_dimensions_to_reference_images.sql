-- Add optional width/height dimensions to reference_images for layout pre-sizing
-- Idempotent: uses IF NOT EXISTS and conditional constraint creation

BEGIN;

ALTER TABLE public.reference_images
  ADD COLUMN IF NOT EXISTS width  integer,
  ADD COLUMN IF NOT EXISTS height integer;

-- Ensure positive values when provided
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reference_images_width_height_positive'
  ) THEN
    ALTER TABLE public.reference_images
      ADD CONSTRAINT reference_images_width_height_positive
      CHECK (
        (width IS NULL OR width > 0) AND (height IS NULL OR height > 0)
      );
  END IF;
END$$;

COMMIT;

