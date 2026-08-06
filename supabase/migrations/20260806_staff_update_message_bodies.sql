-- Allow staff to soft-delete messages by updating body to a placeholder
DROP POLICY IF EXISTS client_messages_update_staff ON public.client_messages;
CREATE POLICY client_messages_update_staff ON public.client_messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_message_threads t
      WHERE t.id = client_messages.thread_id
        AND public.is_staff()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.client_message_threads t
      WHERE t.id = client_messages.thread_id
        AND public.is_staff()
    )
  );

DROP POLICY IF EXISTS staff_messages_update_staff ON public.staff_messages;
CREATE POLICY staff_messages_update_staff ON public.staff_messages
  FOR UPDATE TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());
