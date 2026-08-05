-- Bridge candidate applications → client portal submittals (Candidates).
-- When a candidate applies to a job with client_id, create (or reuse) a
-- job_request and insert a submittal so the employer sees them under Candidates.

ALTER TABLE public.job_requests
  ADD COLUMN IF NOT EXISTS source_job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL;

ALTER TABLE public.submittals
  ADD COLUMN IF NOT EXISTS application_id uuid UNIQUE REFERENCES public.applications(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS job_requests_source_job_id_idx
  ON public.job_requests(source_job_id);

CREATE OR REPLACE FUNCTION public.forward_application_to_client(p_application_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app record;
  v_job record;
  v_emp record;
  v_job_request_id uuid;
  v_submittal_id uuid;
  v_name text;
  v_certs text[];
  v_summary text;
  v_resume_status text;
  v_stage public.submittal_stage;
  v_emp_type text;
BEGIN
  SELECT a.*
  INTO v_app
  FROM public.applications a
  WHERE a.id = p_application_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Already forwarded
  SELECT id INTO v_submittal_id
  FROM public.submittals
  WHERE application_id = p_application_id;
  IF FOUND THEN
    RETURN v_submittal_id;
  END IF;

  SELECT j.*
  INTO v_job
  FROM public.jobs j
  WHERE j.id = v_app.job_id;

  IF NOT FOUND OR v_job.client_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT e.*
  INTO v_emp
  FROM public.employees e
  WHERE e.id = v_app.employee_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Reuse matching job request for this board job / title
  SELECT jr.id
  INTO v_job_request_id
  FROM public.job_requests jr
  WHERE jr.client_id = v_job.client_id
    AND (
      jr.source_job_id = v_job.id
      OR lower(jr.title) = lower(v_job.title)
    )
  ORDER BY
    CASE WHEN jr.source_job_id = v_job.id THEN 0 ELSE 1 END,
    jr.created_at DESC
  LIMIT 1;

  IF v_job_request_id IS NULL THEN
    v_emp_type := CASE v_job.employment_type::text
      WHEN 'temp' THEN 'Temporary'
      WHEN 'contract' THEN 'Contract'
      WHEN 'permanent' THEN 'Permanent'
      ELSE initcap(replace(v_job.employment_type::text, '_', ' '))
    END;

    INSERT INTO public.job_requests (
      client_id,
      title,
      department,
      positions,
      status,
      employment_type,
      location,
      pay_rate_text,
      description,
      recruiter_name,
      source_job_id
    )
    VALUES (
      v_job.client_id,
      v_job.title,
      'Staffing',
      1,
      'open',
      v_emp_type,
      v_job.location,
      CASE
        WHEN v_job.pay_rate_min IS NOT NULL AND v_job.pay_rate_max IS NOT NULL
          THEN '$' || trim(to_char(v_job.pay_rate_min, 'FM9999990.00'))
            || '–$' || trim(to_char(v_job.pay_rate_max, 'FM9999990.00')) || '/hr'
        WHEN v_job.pay_rate_min IS NOT NULL
          THEN '$' || trim(to_char(v_job.pay_rate_min, 'FM9999990.00')) || '/hr'
        ELSE NULL
      END,
      v_job.description,
      'TalentQuest Board',
      v_job.id
    )
    RETURNING id INTO v_job_request_id;
  ELSE
    UPDATE public.job_requests
    SET source_job_id = COALESCE(source_job_id, v_job.id),
        updated_at = now()
    WHERE id = v_job_request_id
      AND source_job_id IS NULL;
  END IF;

  v_name := trim(COALESCE(v_emp.first_name, '') || ' ' || COALESCE(v_emp.last_name, ''));
  IF v_name = '' THEN
    v_name := COALESCE(v_emp.email, 'Candidate');
  END IF;

  -- employees.certifications is plain text; submittals.certifications is text[].
  IF v_emp.certifications IS NULL OR btrim(v_emp.certifications::text) = '' THEN
    v_certs := '{}'::text[];
  ELSE
    v_certs := regexp_split_to_array(btrim(v_emp.certifications::text), '\s*,\s*');
  END IF;

  v_summary := NULLIF(trim(COALESCE(v_app.cover_letter, '')), '');
  IF v_summary IS NULL AND COALESCE(v_app.include_profile, false) THEN
    v_summary := 'Candidate shared their TalentQuest profile with this application.';
  END IF;
  IF v_summary IS NULL AND v_app.note IS NOT NULL THEN
    v_summary := v_app.note;
  END IF;

  IF v_app.resume_url IS NOT NULL AND length(trim(v_app.resume_url)) > 0 THEN
    v_resume_status := 'On File';
  ELSIF COALESCE(v_app.include_profile, false) THEN
    v_resume_status := 'Profile Shared';
  ELSE
    v_resume_status := 'Cover Letter';
  END IF;

  v_stage := CASE v_app.status::text
    WHEN 'reviewing' THEN 'under_review'::public.submittal_stage
    WHEN 'interview' THEN 'interview'::public.submittal_stage
    WHEN 'offered' THEN 'offer'::public.submittal_stage
    WHEN 'rejected' THEN 'rejected'::public.submittal_stage
    ELSE 'submitted'::public.submittal_stage
  END;

  INSERT INTO public.submittals (
    job_request_id,
    client_id,
    employee_id,
    application_id,
    candidate_name,
    candidate_email,
    candidate_phone,
    position_title,
    recruiter_name,
    stage,
    resume_status,
    certifications,
    resume_summary,
    interview_notes
  )
  VALUES (
    v_job_request_id,
    v_job.client_id,
    v_emp.id,
    v_app.id,
    v_name,
    v_emp.email,
    v_emp.phone,
    v_job.title,
    'TalentQuest Board',
    v_stage,
    v_resume_status,
    v_certs,
    CASE
      WHEN v_app.resume_url IS NOT NULL AND length(trim(v_app.resume_url)) > 0
        THEN trim(BOTH E'\n' FROM CONCAT_WS(
          E'\n\n',
          v_summary,
          'Resume: ' || v_app.resume_url
        ))
      ELSE v_summary
    END,
    CASE
      WHEN COALESCE(v_app.include_profile, false)
        THEN 'Application includes candidate profile snapshot.'
      ELSE NULL
    END
  )
  RETURNING id INTO v_submittal_id;

  RETURN v_submittal_id;
END;
$$;

REVOKE ALL ON FUNCTION public.forward_application_to_client(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.forward_application_to_client(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.trg_forward_application_to_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.forward_application_to_client(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS applications_forward_to_client ON public.applications;
CREATE TRIGGER applications_forward_to_client
  AFTER INSERT ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_forward_application_to_client();

-- Backfill existing applications that map to a client job.
SELECT public.forward_application_to_client(a.id)
FROM public.applications a
JOIN public.jobs j ON j.id = a.job_id
WHERE j.client_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.submittals s WHERE s.application_id = a.id
  );
