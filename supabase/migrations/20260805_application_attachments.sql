-- Application attachment fields + private resume storage
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS cover_letter text,
  ADD COLUMN IF NOT EXISTS resume_url text,
  ADD COLUMN IF NOT EXISTS include_profile boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_snapshot jsonb;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-resumes',
  'candidate-resumes',
  false,
  5242880,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY candidate_resumes_insert_own
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'candidate-resumes'
  AND (storage.foldername(name))[1] = (
    SELECT linked_employee_id::text
    FROM public.users
    WHERE auth_id = auth.uid()
  )
);

CREATE POLICY candidate_resumes_select_own_or_staff
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'candidate-resumes'
  AND (
    public.is_staff()
    OR (storage.foldername(name))[1] = (
      SELECT linked_employee_id::text
      FROM public.users
      WHERE auth_id = auth.uid()
    )
  )
);

CREATE POLICY candidate_resumes_update_own
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'candidate-resumes'
  AND (storage.foldername(name))[1] = (
    SELECT linked_employee_id::text
    FROM public.users
    WHERE auth_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'candidate-resumes'
  AND (storage.foldername(name))[1] = (
    SELECT linked_employee_id::text
    FROM public.users
    WHERE auth_id = auth.uid()
  )
);
