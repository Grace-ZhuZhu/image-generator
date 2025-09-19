-- Petography: add helpful indexes and usage aggregation views/RPC for themes
-- Safe to re-run in dev; use IF NOT EXISTS and CREATE OR REPLACE

BEGIN;

-- =============================
-- Indexes for themes
-- =============================
-- Filter by is_active then order by sort_order is the common pattern
CREATE INDEX IF NOT EXISTS idx_themes_active_sort
  ON public.themes (is_active, sort_order);

-- Additional common sorts
CREATE INDEX IF NOT EXISTS idx_themes_created_at
  ON public.themes (created_at);

CREATE INDEX IF NOT EXISTS idx_themes_name
  ON public.themes (name);

-- =============================
-- Indexes for reference_images
-- =============================
-- Composite index to support filtering by theme and popularity/time ordering
CREATE INDEX IF NOT EXISTS idx_reference_images_theme_usage_created
  ON public.reference_images (theme_id, usage_count, created_at);

-- Lightweight index purely for theme_id lookups/joins
CREATE INDEX IF NOT EXISTS idx_reference_images_theme
  ON public.reference_images (theme_id);

-- =============================
-- Indexes for pet_generations (future use by gallery/history)
-- =============================
CREATE INDEX IF NOT EXISTS idx_pet_generations_user_created
  ON public.pet_generations (user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_pet_generations_status
  ON public.pet_generations (generation_status);

-- =============================
-- Aggregated usage stats for themes
-- =============================
CREATE OR REPLACE VIEW public.theme_usage_stats AS
SELECT
  t.id AS theme_id,
  COUNT(ri.id)::bigint        AS image_count,
  COALESCE(SUM(ri.usage_count), 0)::bigint AS total_usage_count
FROM public.themes t
LEFT JOIN public.reference_images ri ON ri.theme_id = t.id
GROUP BY t.id;

-- Enriched themes view to ease API consumption / DB-side sorting
CREATE OR REPLACE VIEW public.v_themes_enriched AS
SELECT
  t.id,
  t.name,
  t.description,
  t.sort_order,
  t.is_active,
  t.created_at,
  s.image_count,
  s.total_usage_count
FROM public.themes t
LEFT JOIN public.theme_usage_stats s ON s.theme_id = t.id;

-- =============================
-- Optional RPC: fetch enriched themes with filtering, sorting and pagination
-- Sorting supports: sort_order | created_at | name | usage
-- Order supports: asc | desc
-- Active filter: 'true' | 'false' | 'all'
-- =============================
CREATE OR REPLACE FUNCTION public.get_themes_enriched(
  _active text DEFAULT 'true',
  _sort text DEFAULT 'sort_order',
  _order text DEFAULT 'asc',
  _page integer DEFAULT 1,
  _limit integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  sort_order integer,
  is_active boolean,
  created_at timestamptz,
  image_count bigint,
  total_usage_count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    e.id,
    e.name,
    e.description,
    e.sort_order,
    e.is_active,
    e.created_at,
    e.image_count,
    e.total_usage_count
  FROM public.v_themes_enriched e
  WHERE (
    _active = 'all' OR e.is_active = (_active = 'true')
  )
  ORDER BY
    CASE WHEN _sort = 'sort_order'  AND _order = 'asc'  THEN e.sort_order END ASC,
    CASE WHEN _sort = 'sort_order'  AND _order = 'desc' THEN e.sort_order END DESC,
    CASE WHEN _sort = 'created_at'  AND _order = 'asc'  THEN e.created_at END ASC,
    CASE WHEN _sort = 'created_at'  AND _order = 'desc' THEN e.created_at END DESC,
    CASE WHEN _sort = 'name'        AND _order = 'asc'  THEN e.name END ASC,
    CASE WHEN _sort = 'name'        AND _order = 'desc' THEN e.name END DESC,
    CASE WHEN _sort = 'usage'       AND _order = 'asc'  THEN e.total_usage_count END ASC,
    CASE WHEN _sort = 'usage'       AND _order = 'desc' THEN e.total_usage_count END DESC,
    -- final deterministic tiebreaker
    e.sort_order ASC,
    e.created_at DESC
  LIMIT GREATEST(_limit, 1)
  OFFSET GREATEST((_page - 1), 0) * GREATEST(_limit, 1);
$$;

COMMENT ON VIEW public.v_themes_enriched IS 'Themes with aggregated image_count and total_usage_count';
COMMENT ON FUNCTION public.get_themes_enriched(text, text, text, integer, integer)
  IS 'Enriched themes list with filtering/sorting/pagination; intended for usage-based sorting without app-side aggregation.';

COMMIT;

