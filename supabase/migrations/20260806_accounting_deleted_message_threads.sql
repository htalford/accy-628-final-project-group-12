-- Soft-delete for accounting message threads (candidate / employer / recruiter).
-- Hidden from accounting Inbox while deleted; Deleted folder shows last 30 days.
-- Underlying messages remain for other portals.

CREATE TABLE public.accounting_deleted_threads (
  participant_type text NOT NULL,
  thread_id text NOT NULL,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  deleted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  PRIMARY KEY (participant_type, thread_id),
  CONSTRAINT accounting_deleted_threads_type_check
    CHECK (participant_type IN ('candidate', 'employer', 'recruiter'))
);

CREATE INDEX accounting_deleted_threads_deleted_at_idx
  ON public.accounting_deleted_threads(deleted_at DESC);

ALTER TABLE public.accounting_deleted_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY accounting_deleted_threads_select ON public.accounting_deleted_threads
  FOR SELECT TO authenticated
  USING (public.is_staff());

CREATE POLICY accounting_deleted_threads_insert ON public.accounting_deleted_threads
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff());

CREATE POLICY accounting_deleted_threads_update ON public.accounting_deleted_threads
  FOR UPDATE TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY accounting_deleted_threads_delete ON public.accounting_deleted_threads
  FOR DELETE TO authenticated
  USING (public.is_staff());
