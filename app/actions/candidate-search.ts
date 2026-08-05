"use server";

import { createClient } from "@/lib/supabase/server";
import { requireCandidateContext } from "@/lib/candidate/data";

export type CandidateSearchHit = {
  type: string;
  id: string;
  label: string;
  href: string;
};

/** Top-bar search for candidates: find recruiter or accounting contacts. */
export async function searchCandidatePortal(
  query: string,
): Promise<CandidateSearchHit[]> {
  const user = await requireCandidateContext();
  if (!user) return [];

  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];

  const contacts = [
    {
      type: "Recruiter",
      id: "contact-recruiter",
      label: "Morgan Recruiter",
      href: `/candidate/messages?with=${encodeURIComponent("Morgan Recruiter")}`,
    },
    {
      type: "Accounting",
      id: "contact-accounting",
      label: "Avery Accounting",
      href: `/candidate/messages?with=${encodeURIComponent("Avery Accounting")}`,
    },
  ];

  const hits = contacts.filter(
    (c) =>
      c.label.toLowerCase().includes(q) || c.type.toLowerCase().includes(q),
  );

  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_name, sender_role, counterpart_role, subject")
    .eq("employee_id", user.linked_employee_id!)
    .neq("sender_role", "candidate")
    .order("created_at", { ascending: false })
    .limit(50);

  const seen = new Set(hits.map((h) => h.label.toLowerCase()));
  for (const row of messages ?? []) {
    const name = String(row.sender_name ?? "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    if (
      !key.includes(q) &&
      !String(row.subject ?? "").toLowerCase().includes(q) &&
      !String(row.counterpart_role ?? "").includes(q)
    ) {
      continue;
    }
    seen.add(key);
    const role =
      row.counterpart_role === "accounting" || row.sender_role === "accounting"
        ? "Accounting"
        : row.counterpart_role === "system"
          ? "Support"
          : "Recruiter";
    hits.push({
      type: role,
      id: `msg-contact-${key}`,
      label: name,
      href: `/candidate/messages?with=${encodeURIComponent(name)}`,
    });
  }

  return hits.slice(0, 8);
}
