-- Employers can delete their own client message threads (cascades messages).
-- Child rows also need DELETE RLS so ON DELETE CASCADE succeeds under RLS.

CREATE POLICY client_message_threads_delete_employer ON public.client_message_threads
  FOR DELETE TO authenticated
  USING (
    public.current_app_role() = 'employer'
    AND client_id = public.current_app_client_id()
  );

CREATE POLICY client_message_threads_delete_staff ON public.client_message_threads
  FOR DELETE TO authenticated
  USING (public.is_staff());

CREATE POLICY client_messages_delete_employer ON public.client_messages
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_message_threads t
      WHERE t.id = client_messages.thread_id
        AND public.current_app_role() = 'employer'
        AND t.client_id = public.current_app_client_id()
    )
  );

CREATE POLICY client_messages_delete_staff ON public.client_messages
  FOR DELETE TO authenticated
  USING (
    public.is_staff()
    AND EXISTS (
      SELECT 1 FROM public.client_message_threads t
      WHERE t.id = client_messages.thread_id
    )
  );
