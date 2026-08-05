-- Candidate "interested" flags for open jobs (separate from applications).
CREATE TABLE public.job_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT job_interests_job_employee_uidx UNIQUE (job_id, employee_id)
);

CREATE INDEX job_interests_employee_id_idx ON public.job_interests(employee_id);
CREATE INDEX job_interests_job_id_idx ON public.job_interests(job_id);

ALTER TABLE public.job_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_interests_select ON public.job_interests
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR employee_id = public.current_app_employee_id()
  );

CREATE POLICY job_interests_insert ON public.job_interests
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_staff()
    OR employee_id = public.current_app_employee_id()
  );

CREATE POLICY job_interests_delete ON public.job_interests
  FOR DELETE TO authenticated
  USING (
    public.is_staff()
    OR employee_id = public.current_app_employee_id()
  );
