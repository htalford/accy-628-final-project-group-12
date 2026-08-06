import "server-only";

import { createClient } from "@/lib/supabase/server";

export type PublicJobListing = {
  id: string;
  title: string;
  location: string | null;
};

type PublicJobRow = PublicJobListing & {
  search_text?: string | null;
};

export type PublicJobSearchFilters = {
  q?: string;
  location?: string;
  remote?: boolean;
};

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);
}

function matchesQuery(haystack: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (haystack.includes(q)) return true;
  const tokens = tokenize(q);
  if (tokens.length === 0) return haystack.includes(q);
  // Any typed word can surface a listing (e.g. "tax" → Tax Accountant).
  return tokens.some((token) => haystack.includes(token));
}

/** Open jobs for public marketing search — titles only in the UI. */
export async function getPublicOpenJobs(
  filters: PublicJobSearchFilters = {},
): Promise<PublicJobListing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_public_open_jobs");

  if (error) {
    console.error("list_public_open_jobs", error.message);
    return [];
  }

  const rows = ((data as PublicJobRow[] | null) ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    location: row.location ?? null,
    search_text: (row.search_text ?? "").toLowerCase(),
  }));

  const q = filters.q?.trim() ?? "";
  const location = filters.location?.trim().toLowerCase() ?? "";
  const remoteOnly = Boolean(filters.remote);

  const filtered = rows.filter((job) => {
    const haystack = [
      job.search_text,
      job.title.toLowerCase(),
      (job.location ?? "").toLowerCase(),
    ]
      .filter(Boolean)
      .join(" ");

    if (q && !matchesQuery(haystack, q)) return false;
    if (location && !haystack.includes(location) && !(job.location ?? "").toLowerCase().includes(location)) {
      return false;
    }
    if (remoteOnly && !haystack.includes("remote")) return false;
    return true;
  });

  // Prefer unique titles so board + employer request duplicates don't stack.
  const seen = new Set<string>();
  const unique: PublicJobListing[] = [];
  for (const job of filtered) {
    const key = job.title.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ id: job.id, title: job.title, location: job.location });
  }

  return unique;
}
