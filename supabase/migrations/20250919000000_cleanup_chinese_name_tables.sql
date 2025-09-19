-- ⚠️  PRODUCTION DATABASE CLEANUP SCRIPT ⚠️
-- This script safely removes Chinese name generation related tables
-- 
-- IMPORTANT: This script is designed to be run ONLY ONCE in production
-- It will permanently delete all Chinese name generation data
-- 
-- Before running this script:
-- 1. Create a full database backup
-- 2. Verify that no critical data depends on these tables
-- 3. Test this script in a staging environment first
-- 4. Get approval from stakeholders
--
-- Tables to be removed:
-- - generation_batches (Chinese name generation batches)
-- - generated_names (Generated Chinese names)
-- - saved_names (User saved Chinese names)
--
-- This script uses IF EXISTS to prevent errors if tables don't exist

-- Step 1: Drop dependent tables first (to avoid foreign key constraints)
DROP TABLE IF EXISTS public.saved_names CASCADE;
DROP TABLE IF EXISTS public.generated_names CASCADE;
DROP TABLE IF EXISTS public.generation_batches CASCADE;

-- Step 2: Drop any remaining indexes that might reference these tables
DROP INDEX IF EXISTS generation_batches_user_id_idx;
DROP INDEX IF EXISTS generation_batches_created_at_idx;
DROP INDEX IF EXISTS generation_batches_plan_type_idx;
DROP INDEX IF EXISTS generated_names_batch_id_idx;
DROP INDEX IF EXISTS generated_names_position_idx;
DROP INDEX IF EXISTS generated_names_chinese_name_idx;
DROP INDEX IF EXISTS saved_names_user_id_idx;
DROP INDEX IF EXISTS saved_names_chinese_name_idx;

-- Step 3: Drop any triggers related to these tables
DROP TRIGGER IF EXISTS handle_generation_batches_updated_at ON public.generation_batches;
DROP TRIGGER IF EXISTS handle_generated_names_updated_at ON public.generated_names;
DROP TRIGGER IF EXISTS handle_saved_names_updated_at ON public.saved_names;

-- Step 4: Drop any RLS policies related to these tables
-- (Policies are automatically dropped when tables are dropped, but being explicit)
DROP POLICY IF EXISTS "Users can view their own generation batches" ON public.generation_batches;
DROP POLICY IF EXISTS "Users can insert their own generation batches" ON public.generation_batches;
DROP POLICY IF EXISTS "Users can update their own generation batches" ON public.generation_batches;
DROP POLICY IF EXISTS "Users can delete their own generation batches" ON public.generation_batches;

DROP POLICY IF EXISTS "Users can view names from their own batches" ON public.generated_names;
DROP POLICY IF EXISTS "Users can insert names to their own batches" ON public.generated_names;
DROP POLICY IF EXISTS "Users can update names in their own batches" ON public.generated_names;
DROP POLICY IF EXISTS "Users can delete names from their own batches" ON public.generated_names;

DROP POLICY IF EXISTS "Users can view their own saved names" ON public.saved_names;
DROP POLICY IF EXISTS "Users can insert their own saved names" ON public.saved_names;
DROP POLICY IF EXISTS "Users can update their own saved names" ON public.saved_names;
DROP POLICY IF EXISTS "Users can delete their own saved names" ON public.saved_names;

-- Step 5: Clean up any remaining sequences or functions specific to Chinese names
-- (None identified at this time, but this is where they would go)

-- Step 6: Log the cleanup completion
-- Insert a record into credits_history to track this cleanup operation
-- This helps with auditing and ensures we have a record of when this cleanup occurred
INSERT INTO public.credits_history (
    customer_id, 
    amount, 
    type, 
    description, 
    metadata
) 
SELECT 
    c.id,
    0,
    'add',
    'Database cleanup: Chinese name tables removed',
    jsonb_build_object(
        'cleanup_date', now(),
        'cleanup_type', 'chinese_name_tables_removal',
        'tables_removed', ARRAY['generation_batches', 'generated_names', 'saved_names']
    )
FROM public.customers c
WHERE c.creem_customer_id LIKE 'admin_%'
LIMIT 1;

-- If no admin customer exists, create a system log entry
INSERT INTO public.credits_history (
    customer_id, 
    amount, 
    type, 
    description, 
    metadata
) 
SELECT 
    c.id,
    0,
    'add',
    'Database cleanup: Chinese name tables removed',
    jsonb_build_object(
        'cleanup_date', now(),
        'cleanup_type', 'chinese_name_tables_removal',
        'tables_removed', ARRAY['generation_batches', 'generated_names', 'saved_names'],
        'note', 'System cleanup operation'
    )
FROM public.customers c
ORDER BY c.created_at ASC
LIMIT 1;

-- Success message
-- Note: This will only be visible in the SQL execution log
SELECT 'Chinese name generation tables have been successfully removed from the database.' as cleanup_status;
