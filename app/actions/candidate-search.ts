"use server";

import { createClient } from "@/lib/supabase/server";
import { requireCandidateContext } from "@/lib/candidate/data";
import type { SearchHit } from "@/app/actions/accounting-search";

export async function searchCandidate(query: string): Promise<SearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const user = await requireCandidateContext();
  if (!user?.linked_employee_id) return [];

  const supabase = await createClient();
  const employeeId = user.linked_employee_id;
  const like = `%${q}%`;
  const qLower = q.toLowerCase();
  const hits: SearchHit[] = [];

  const [applications, jobs, placements, messages] = await Promise.all([
    supabase
      .from("applications")
      .select(
        "id, status, note, cover_letter, jobs(id, title, employer_name, location)",
      )
      .eq("employee_id", employeeId)
      .order("updated_at", { ascending: false })
      .limit(25),
    supabase
      .from("jobs")
      .select("id, title, employer_name, location, status")
      .eq("status", "open")
      .or(
        `title.ilike.${like},employer_name.ilike.${like},location.ilike.${like}`,
      )
      .limit(8),
    supabase
      .from("placements")
      .select("id, placement_type, status, clients(name)")
      .eq("employee_id", employeeId)
      .limit(15),
    supabase
      .from("messages")
      .select("id, subject, body, sender_name")
      .eq("employee_id", employeeId)
      .or(
        `subject.ilike.${like},body.ilike.${like},sender_name.ilike.${like}`,
      )
      .limit(8),
  ]);

  for (const row of applications.data ?? []) {
    const job = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs;
    const title = (job as { title?: string } | null)?.title ?? "Application";
    const employer =
      (job as { employer_name?: string } | null)?.employer_name ?? "";
    const label = employer
      ? `${title} · ${employer} · ${row.status}`
      : `${title} · ${row.status}`;
    const haystack = [
      label,
      row.note ?? "",
      row.cover_letter ?? "",
      (job as { location?: string } | null)?.location ?? "",
    ]
      .join(" ")
      .toLowerCase();
    if (haystack.includes(qLower)) {
      hits.push({
        type: "Application",
        id: row.id,
        label,
        href: "/candidate/applications",
      });
    }
  }

  for (const row of jobs.data ?? []) {
    const parts = [row.title, row.employer_name, row.location].filter(Boolean);
    hits.push({
      type: "Job",
      id: row.id,
      label: parts.join(" · "),
      href: "/candidate/jobs",
    });
  }

  for (const row of placements.data ?? []) {
    const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
    const clientName =
      (client as { name?: string } | null)?.name ?? "Employer";
    const label = `${clientName} · ${row.placement_type} · ${row.status}`;
    if (label.toLowerCase().includes(qLower)) {
      hits.push({
        type: "Contract",
        id: row.id,
        label,
        href: `/candidate/contracts/${row.id}`,
      });
    }
  }

  for (const row of messages.data ?? []) {
    hits.push({
      type: "Message",
      id: row.id,
      label: `${row.subject} · ${row.sender_name}`,
      href: "/candidate/messages",
    });
  }

  return hits.slice(0, 12);
}
