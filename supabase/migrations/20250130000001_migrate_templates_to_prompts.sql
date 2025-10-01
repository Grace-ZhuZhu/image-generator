-- Migrate existing template data to the new prompts table structure
-- This migration extracts unique prompts from templates and creates the relationship
-- Note: title field remains in templates table as it's image-level metadata

BEGIN;

-- Step 1: Add prompt_id column to templates table (nullable for now)
ALTER TABLE public.templates
    ADD COLUMN IF NOT EXISTS prompt_id uuid REFERENCES public.prompts(id) ON DELETE CASCADE;

-- Step 2: Ensure templates table has updated_at column (add if missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'templates'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.templates
            ADD COLUMN updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

        -- Create trigger for updated_at if it doesn't exist
        DROP TRIGGER IF EXISTS handle_templates_updated_at ON public.templates;
        CREATE TRIGGER handle_templates_updated_at
            BEFORE UPDATE ON public.templates
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- Step 3: Extract unique prompts from templates and insert into prompts table
-- Use DISTINCT ON to get one representative record for each unique prompt+theme combination
-- Note: We don't migrate title field as it stays in templates table
INSERT INTO public.prompts (prompt, theme, created_by, created_at, updated_at)
SELECT DISTINCT ON (t.prompt, t.theme)
    t.prompt,
    t.theme,
    t.created_by,
    MIN(t.created_at) OVER (PARTITION BY t.prompt, t.theme) as created_at,
    COALESCE(MAX(t.updated_at) OVER (PARTITION BY t.prompt, t.theme), MIN(t.created_at) OVER (PARTITION BY t.prompt, t.theme)) as updated_at
FROM public.templates t
WHERE t.prompt IS NOT NULL
ORDER BY t.prompt, t.theme, t.created_at ASC
ON CONFLICT (prompt, theme) DO NOTHING;

-- Step 4: Update templates table to link to prompts
UPDATE public.templates t
SET prompt_id = p.id
FROM public.prompts p
WHERE t.prompt = p.prompt
  AND (
    (t.theme = p.theme) OR
    (t.theme IS NULL AND p.theme IS NULL)
  );

-- Step 5: Verify data integrity - check for any templates without prompt_id
DO $$
DECLARE
    orphaned_count integer;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM public.templates
    WHERE prompt_id IS NULL;

    IF orphaned_count > 0 THEN
        RAISE WARNING 'Found % templates without prompt_id. These need manual review.', orphaned_count;
    ELSE
        RAISE NOTICE 'All templates successfully linked to prompts.';
    END IF;
END $$;

-- Step 6: Create index on prompt_id for better query performance
CREATE INDEX IF NOT EXISTS idx_templates_prompt_id ON public.templates(prompt_id);

COMMIT;

