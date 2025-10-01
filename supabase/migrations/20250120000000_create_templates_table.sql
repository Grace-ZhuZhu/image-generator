-- Create templates table for storing AI-generated image templates
-- This table stores template images with their prompts and metadata

BEGIN;

-- Create templates table
CREATE TABLE IF NOT EXISTS public.templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title text,
    theme text,
    prompt text NOT NULL,
    images jsonb NOT NULL,
    usage integer DEFAULT 0 NOT NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT usage_non_negative CHECK (usage >= 0)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_templates_theme ON public.templates(theme);
CREATE INDEX IF NOT EXISTS idx_templates_usage ON public.templates(usage DESC);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON public.templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_theme_usage ON public.templates(theme, usage DESC);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS handle_templates_updated_at ON public.templates;
CREATE TRIGGER handle_templates_updated_at
    BEFORE UPDATE ON public.templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read templates (public access)
CREATE POLICY "Templates are viewable by everyone"
    ON public.templates FOR SELECT
    USING (true);

-- Service role can manage all templates
CREATE POLICY "Service role can manage templates"
    ON public.templates FOR ALL
    USING (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON public.templates TO anon;
GRANT SELECT ON public.templates TO authenticated;
GRANT ALL ON public.templates TO service_role;

COMMIT;

