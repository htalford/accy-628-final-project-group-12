-- Soft-delete for candidate message threads (counterpart lanes).
-- Hidden from candidate inbox while deleted; Deleted folder shows last 30 days.
-- Staff portals still see the underlying messages.

CREATE TABLE public.candidate_deleted_threads (
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  counterpart_role text NOT NULL,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (employee_id, counterpart_role),
  CONSTRAINT candidate_deleted_threads_role_check
    CHECK (counterpart_role IN ('recruiter', 'accounting', 'system'))
);

CREATE INDEX candidate_deleted_threads_employee_deleted_idx
  ON public.candidate_deleted_threads(employee_id, deleted_at DESC);

ALTER TABLE public.candidate_deleted_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY candidate_deleted_threads_select ON public.candidate_deleted_threads
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR employee_id = public.current_app_employee_id()
  );

CREATE POLICY candidate_deleted_threads_insert ON public.candidate_deleted_threads
  FOR INSERT TO authenticated
  WITH CHECK (
    employee_id = public.current_app_employee_id()
  );

CREATE POLICY candidate_deleted_threads_update ON public.candidate_deleted_threads
  FOR UPDATE TO authenticated
  USING (employee_id = public.current_app_employee_id())
  WITH CHECK (employee_id = public.current_app_employee_id());

CREATE POLICY candidate_deleted_threads_delete ON public.candidate_deleted_threads
  FOR DELETE TO authenticated
  USING (
    public.is_staff()
    OR employee_id = public.current_app_employee_id()
  );
