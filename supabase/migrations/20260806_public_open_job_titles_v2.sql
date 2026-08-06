-- Public job title search: open board jobs + employer job requests.
-- Returns title for display; search_text is for keyword matching only.
DROP FUNCTION IF EXISTS public.list_public_open_jobs();

CREATE FUNCTION public.list_public_open_jobs()
RETURNS TABLE (
  id uuid,
  title text,
  location text,
  search_text text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    j.id,
    j.title,
    j.location,
    lower(
      concat_ws(
        ' ',
        j.title,
        j.description,
        j.location,
        j.employer_name,
        j.employment_type::text
      )
    ) AS search_text
  FROM public.jobs j
  WHERE j.status = 'open'

  UNION ALL

  SELECT
    r.id,
    r.title,
    r.location,
    lower(
      concat_ws(
        ' ',
        r.title,
        r.description,
        r.location,
        r.department,
        r.employment_type,
        r.industry,
        array_to_string(r.skills, ' '),
        array_to_string(r.certifications, ' ')
      )
    ) AS search_text
  FROM public.job_requests r
  WHERE r.status IN ('open', 'in_progress');
$$;

REVOKE ALL ON FUNCTION public.list_public_open_jobs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_open_jobs() TO anon, authenticated;
