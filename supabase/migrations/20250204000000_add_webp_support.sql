-- Add WebP support to templates table
-- This migration updates the images field structure to support multiple formats (JPEG and WebP)
-- 
-- Old format: images.sm = "uuid/sm.jpg"
-- New format: images.sm = { jpg: "uuid/sm.jpg", webp: "uuid/sm.webp" }
--
-- This migration is backward compatible - old data will continue to work

BEGIN;

-- Add comment to document the new structure
COMMENT ON COLUMN public.templates.images IS 
'Image paths in JSONB format. Supports multi-format structure:
New format: { "sm": { "jpg": "uuid/sm.jpg", "webp": "uuid/sm.webp" }, ... }
Old format (backward compatible): { "sm": "uuid/sm.jpg", ... }';

-- Create a function to validate the images JSONB structure
CREATE OR REPLACE FUNCTION validate_template_images(images jsonb)
RETURNS boolean AS $$
BEGIN
  -- Check if all required size keys exist
  IF NOT (images ? 'sm' AND images ? 'md' AND images ? 'lg' AND images ? 'orig') THEN
    RETURN false;
  END IF;
  
  -- New format: each size should have jpg and webp keys
  IF jsonb_typeof(images->'sm') = 'object' THEN
    RETURN (
      images->'sm' ? 'jpg' AND images->'sm' ? 'webp' AND
      images->'md' ? 'jpg' AND images->'md' ? 'webp' AND
      images->'lg' ? 'jpg' AND images->'lg' ? 'webp' AND
      images->'orig' ? 'jpg' AND images->'orig' ? 'webp'
    );
  END IF;
  
  -- Old format: each size is a string (backward compatible)
  IF jsonb_typeof(images->'sm') = 'string' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a check constraint to validate images structure (optional, can be enabled later)
-- Commented out by default to avoid breaking existing data
-- ALTER TABLE public.templates
--   ADD CONSTRAINT valid_images_structure 
--   CHECK (validate_template_images(images));

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'WebP support migration completed successfully.';
    RAISE NOTICE 'The images field now supports multi-format structure.';
    RAISE NOTICE 'Old data format remains compatible.';
END $$;

