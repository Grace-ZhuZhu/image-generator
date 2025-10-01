-- Create prompts table to normalize template data structure
-- This migration creates a separate table for prompts to eliminate data redundancy
-- where multiple template images share the same prompt/theme
-- Note: title field is kept in templates table as it's image-level metadata (for alt text)

BEGIN;

-- Ensure handle_updated_at function exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt text NOT NULL,
    theme text,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Ensure unique combination of prompt and theme
    CONSTRAINT prompts_prompt_theme_unique UNIQUE(prompt, theme)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_prompts_theme ON public.prompts(theme);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON public.prompts(created_at DESC);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS handle_prompts_updated_at ON public.prompts;
CREATE TRIGGER handle_prompts_updated_at
    BEFORE UPDATE ON public.prompts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read prompts (public access)
CREATE POLICY "Prompts are viewable by everyone"
    ON public.prompts FOR SELECT
    USING (true);

-- Service role can manage all prompts
CREATE POLICY "Service role can manage prompts"
    ON public.prompts FOR ALL
    USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON public.prompts TO anon;
GRANT SELECT ON public.prompts TO authenticated;
GRANT ALL ON public.prompts TO service_role;

COMMIT;

