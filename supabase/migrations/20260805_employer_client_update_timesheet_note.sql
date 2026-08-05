-- Employers may update their own client row; timesheet employer notes.
CREATE POLICY clients_update_employer ON public.clients
  FOR UPDATE TO authenticated
  USING (
    public.current_app_role() = 'employer'
    AND id = public.current_app_client_id()
  )
  WITH CHECK (
    public.current_app_role() = 'employer'
    AND id = public.current_app_client_id()
  );

ALTER TABLE public.timesheets
  ADD COLUMN IF NOT EXISTS employer_note text;
