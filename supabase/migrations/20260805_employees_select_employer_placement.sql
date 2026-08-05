-- Employers need to read employee names for people placed at their client.
-- Multiple SELECT policies OR together; keeps candidate self-select + staff.

CREATE POLICY employees_select_employer_placement ON public.employees
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.placements p
      WHERE p.employee_id = employees.id
        AND p.client_id = public.current_app_client_id()
    )
  );
