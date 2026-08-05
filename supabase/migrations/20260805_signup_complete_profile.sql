-- Signup helper: create linked client/employee + public.users row for the signed-in auth user.
-- Applied remotely as migration signup_complete_profile.

CREATE OR REPLACE FUNCTION public.complete_signup(
  p_name text,
  p_role public.user_role,
  p_company_name text DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_client_id uuid;
  v_employee_id uuid;
  v_user public.users;
  v_first text;
  v_last text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Name is required';
  END IF;

  IF EXISTS (SELECT 1 FROM public.users WHERE auth_id = v_uid) THEN
    SELECT * INTO v_user FROM public.users WHERE auth_id = v_uid;
    RETURN v_user;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Auth user not found';
  END IF;

  IF p_role = 'employer' THEN
    INSERT INTO public.clients (name, billing_email, status)
    VALUES (
      COALESCE(NULLIF(trim(p_company_name), ''), trim(p_name) || ' Company'),
      v_email,
      'active'
    )
    RETURNING id INTO v_client_id;
  ELSIF p_role = 'candidate' THEN
    v_first := split_part(trim(p_name), ' ', 1);
    v_last := nullif(trim(substr(trim(p_name), length(v_first) + 1)), '');
    IF v_last IS NULL OR v_last = '' THEN
      v_last := 'Candidate';
    END IF;
    INSERT INTO public.employees (first_name, last_name, email, status)
    VALUES (v_first, v_last, v_email, 'active')
    RETURNING id INTO v_employee_id;
  END IF;

  INSERT INTO public.users (auth_id, name, email, role, linked_client_id, linked_employee_id)
  VALUES (v_uid, trim(p_name), v_email, p_role, v_client_id, v_employee_id)
  RETURNING * INTO v_user;

  RETURN v_user;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_signup(text, public.user_role, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_signup(text, public.user_role, text) TO authenticated;
