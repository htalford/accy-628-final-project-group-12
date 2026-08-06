-- Soft-delete client portal conversations; Deleted folder shows last 30 days.
-- Staff still see full threads (no filter on deleted_at in staff queries).

ALTER TABLE public.client_message_threads
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS client_message_threads_client_deleted_idx
  ON public.client_message_threads(client_id, deleted_at DESC NULLS FIRST);
