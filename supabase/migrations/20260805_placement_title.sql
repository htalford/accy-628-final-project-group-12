-- Add role/position title on placements (Client Portal + seed).
ALTER TABLE public.placements ADD COLUMN IF NOT EXISTS title text;

UPDATE public.placements SET title = 'Warehouse Associate'
WHERE id = '33333333-3333-3333-3333-333333333301';
UPDATE public.placements SET title = 'Logistics Coordinator'
WHERE id = '33333333-3333-3333-3333-333333333302';
UPDATE public.placements SET title = 'Registered Nurse'
WHERE id = '33333333-3333-3333-3333-333333333303';
UPDATE public.placements SET title = 'Assembly Technician'
WHERE id = '33333333-3333-3333-3333-333333333304';
UPDATE public.placements SET title = 'Medical Assistant'
WHERE id = '33333333-3333-3333-3333-333333333305';
UPDATE public.placements SET title = 'Medical Assistant'
WHERE id = '33333333-3333-3333-3333-333333333306';

UPDATE public.placements
SET title = COALESCE(
  title,
  CASE
    WHEN placement_type = 'permanent' THEN 'Permanent Placement'
    ELSE 'Temporary Assignment'
  END
)
WHERE title IS NULL;
