-- Seed script to add sample templates for testing
-- Run this after creating the templates and prompts tables
-- This script uses the new normalized structure with prompts table
-- Note: title field is stored in templates table (not prompts) as it's image-level metadata

BEGIN;

-- Step 1: Insert sample prompts (without title - title is per-template)
INSERT INTO public.prompts (id, prompt, theme, created_by, created_at, updated_at)
VALUES
  -- Holiday theme prompts
  (
    '11111111-1111-1111-1111-111111111111',
    'A high-quality portrait of a {{pet_by_breed}} wearing a Santa hat and Christmas decorations in studio lighting.',
    'holiday',
    NULL,
    NOW(),
    NOW()
  ),
  (
    '11111111-1111-1111-1111-111111111112',
    'A high-quality portrait of a {{pet_by_breed}} with Halloween pumpkins and spooky decorations in studio lighting.',
    'holiday',
    NULL,
    NOW(),
    NOW()
  ),
  -- Career theme prompts
  (
    '22222222-2222-2222-2222-222222222221',
    'A high-quality portrait of a {{pet_by_breed}} wearing a police uniform and hat in studio lighting.',
    'career',
    NULL,
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'A high-quality portrait of a {{pet_by_breed}} wearing a chef hat and apron in a kitchen setting.',
    'career',
    NULL,
    NOW(),
    NOW()
  ),
  -- Fantasy theme prompts
  (
    '33333333-3333-3333-3333-333333333331',
    'A high-quality portrait of a {{pet_by_breed}} as a superhero with cape and mask in dramatic lighting.',
    'fantasy',
    NULL,
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-3333-3333-333333333332',
    'A high-quality portrait of a {{pet_by_breed}} as a princess with crown and royal attire in castle setting.',
    'fantasy',
    NULL,
    NOW(),
    NOW()
  ),
  -- Fashion theme prompts
  (
    '44444444-4444-4444-4444-444444444441',
    'A high-quality portrait of a {{pet_by_breed}} in fashionable clothing and accessories in studio lighting.',
    'fashion',
    NULL,
    NOW(),
    NOW()
  ),
  (
    '44444444-4444-4444-4444-444444444442',
    'A high-quality portrait of a {{pet_by_breed}} with luxury jewelry and elegant styling in glamorous setting.',
    'fashion',
    NULL,
    NOW(),
    NOW()
  ),
  -- Art theme prompts
  (
    '55555555-5555-5555-5555-555555555551',
    'A high-quality portrait of a {{pet_by_breed}} in classical oil painting style with artistic background.',
    'art',
    NULL,
    NOW(),
    NOW()
  )
ON CONFLICT (prompt, theme) DO NOTHING;

-- Step 2: Insert sample templates (referencing the prompts)
-- title is stored in templates table as it's image-specific (used for alt text)
INSERT INTO public.templates (id, prompt_id, title, images, usage, created_by, created_at, updated_at)
VALUES
  -- Holiday templates
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '圣诞狗狗', '{"sm": "sample/holiday1/sm.jpg", "md": "sample/holiday1/md.jpg", "lg": "sample/holiday1/lg.jpg", "orig": "sample/holiday1/orig.jpg"}'::jsonb, 999, NULL, NOW(), NOW()),
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111112', '万圣节猫咪', '{"sm": "sample/holiday2/sm.jpg", "md": "sample/holiday2/md.jpg", "lg": "sample/holiday2/lg.jpg", "orig": "sample/holiday2/orig.jpg"}'::jsonb, 444, NULL, NOW(), NOW()),
  -- Career templates
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222221', '警察宠物', '{"sm": "sample/career1/sm.jpg", "md": "sample/career1/md.jpg", "lg": "sample/career1/lg.jpg", "orig": "sample/career1/orig.jpg"}'::jsonb, 888, NULL, NOW(), NOW()),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '厨师宠物', '{"sm": "sample/career2/sm.jpg", "md": "sample/career2/md.jpg", "lg": "sample/career2/lg.jpg", "orig": "sample/career2/orig.jpg"}'::jsonb, 333, NULL, NOW(), NOW()),
  -- Fantasy templates
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333331', '超级英雄', '{"sm": "sample/fantasy1/sm.jpg", "md": "sample/fantasy1/md.jpg", "lg": "sample/fantasy1/lg.jpg", "orig": "sample/fantasy1/orig.jpg"}'::jsonb, 777, NULL, NOW(), NOW()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333332', '公主宠物', '{"sm": "sample/fantasy2/sm.jpg", "md": "sample/fantasy2/md.jpg", "lg": "sample/fantasy2/lg.jpg", "orig": "sample/fantasy2/orig.jpg"}'::jsonb, 222, NULL, NOW(), NOW()),
  -- Fashion templates
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444441', '时尚宠物', '{"sm": "sample/fashion1/sm.jpg", "md": "sample/fashion1/md.jpg", "lg": "sample/fashion1/lg.jpg", "orig": "sample/fashion1/orig.jpg"}'::jsonb, 666, NULL, NOW(), NOW()),
  (gen_random_uuid(), '44444444-4444-4444-4444-444444444442', '奢华风格', '{"sm": "sample/fashion2/sm.jpg", "md": "sample/fashion2/md.jpg", "lg": "sample/fashion2/lg.jpg", "orig": "sample/fashion2/orig.jpg"}'::jsonb, 111, NULL, NOW(), NOW()),
  -- Art templates
  (gen_random_uuid(), '55555555-5555-5555-5555-555555555551', '油画风格', '{"sm": "sample/art1/sm.jpg", "md": "sample/art1/md.jpg", "lg": "sample/art1/lg.jpg", "orig": "sample/art1/orig.jpg"}'::jsonb, 555, NULL, NOW(), NOW());

COMMIT;

-- Verify insertion
SELECT p.theme, COUNT(t.id) as template_count, MAX(t.usage) as max_usage
FROM public.prompts p
LEFT JOIN public.templates t ON t.prompt_id = p.id
GROUP BY p.theme
ORDER BY p.theme;

