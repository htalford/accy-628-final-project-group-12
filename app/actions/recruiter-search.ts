"use server";

import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth/get-app-user";
import type { SearchHit } from "@/app/actions/accounting-search";

export async function searchRecruiter(query: string): Promise<SearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const user = await getAppUser();
  if (!user || user.role !== "recruiter") return [];

  const supabase = await createClient();
  const like = `%${q}%`;
  const qLower = q.toLowerCase();
  const hits: SearchHit[] = [];

  const [applications, jobs, placements, clients] = await Promise.all([
    supabase
      .from("applications")
      .select(
        `id, status,
         jobs(title, employer_name),
         employees(first_name, last_name, email)`,
      )
      .order("updated_at", { ascending: false })
      .limit(40),
    supabase
      .from("jobs")
      .select("id, title, employer_name, location, status")
      .or(
        `title.ilike.${like},employer_name.ilike.${like},location.ilike.${like}`,
      )
      .limit(8),
    supabase
      .from("placements")
      .select(
        "id, placement_type, status, clients(name), employees(first_name, last_name)",
      )
      .limit(25),
    supabase.from("clients").select("id, name, industry").ilike("name", like).limit(8),
  ]);

  for (const row of applications.data ?? []) {
    const emp = Array.isArray(row.employees) ? row.employees[0] : row.employees;
    const job = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs;
    const name = emp
      ? `${(emp as { first_name?: string }).first_name ?? ""} ${(emp as { last_name?: string }).last_name ?? ""}`.trim()
      : "Candidate";
    const email = (emp as { email?: string } | null)?.email ?? "";
    const title = (job as { title?: string } | null)?.title ?? "Role";
    const employer =
      (job as { employer_name?: string } | null)?.employer_name ?? "";
    const label = employer
      ? `${name} · ${title} · ${employer}`
      : `${name} · ${title}`;
    const haystack = `${label} ${email} ${row.status}`.toLowerCase();
    if (haystack.includes(qLower)) {
      hits.push({
        type: "Candidate",
        id: row.id,
        label,
        href: `/recruiter/candidates/${row.id}`,
      });
    }
  }

  for (const row of jobs.data ?? []) {
    const parts = [row.title, row.employer_name, row.location, row.status].filter(
      Boolean,
    );
    hits.push({
      type: "Job order",
      id: row.id,
      label: parts.join(" · "),
      href: `/recruiter/job-orders/${row.id}`,
    });
  }

  for (const row of placements.data ?? []) {
    const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
    const emp = Array.isArray(row.employees) ? row.employees[0] : row.employees;
    const clientName =
      (client as { name?: string } | null)?.name ?? "Client";
    const empName = emp
      ? `${(emp as { first_name?: string }).first_name ?? ""} ${(emp as { last_name?: string }).last_name ?? ""}`.trim()
      : "Candidate";
    const label = `${clientName} · ${empName} · ${row.placement_type} · ${row.status}`;
    if (label.toLowerCase().includes(qLower)) {
      hits.push({
        type: "Placement",
        id: row.id,
        label,
        href: "/recruiter/placements",
      });
    }
  }

  for (const row of clients.data ?? []) {
    hits.push({
      type: "Client",
      id: row.id,
      label: row.industry ? `${row.name} · ${row.industry}` : row.name,
      href: `/recruiter/clients/${row.id}`,
    });
  }

  return hits.slice(0, 12);
}
