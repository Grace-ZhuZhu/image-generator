-- Cleanup templates table by removing redundant columns
-- This migration removes the old prompt and theme columns after data migration
-- Note: title field is kept in templates table as it's image-level metadata (for alt text)

BEGIN;

-- Step 1: Verify all templates have prompt_id before proceeding
DO $$
DECLARE
    orphaned_count integer;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM public.templates
    WHERE prompt_id IS NULL;

    IF orphaned_count > 0 THEN
        RAISE EXCEPTION 'Cannot proceed: Found % templates without prompt_id. Run migration 20250130000001 first.', orphaned_count;
    END IF;
END $$;

-- Step 2: Set prompt_id as NOT NULL
ALTER TABLE public.templates
    ALTER COLUMN prompt_id SET NOT NULL;

-- Step 3: Drop redundant columns from templates table
-- Only prompt and theme are moved to prompts table
-- title remains in templates table as it's image-specific (used for alt text)
ALTER TABLE public.templates
    DROP COLUMN IF EXISTS prompt,
    DROP COLUMN IF EXISTS theme;

-- Step 4: Drop old indexes that are no longer needed
DROP INDEX IF EXISTS idx_templates_theme;
DROP INDEX IF EXISTS idx_templates_theme_usage;

-- Step 5: Create new composite index for common queries
-- This replaces the old theme-based indexes with prompt-based ones
CREATE INDEX IF NOT EXISTS idx_templates_prompt_usage ON public.templates(prompt_id, usage DESC);

-- Step 6: Add comment to document the schema change
COMMENT ON TABLE public.templates IS 'Template images table. Each template references a prompt via prompt_id. Multiple templates can share the same prompt.';
COMMENT ON COLUMN public.templates.prompt_id IS 'Foreign key to prompts table. Defines the AI generation prompt and theme for this template.';
COMMENT ON COLUMN public.templates.title IS 'Image-specific title used for alt text. Each template image can have its own title.';

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Templates table cleanup completed successfully. Old redundant columns removed.';
END $$;

