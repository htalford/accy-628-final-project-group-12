-- Employers can see jobs/applications for their company (candidate-portal applies).

CREATE POLICY jobs_select_employer ON public.jobs
  FOR SELECT TO authenticated
  USING (
    public.current_app_role() = 'employer'
    AND client_id IS NOT NULL
    AND client_id = public.current_app_client_id()
  );

CREATE POLICY jobs_select_employer_by_name ON public.jobs
  FOR SELECT TO authenticated
  USING (
    public.current_app_role() = 'employer'
    AND client_id IS NULL
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = public.current_app_client_id()
        AND lower(c.name) = lower(jobs.employer_name)
    )
  );

CREATE POLICY applications_select_employer ON public.applications
  FOR SELECT TO authenticated
  USING (
    public.current_app_role() = 'employer'
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = applications.job_id
        AND (
          j.client_id = public.current_app_client_id()
          OR (
            j.client_id IS NULL
            AND EXISTS (
              SELECT 1 FROM public.clients c
              WHERE c.id = public.current_app_client_id()
                AND lower(c.name) = lower(j.employer_name)
            )
          )
        )
    )
  );

CREATE POLICY applications_update_employer ON public.applications
  FOR UPDATE TO authenticated
  USING (
    public.current_app_role() = 'employer'
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = applications.job_id
        AND (
          j.client_id = public.current_app_client_id()
          OR (
            j.client_id IS NULL
            AND EXISTS (
              SELECT 1 FROM public.clients c
              WHERE c.id = public.current_app_client_id()
                AND lower(c.name) = lower(j.employer_name)
            )
          )
        )
    )
  )
  WITH CHECK (
    public.current_app_role() = 'employer'
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = applications.job_id
        AND (
          j.client_id = public.current_app_client_id()
          OR (
            j.client_id IS NULL
            AND EXISTS (
              SELECT 1 FROM public.clients c
              WHERE c.id = public.current_app_client_id()
                AND lower(c.name) = lower(j.employer_name)
            )
          )
        )
    )
  );

CREATE POLICY employees_select_employer_applicant ON public.employees
  FOR SELECT TO authenticated
  USING (
    public.current_app_role() = 'employer'
    AND EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.employee_id = employees.id
        AND (
          j.client_id = public.current_app_client_id()
          OR (
            j.client_id IS NULL
            AND EXISTS (
              SELECT 1 FROM public.clients c
              WHERE c.id = public.current_app_client_id()
                AND lower(c.name) = lower(j.employer_name)
            )
          )
        )
    )
  );

UPDATE public.jobs j
SET client_id = c.id,
    updated_at = now()
FROM public.clients c
WHERE j.client_id IS NULL
  AND lower(j.employer_name) = lower(c.name);
