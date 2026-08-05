"use server";

import { createClient } from "@/lib/supabase/server";

export type SearchHit = {
  type: string;
  id: string;
  label: string;
  href: string;
};

export async function searchAccounting(query: string): Promise<SearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const supabase = await createClient();
  const like = `%${q}%`;
  const hits: SearchHit[] = [];

  const [clients, employees, invoices, placements, expenses, operatingExpenses] =
    await Promise.all([
      supabase.from("clients").select("id, name").ilike("name", like).limit(5),
      supabase
        .from("employees")
        .select("id, first_name, last_name")
        .or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like}`)
        .limit(5),
      supabase
        .from("invoices")
        .select("id, amount, status, clients(name)")
        .limit(8),
      supabase
        .from("placements")
        .select("id, placement_type, status, clients(name), employees(first_name, last_name)")
        .limit(8),
      supabase
        .from("expenses")
        .select("id, expense_type, description, amount, expense_date")
        .or(`description.ilike.${like},expense_type::text.ilike.${like}`)
        .limit(5),
      supabase
        .from("operating_expenses")
        .select("id, category, description, amount, expense_date")
        .or(`description.ilike.${like},category::text.ilike.${like}`)
        .limit(5),
    ]);

  for (const row of clients.data ?? []) {
    hits.push({
      type: "Client",
      id: row.id,
      label: row.name,
      href: `/accounting/accounts-receivable?client=${row.id}`,
    });
  }

  for (const row of employees.data ?? []) {
    const name = `${row.first_name} ${row.last_name}`;
    hits.push({
      type: "Employee",
      id: row.id,
      label: name,
      href: `/accounting/timesheets?employee=${encodeURIComponent(name)}`,
    });
  }

  const qLower = q.toLowerCase();
  for (const row of invoices.data ?? []) {
    const clientName = Array.isArray(row.clients)
      ? row.clients[0]?.name
      : (row.clients as { name?: string } | null)?.name;
    const label = `${clientName ?? "Client"} · $${Number(row.amount).toLocaleString()} · ${row.status}`;
    if (
      label.toLowerCase().includes(qLower) ||
      row.id.toLowerCase().includes(qLower) ||
      row.status.toLowerCase().includes(qLower)
    ) {
      hits.push({
        type: "Invoice",
        id: row.id,
        label,
        href: `/accounting/invoices/${row.id}`,
      });
    }
  }

  for (const row of placements.data ?? []) {
    const clientName = Array.isArray(row.clients)
      ? row.clients[0]?.name
      : (row.clients as { name?: string } | null)?.name;
    const emp = Array.isArray(row.employees)
      ? row.employees[0]
      : (row.employees as { first_name?: string; last_name?: string } | null);
    const empName = emp
      ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim()
      : "Candidate";
    const label = `${clientName ?? "Client"} · ${empName} · ${row.placement_type}`;
    if (label.toLowerCase().includes(qLower) || row.status.includes(qLower)) {
      hits.push({
        type: "Contract",
        id: row.id,
        label,
        href: `/accounting/contracts/${row.id}`,
      });
    }
  }

  for (const row of expenses.data ?? []) {
    hits.push({
      type: "Placement expense",
      id: row.id,
      label: `${row.expense_type} · ${row.description} · $${Number(row.amount).toLocaleString()} · ${row.expense_date}`,
      href: "/accounting/expenses",
    });
  }

  for (const row of operatingExpenses.data ?? []) {
    hits.push({
      type: "Operating expense",
      id: row.id,
      label: `${row.category} · ${row.description} · $${Number(row.amount).toLocaleString()} · ${row.expense_date}`,
      href: "/accounting/expenses",
    });
  }

  return hits.slice(0, 12);
}
