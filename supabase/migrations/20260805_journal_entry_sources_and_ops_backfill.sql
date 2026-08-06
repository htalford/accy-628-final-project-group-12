-- Source linkage + backfill journal entries from operational data.
-- Applied remotely via Supabase MCP; kept for local parity.

DO $$ BEGIN
  CREATE TYPE public.journal_entry_source_type AS ENUM (
    'invoice', 'payment', 'timesheet', 'expense', 'operating_expense', 'manual', 'opening'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS source_type public.journal_entry_source_type NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_id uuid NULL;

CREATE UNIQUE INDEX IF NOT EXISTS journal_entries_source_unique
  ON public.journal_entries (source_type, source_id)
  WHERE source_id IS NOT NULL AND status <> 'void';
