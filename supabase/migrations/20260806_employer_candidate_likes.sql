-- Employer can "like" candidates who applied to their company jobs.
CREATE TABLE public.employer_candidate_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employer_candidate_likes_client_app_uidx UNIQUE (client_id, application_id)
);

CREATE INDEX employer_candidate_likes_client_id_idx
  ON public.employer_candidate_likes(client_id, created_at DESC);

ALTER TABLE public.employer_candidate_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY employer_candidate_likes_select ON public.employer_candidate_likes
  FOR SELECT TO authenticated
  USING (
    public.is_staff()
    OR (
      public.current_app_role() = 'employer'
      AND client_id = public.current_app_client_id()
    )
  );

CREATE POLICY employer_candidate_likes_insert ON public.employer_candidate_likes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_app_role() = 'employer'
    AND client_id = public.current_app_client_id()
    AND EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.jobs j ON j.id = a.job_id
      WHERE a.id = employer_candidate_likes.application_id
        AND (
          j.client_id = public.current_app_client_id()
          OR (
            j.client_id IS NULL
            AND EXISTS (
              SELECT 1 FROM public.clients c
              WHERE c.id = public.current_app_client_id()
                AND lower(c.name) = lower(j.employer_name)
            )
          )
        )
    )
  );

CREATE POLICY employer_candidate_likes_delete ON public.employer_candidate_likes
  FOR DELETE TO authenticated
  USING (
    public.current_app_role() = 'employer'
    AND client_id = public.current_app_client_id()
  );
