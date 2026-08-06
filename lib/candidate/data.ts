import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth/get-app-user";
import type {
  Application,
  Client,
  Employee,
  Job,
  Message,
  Placement,
  Timesheet,
} from "@/lib/types/database";

export type PlacementWithClient = Placement & {
  clients: Pick<Client, "id" | "name" | "industry"> | null;
};

export type ApplicationWithJob = Application & {
  jobs: Pick<
    Job,
    "id" | "title" | "employer_name" | "location" | "employment_type"
  > | null;
};

export async function requireCandidateContext() {
  const user = await getAppUser();
  if (!user || user.role !== "candidate" || !user.linked_employee_id) {
    return null;
  }
  return user;
}

export async function getCandidateEmployee() {
  const user = await requireCandidateContext();
  if (!user) return { user: null, employee: null as Employee | null };

  const supabase = await createClient();
  const { data } = await supabase
    .from("employees")
    .select("*")
    .eq("id", user.linked_employee_id!)
    .maybeSingle();

  return { user, employee: (data as Employee | null) ?? null };
}

export async function getCandidatePlacements() {
  const user = await requireCandidateContext();
  if (!user) return [] as PlacementWithClient[];

  const supabase = await createClient();
  const { data } = await supabase
    .from("placements")
    .select("*, clients(id, name, industry)")
    .eq("employee_id", user.linked_employee_id!)
    .order("start_date", { ascending: false });

  return (data as PlacementWithClient[] | null) ?? [];
}

/** Same placement/contracts records Accounting uses, scoped to this candidate. */
export type CandidateContractRow = {
  id: string;
  clientId: string | null;
  clientName: string;
  startDate: string;
  endDate: string | null;
  billingType: Placement["placement_type"];
  payRate: number | null;
  guaranteeEndDate: string | null;
  status: Placement["status"];
};

export async function getCandidateContracts(): Promise<CandidateContractRow[]> {
  const user = await requireCandidateContext();
  if (!user?.linked_employee_id) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("placements")
    .select(
      "id, placement_type, pay_rate, guarantee_end_date, start_date, end_date, status, clients(id, name)",
    )
    .eq("employee_id", user.linked_employee_id)
    .order("start_date", { ascending: false });

  return (data ?? []).map((row) => {
    const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
    return {
      id: row.id as string,
      clientId: (client as { id: string } | null)?.id ?? null,
      clientName: (client as { name: string } | null)?.name ?? "Employer",
      startDate: row.start_date as string,
      endDate: (row.end_date as string | null) ?? null,
      billingType: row.placement_type as Placement["placement_type"],
      payRate: row.pay_rate != null ? Number(row.pay_rate) : null,
      guaranteeEndDate: row.guarantee_end_date as string | null,
      status: row.status as Placement["status"],
    };
  });
}

export async function getCandidateContractById(id: string) {
  const user = await requireCandidateContext();
  if (!user?.linked_employee_id) return null;

  const supabase = await createClient();
  const { data: placement } = await supabase
    .from("placements")
    .select(
      "id, placement_type, bill_rate, pay_rate, placement_fee, guarantee_end_date, start_date, end_date, status, employee_id, clients(id, name, industry), employees(id, first_name, last_name, email)",
    )
    .eq("id", id)
    .eq("employee_id", user.linked_employee_id)
    .maybeSingle();

  if (!placement) return null;

  const { data: timesheets } = await supabase
    .from("timesheets")
    .select("id, week_ending_date, hours_regular, hours_overtime, status")
    .eq("placement_id", id)
    .order("week_ending_date", { ascending: false });

  const client = Array.isArray(placement.clients)
    ? placement.clients[0]
    : placement.clients;
  const employee = Array.isArray(placement.employees)
    ? placement.employees[0]
    : placement.employees;

  return {
    id: placement.id as string,
    billingType: placement.placement_type as Placement["placement_type"],
    payRate: placement.pay_rate != null ? Number(placement.pay_rate) : null,
    guaranteeEndDate: placement.guarantee_end_date as string | null,
    startDate: placement.start_date as string,
    endDate: placement.end_date as string | null,
    status: placement.status as Placement["status"],
    client: client as {
      id: string;
      name: string;
      industry: string | null;
    } | null,
    employee: employee as {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    } | null,
    timesheets: (timesheets ?? []).map((t) => ({
      id: t.id as string,
      weekEndingDate: t.week_ending_date as string,
      hoursRegular: Number(t.hours_regular),
      hoursOvertime: Number(t.hours_overtime),
      status: t.status as string,
    })),
  };
}

