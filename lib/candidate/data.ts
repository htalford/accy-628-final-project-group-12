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

export { formatCurrency, formatDate } from "@/lib/candidate/format";
