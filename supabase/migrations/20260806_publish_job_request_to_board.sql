-- When an employer posts a job request, also publish an open board job
-- so candidates see it under Available jobs. Links via job_requests.source_job_id.

CREATE OR REPLACE FUNCTION public.publish_job_request_to_board(p_request_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.job_requests%ROWTYPE;
  v_client_name text;
  v_job_id uuid;
  v_emp public.employment_type;
  v_pay numeric(10, 2);
  v_desc text;
  v_user_client uuid;
  v_pay_match text[];
BEGIN
  SELECT * INTO v_req FROM public.job_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job request not found';
  END IF;

  SELECT linked_client_id INTO v_user_client
  FROM public.users
  WHERE auth_id = auth.uid();

  -- Authenticated callers must own the request (or be staff).
  -- Migrations / service context (no auth.uid) may publish for backfill.
  IF auth.uid() IS NOT NULL
     AND NOT public.is_staff()
     AND (v_user_client IS NULL OR v_user_client <> v_req.client_id) THEN
    RAISE EXCEPTION 'Not allowed to publish this job request';
  END IF;

  IF v_req.source_job_id IS NOT NULL THEN
    RETURN v_req.source_job_id;
  END IF;

  SELECT name INTO v_client_name
  FROM public.clients
  WHERE id = v_req.client_id;

  v_emp := CASE
    WHEN lower(coalesce(v_req.employment_type, '')) ~ 'perm|full.?time|fte'
      THEN 'permanent'::public.employment_type
    ELSE 'temp'::public.employment_type
  END;

  v_pay_match := regexp_match(coalesce(v_req.pay_rate_text, ''), '([0-9]+(?:\.[0-9]+)?)');
  IF v_pay_match IS NOT NULL THEN
    v_pay := v_pay_match[1]::numeric(10, 2);
  END IF;

  v_desc := coalesce(nullif(trim(v_req.description), ''), v_req.title);
  IF v_req.department IS NOT NULL AND length(trim(v_req.department)) > 0 THEN
    v_desc := v_desc || E'\n\nDepartment: ' || trim(v_req.department);
  END IF;
  IF v_req.skills IS NOT NULL AND cardinality(v_req.skills) > 0 THEN
    v_desc := v_desc || E'\n\nSkills: ' || array_to_string(v_req.skills, ', ');
  END IF;
  IF v_req.certifications IS NOT NULL AND cardinality(v_req.certifications) > 0 THEN
    v_desc := v_desc || E'\n\nCertifications: ' || array_to_string(v_req.certifications, ', ');
  END IF;

  INSERT INTO public.jobs (
    client_id,
    employer_name,
    title,
    description,
    location,
    employment_type,
    pay_rate_min,
    pay_rate_max,
    status,
    posted_at,
    updated_at
  )
  VALUES (
    v_req.client_id,
    coalesce(nullif(trim(v_client_name), ''), 'Employer'),
    v_req.title,
    v_desc,
    v_req.location,
    v_emp,
    v_pay,
    v_pay,
    'open',
    now(),
    now()
  )
  RETURNING id INTO v_job_id;

  UPDATE public.job_requests
  SET
    source_job_id = v_job_id,
    updated_at = now()
  WHERE id = p_request_id;

  RETURN v_job_id;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_job_request_to_board(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_job_request_to_board(uuid) TO authenticated;

-- Backfill existing open employer requests that are not yet on the candidate board.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT id
    FROM public.job_requests
    WHERE source_job_id IS NULL
      AND status = 'open'
  LOOP
    PERFORM public.publish_job_request_to_board(r.id);
  END LOOP;
END;
$$;
