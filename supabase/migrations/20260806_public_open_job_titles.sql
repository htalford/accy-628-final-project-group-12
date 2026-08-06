-- Public job title listing for marketing search (no pay/description exposure).
CREATE OR REPLACE FUNCTION public.list_public_open_jobs()
RETURNS TABLE (
  id uuid,
  title text,
  location text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT j.id, j.title, j.location
  FROM public.jobs j
  WHERE j.status = 'open'
  ORDER BY j.posted_at DESC;
$$;

REVOKE ALL ON FUNCTION public.list_public_open_jobs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_open_jobs() TO anon, authenticated;