export async function getOpenJobs() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("status", "open")
    .order("posted_at", { ascending: false });

  return (data as Job[] | null) ?? [];
}

export async function getCandidateApplications() {
  const user = await requireCandidateContext();
  if (!user) return [] as ApplicationWithJob[];

  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select(
      "*, jobs(id, title, employer_name, location, employment_type)",
    )
    .eq("employee_id", user.linked_employee_id!)
    .order("created_at", { ascending: false });

  return (data as ApplicationWithJob[] | null) ?? [];
}

export async function getCandidateJobInterests() {
  const user = await requireCandidateContext();
  if (!user) return [] as string[];

  const supabase = await createClient();
  const { data } = await supabase
    .from("job_interests")
    .select("job_id")
    .eq("employee_id", user.linked_employee_id!);

  return (data ?? []).map((row) => row.job_id as string);
}

export async function getCandidateTimesheets() {
  const user = await requireCandidateContext();
  if (!user) return [] as Timesheet[];

  const supabase = await createClient();
  const { data: placements } = await supabase
    .from("placements")
    .select("id")
    .eq("employee_id", user.linked_employee_id!);

  const ids = (placements ?? []).map((p) => p.id);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("timesheets")
    .select("*")
    .in("placement_id", ids)
    .order("week_ending_date", { ascending: false });

  return (data as Timesheet[] | null) ?? [];
}

export async function getCandidateMessages() {
  const user = await requireCandidateContext();
  if (!user) return [] as Message[];

  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("employee_id", user.linked_employee_id!)
    .order("created_at", { ascending: false });

  return (data as Message[] | null) ?? [];
}

export type CandidateDeletedThread = {
  counterpart_role: "recruiter" | "accounting" | "system";
  deleted_at: string;
};

const DELETED_THREAD_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export function isDeletedThreadVisible(deletedAt: string, now = Date.now()) {
  const t = new Date(deletedAt).getTime();
  if (Number.isNaN(t)) return false;
  return now - t <= DELETED_THREAD_RETENTION_MS;
}

export async function getCandidateDeletedThreads() {
  const user = await requireCandidateContext();
  if (!user) return [] as CandidateDeletedThread[];

  const supabase = await createClient();
  const { data } = await supabase
    .from("candidate_deleted_threads")
    .select("counterpart_role, deleted_at")
    .eq("employee_id", user.linked_employee_id!)
    .order("deleted_at", { ascending: false });

  return ((data as CandidateDeletedThread[] | null) ?? []).filter((row) =>
    isDeletedThreadVisible(row.deleted_at),
  );
}

/** Roles still soft-deleted (including past 30 days) — stay out of inbox. */
export async function getCandidateHiddenThreadRoles() {
  const user = await requireCandidateContext();
  if (!user) return [] as CandidateDeletedThread["counterpart_role"][];

  const supabase = await createClient();
  const { data } = await supabase
    .from("candidate_deleted_threads")
    .select("counterpart_role")
    .eq("employee_id", user.linked_employee_id!);

  return (data ?? []).map(
    (row) => row.counterpart_role as CandidateDeletedThread["counterpart_role"],
  );
}

export { formatCurrency, formatDate } from "@/lib/candidate/format";
