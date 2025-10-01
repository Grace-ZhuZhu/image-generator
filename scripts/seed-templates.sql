-- Seed script to add sample templates for testing
-- Run this after creating the templates table

-- Insert sample templates for different themes
INSERT INTO public.templates (id, title, theme, prompt, images, usage, created_by, created_at, updated_at)
VALUES
  -- Holiday theme
  (
    gen_random_uuid(),
    '圣诞狗狗',
    'holiday',
    'A high-quality portrait of a {{pet_by_breed}} wearing a Santa hat and Christmas decorations in studio lighting.',
    '{"sm": "sample/holiday1/sm.jpg", "md": "sample/holiday1/md.jpg", "lg": "sample/holiday1/lg.jpg", "orig": "sample/holiday1/orig.jpg"}'::jsonb,
    999,
    NULL,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '万圣节猫咪',
    'holiday',
    'A high-quality portrait of a {{pet_by_breed}} with Halloween pumpkins and spooky decorations in studio lighting.',
    '{"sm": "sample/holiday2/sm.jpg", "md": "sample/holiday2/md.jpg", "lg": "sample/holiday2/lg.jpg", "orig": "sample/holiday2/orig.jpg"}'::jsonb,
    444,
    NULL,
    NOW(),
    NOW()
  ),
  
  -- Career theme
  (
    gen_random_uuid(),
    '警察宠物',
    'career',
    'A high-quality portrait of a {{pet_by_breed}} wearing a police uniform and hat in studio lighting.',
    '{"sm": "sample/career1/sm.jpg", "md": "sample/career1/md.jpg", "lg": "sample/career1/lg.jpg", "orig": "sample/career1/orig.jpg"}'::jsonb,
    888,
    NULL,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '厨师宠物',
    'career',
    'A high-quality portrait of a {{pet_by_breed}} wearing a chef hat and apron in a kitchen setting.',
    '{"sm": "sample/career2/sm.jpg", "md": "sample/career2/md.jpg", "lg": "sample/career2/lg.jpg", "orig": "sample/career2/orig.jpg"}'::jsonb,
    333,
    NULL,
    NOW(),
    NOW()
  ),
  
  -- Fantasy theme
  (
    gen_random_uuid(),
    '超级英雄',
    'fantasy',
    'A high-quality portrait of a {{pet_by_breed}} as a superhero with cape and mask in dramatic lighting.',
    '{"sm": "sample/fantasy1/sm.jpg", "md": "sample/fantasy1/md.jpg", "lg": "sample/fantasy1/lg.jpg", "orig": "sample/fantasy1/orig.jpg"}'::jsonb,
    777,
    NULL,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '公主宠物',
    'fantasy',
    'A high-quality portrait of a {{pet_by_breed}} as a princess with crown and royal attire in castle setting.',
    '{"sm": "sample/fantasy2/sm.jpg", "md": "sample/fantasy2/md.jpg", "lg": "sample/fantasy2/lg.jpg", "orig": "sample/fantasy2/orig.jpg"}'::jsonb,
    222,
    NULL,
    NOW(),
    NOW()
  ),
  
  -- Fashion theme
  (
    gen_random_uuid(),
    '时尚宠物',
    'fashion',
    'A high-quality portrait of a {{pet_by_breed}} in fashionable clothing and accessories in studio lighting.',
    '{"sm": "sample/fashion1/sm.jpg", "md": "sample/fashion1/md.jpg", "lg": "sample/fashion1/lg.jpg", "orig": "sample/fashion1/orig.jpg"}'::jsonb,
    666,
    NULL,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    '奢华风格',
    'fashion',
    'A high-quality portrait of a {{pet_by_breed}} with luxury jewelry and elegant styling in glamorous setting.',
    '{"sm": "sample/fashion2/sm.jpg", "md": "sample/fashion2/md.jpg", "lg": "sample/fashion2/lg.jpg", "orig": "sample/fashion2/orig.jpg"}'::jsonb,
    111,
    NULL,
    NOW(),
    NOW()
  ),
  
  -- Art theme
  (
    gen_random_uuid(),
    '油画风格',
    'art',
    'A high-quality portrait of a {{pet_by_breed}} in classical oil painting style with artistic background.',
    '{"sm": "sample/art1/sm.jpg", "md": "sample/art1/md.jpg", "lg": "sample/art1/lg.jpg", "orig": "sample/art1/orig.jpg"}'::jsonb,
    555,
    NULL,
    NOW(),
    NOW()
  );

-- Verify insertion
SELECT theme, COUNT(*) as count, MAX(usage) as max_usage
FROM public.templates
GROUP BY theme
ORDER BY theme;

