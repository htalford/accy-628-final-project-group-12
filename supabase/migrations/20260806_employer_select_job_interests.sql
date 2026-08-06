-- Employers can see who marked interest on their company's jobs (candidate portal).
CREATE POLICY job_interests_select_employer ON public.job_interests
  FOR SELECT TO authenticated
  USING (
    public.current_app_role() = 'employer'
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_interests.job_id
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

-- Employers can read employee profiles for candidates who marked interest on their jobs.
CREATE POLICY employees_select_employer_job_interest ON public.employees
  FOR SELECT TO authenticated
  USING (
    public.current_app_role() = 'employer'
    AND EXISTS (
      SELECT 1
      FROM public.job_interests ji
      JOIN public.jobs j ON j.id = ji.job_id
      WHERE ji.employee_id = employees.id
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
