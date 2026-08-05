CREATE POLICY clients_select_assigned_candidate ON public.clients
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.placements p
      WHERE p.client_id = clients.id
        AND p.employee_id = public.current_app_employee_id()
    )
  );
