-- Soft-delete for recruiter message threads (candidate / employer / accounting).
-- Hidden from recruiter Inbox while deleted; Deleted folder shows last 30 days.
-- Underlying messages remain for other portals.

CREATE TABLE IF NOT EXISTS public.recruiter_deleted_threads (
  participant_type text NOT NULL,
  thread_id text NOT NULL,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  deleted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  PRIMARY KEY (participant_type, thread_id),
  CONSTRAINT recruiter_deleted_threads_type_check
    CHECK (participant_type IN ('candidate', 'employer', 'accounting'))
);

CREATE INDEX IF NOT EXISTS recruiter_deleted_threads_deleted_at_idx
  ON public.recruiter_deleted_threads(deleted_at DESC);

ALTER TABLE public.recruiter_deleted_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recruiter_deleted_threads_select ON public.recruiter_deleted_threads;
CREATE POLICY recruiter_deleted_threads_select ON public.recruiter_deleted_threads
  FOR SELECT TO authenticated
  USING (public.is_staff());

DROP POLICY IF EXISTS recruiter_deleted_threads_insert ON public.recruiter_deleted_threads;
CREATE POLICY recruiter_deleted_threads_insert ON public.recruiter_deleted_threads
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS recruiter_deleted_threads_update ON public.recruiter_deleted_threads;
CREATE POLICY recruiter_deleted_threads_update ON public.recruiter_deleted_threads
  FOR UPDATE TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS recruiter_deleted_threads_delete ON public.recruiter_deleted_threads;
CREATE POLICY recruiter_deleted_threads_delete ON public.recruiter_deleted_threads
  FOR DELETE TO authenticated
  USING (public.is_staff());
