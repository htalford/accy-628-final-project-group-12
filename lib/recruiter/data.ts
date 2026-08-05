/**
 * Recruiter data accessors — Supabase jobs, applications, employees,
 * clients, placements, and messages.
 */

import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth/get-app-user";
import { filterCandidates, filterJobOrders } from "@/lib/recruiter/filters";
import {
  applicationStatusToPipeline,
  jobStatusToUi,
  type ActivityEvent,
  type CandidateFilters,
  type DashboardMetrics,
  type InterviewType,
  type JobNote,
  type JobOrderFilters,
  type PlacementMonthSummary,
  type RecruiterCandidate,
  type RecruiterClient,
  type RecruiterInterview,
  type RecruiterJobOrder,
  type RecruiterMessageThread,
  type RecruiterPlacement,
  type RecruiterProfile,
} from "@/lib/recruiter/types";
import type {
  ApplicationStatus,
  JobStatus,
  PlacementStatus,
  PlacementType,
} from "@/lib/types/database";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    const first = value[0];
    return first && typeof first === "object"
      ? (first as Record<string, unknown>)
      : null;
  }
  return value as Record<string, unknown>;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function fullName(first: string, last: string) {
  return `${first} ${last}`.trim();
}

function parseNotes(raw: unknown): JobNote[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((n) => {
      const row = n as Record<string, unknown>;
      return {
        id: String(row.id ?? crypto.randomUUID()),
        body: String(row.body ?? ""),
        author: String(row.author ?? "Recruiter"),
        createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function mapPlacementStatusUi(status: PlacementStatus, startDate: string) {
  const today = new Date().toISOString().slice(0, 10);
  if (status === "completed") return "Completed" as const;
  if (status === "cancelled") return "Ended" as const;
  if (status === "active" && startDate > today) return "Starting Soon" as const;
  return "Active" as const;
}

export async function listCandidates(
  filters: CandidateFilters = {},
): Promise<RecruiterCandidate[]> {
  const supabase = await createClient();
  const { data: apps, error } = await supabase
    .from("applications")
    .select(
      `id, job_id, employee_id, status, note, cover_letter, resume_url, updated_at, created_at,
       interview_at, interview_type, interview_notes,
       jobs(id, title, employer_name, location),
       employees(id, first_name, last_name, email, phone, employment_type, status, resume_url, certifications)`,
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("listCandidates", error.message);
    return [];
  }

  const rows: RecruiterCandidate[] = (apps ?? []).map((app) => {
    const emp = asRecord(app.employees);
    const job = asRecord(app.jobs);
    const status = app.status as ApplicationStatus;
    const resumeUrl =
      (app.resume_url as string | null) ||
      (str(emp?.resume_url) || null);
    const interviewAt = (app.interview_at as string | null) ?? null;
    const interviewType = (app.interview_type as InterviewType | null) ?? null;

    return {
      id: app.id as string,
      applicationId: app.id as string,
      employeeId: app.employee_id as string,
      name: emp
        ? fullName(str(emp.first_name), str(emp.last_name))
        : "Unknown",
      email: str(emp?.email, "—"),
      phone: str(emp?.phone, "—"),
      positionApplied: str(job?.title, "Application"),
      jobId: (app.job_id as string) ?? null,
      jobTitle: str(job?.title) || null,
      experienceYears: emp?.employment_type === "permanent" ? 5 : 2,
      status: applicationStatusToPipeline(status),
      applicationStatus: status,
      skills: emp?.certifications
        ? String(emp.certifications)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [str(job?.employer_name, "General")].filter(Boolean),
      location: str(job?.location, "—"),
      recruiter: "Morgan Recruiter",
      lastUpdated: String(app.updated_at ?? app.created_at).slice(0, 10),
      education: "—",
      notes: (app.note as string) || (app.cover_letter as string) || "No notes.",
      resumeUrl,
      interviewAt,
      interviewType,
      interviewNotes: (app.interview_notes as string | null) ?? null,
      interviewHistory: interviewAt
        ? [
            {
              id: `iv-${app.id}`,
              date: interviewAt.slice(0, 10),
              type: interviewType ?? "Virtual",
              outcome: status === "interview" ? "Scheduled" : "Recorded",
            },
          ]
        : [],
    };
  });

  return filterCandidates(rows, filters);
}

export async function getCandidate(
  id: string,
): Promise<RecruiterCandidate | undefined> {
  const all = await listCandidates();
  return all.find((c) => c.id === id || c.employeeId === id);
}

export async function listApprovedCandidates(): Promise<RecruiterCandidate[]> {
  const all = await listCandidates();
  return all.filter(
    (c) =>
      c.applicationStatus === "reviewing" ||
      c.applicationStatus === "interview" ||
      c.applicationStatus === "offered",
  );
}

export async function listJobOrders(
  filters: JobOrderFilters = {},
): Promise<RecruiterJobOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select(
      `id, client_id, employer_name, title, description, location, employment_type,
       pay_rate_min, pay_rate_max, status, posted_at, updated_at,
       recruiter_notes, assigned_employee_id,
       clients(id, name, billing_email, industry)`,
    )
    .order("posted_at", { ascending: false });

  if (error) {
    console.error("listJobOrders", error.message);
    return [];
  }

  const { data: apps } = await supabase
    .from("applications")
    .select("job_id, employee_id, status");

  const appsByJob = new Map<string, { employee_id: string; status: string }[]>();
  for (const a of apps ?? []) {
    const jid = a.job_id as string;
    const list = appsByJob.get(jid) ?? [];
    list.push({ employee_id: a.employee_id as string, status: a.status as string });
    appsByJob.set(jid, list);
  }

  const rows: RecruiterJobOrder[] = (data ?? []).map((job) => {
    const client = asRecord(job.clients);
    const dbStatus = job.status as JobStatus;
    const jobApps = appsByJob.get(job.id as string) ?? [];
    const interviewing = jobApps.some((a) => a.status === "interview");
    const uiStatus =
      dbStatus === "open" && interviewing ? ("Interviewing" as const) : jobStatusToUi(dbStatus);

    return {
      id: job.id as string,
      title: job.title as string,
      clientId: (job.client_id as string | null) ?? (str(client?.id) || null),
      client: str(client?.name) || (job.employer_name as string),
      employerName: job.employer_name as string,
      primaryContact: str(client?.billing_email, "Primary contact TBD"),
      company: str(client?.name) || (job.employer_name as string),
      location: (job.location as string) || "—",
      status: uiStatus,
      dbStatus,
      openPositions: dbStatus === "open" ? 1 : 0,
      filledPositions: dbStatus === "filled" ? 1 : 0,
      priority: dbStatus === "open" ? "High" : "Medium",
      description: (job.description as string) || "",
      requiredSkills: [],
      payRate: Number(job.pay_rate_min ?? 0),
      billRate: Number(job.pay_rate_max ?? job.pay_rate_min ?? 0),
      assignedRecruiter: "Morgan Recruiter",
      contractSummary:
        job.employment_type === "permanent"
          ? "Permanent placement"
          : "Temporary / contract",
      assignedCandidateIds: jobApps.map((a) => a.employee_id),
      assignedEmployeeId: (job.assigned_employee_id as string | null) ?? null,
      interviewProgress: `${jobApps.length} application(s)`,
      notes: "",
      recruiterNotes: parseNotes(job.recruiter_notes),
    };
  });

  return filterJobOrders(rows, filters);
}

export async function getJobOrder(
  id: string,
): Promise<RecruiterJobOrder | undefined> {
  const all = await listJobOrders();
  return all.find((j) => j.id === id);
}

export async function getCandidatesByIds(
  ids: string[],
): Promise<RecruiterCandidate[]> {
  if (ids.length === 0) return [];
  const all = await listCandidates();
  return all.filter(
    (c) => ids.includes(c.employeeId) || ids.includes(c.id),
  );
}

export async function listClients(): Promise<RecruiterClient[]> {
  const supabase = await createClient();
  const [{ data: clients }, { data: jobs }, { data: placements }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, name, industry, billing_email, status, updated_at")
        .order("name"),
      supabase.from("jobs").select("client_id, employer_name, status"),
      supabase.from("placements").select("client_id, status"),
    ]);

  return (clients ?? []).map((c) => {
    const openJobs = (jobs ?? []).filter(
      (j) =>
        (j.client_id === c.id || j.employer_name === c.name) &&
        j.status === "open",
    ).length;
    const activePlacements = (placements ?? []).filter(
      (p) =>
        p.client_id === c.id &&
        (p.status === "active" || p.status === "at_risk"),
    ).length;
    return {
      id: c.id as string,
      company: c.name as string,
      primaryContact: (c.billing_email as string) || "—",
      phone: "—",
      email: (c.billing_email as string) || "—",
      openJobs,
      activePlacements,
      lastContact: String(c.updated_at).slice(0, 10),
      industry: (c.industry as string | null) ?? null,
      status: c.status as string,
    };
  });
}

export async function getClient(id: string): Promise<RecruiterClient | undefined> {
  const all = await listClients();
  return all.find((c) => c.id === id);
}

export async function listPlacementsThisMonth(): Promise<RecruiterPlacement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("placements")
    .select(
      `id, placement_type, bill_rate, pay_rate, start_date, end_date, status,
       clients(name), employees(first_name, last_name)`,
    )
    .order("start_date", { ascending: false });

  if (error) {
    console.error("listPlacements", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const client = asRecord(row.clients);
    const emp = asRecord(row.employees);
    const status = row.status as PlacementStatus;
    return {
      id: row.id as string,
      candidate: emp
        ? fullName(str(emp.first_name), str(emp.last_name))
        : "Unknown",
      client: str(client?.name, "Unknown"),
      job: `${(row.placement_type as string) === "permanent" ? "Permanent" : "Temp"} placement`,
      placementType:
        (row.placement_type as PlacementType) === "permanent"
          ? "Permanent"
          : "Temp",
      startDate: row.start_date as string,
      endDate: (row.end_date as string | null) ?? null,
      status: mapPlacementStatusUi(status, row.start_date as string),
      recruiter: "Morgan Recruiter",
      payrollStatus:
        status === "active" || status === "at_risk" ? "Current" : "Closed",
      timesheetStatus:
        row.placement_type === "temp" ? "Tracked" : "N/A",
      clientContact: str(client?.name, "—"),
      notes: `Seeded placement (${status}).`,
    };
  });
}

export async function getPlacementMonthSummary(): Promise<PlacementMonthSummary> {
  const placements = await listPlacementsThisMonth();
  const active = placements.filter(
    (p) => p.status === "Active" || p.status === "Starting Soon",
  );
  return {
    totalPlacements: placements.length,
    averageTimeToFillDays: 18,
    offerAcceptanceRate:
      placements.length === 0 ? 0 : active.length / placements.length,
  };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [jobs, candidates, interviews, placements] = await Promise.all([
    listJobOrders(),
    listCandidates(),
    listInterviews(),
    listPlacementsThisMonth(),
  ]);
  return {
    openJobOrders: jobs.filter((j) => j.dbStatus === "open").length,
    candidatesInPipeline: candidates.filter(
      (c) => c.status !== "Rejected" && c.status !== "Hired",
    ).length,
    upcomingInterviews: interviews.filter((i) => i.status === "Scheduled")
      .length,
    recentPlacements: placements.filter(
      (p) => p.status === "Active" || p.status === "Starting Soon",
    ).length,
  };
}

export async function listRecentJobOrders(limit = 5) {
  return (await listJobOrders()).slice(0, limit);
}

export async function listInterviews(): Promise<RecruiterInterview[]> {
  const candidates = await listCandidates();
  return candidates
    .filter((c) => c.interviewAt)
    .map((c) => {
      const dt = new Date(c.interviewAt!);
      return {
        id: `int-${c.applicationId ?? c.id}`,
        applicationId: c.applicationId ?? c.id,
        candidate: c.name,
        candidateId: c.employeeId,
        company: c.location !== "—" ? c.location : "Employer",
        position: c.positionApplied,
        jobOrderId: c.jobId ?? "",
        date: dt.toISOString().slice(0, 10),
        time: dt.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        }),
        datetime: c.interviewAt!,
        type: c.interviewType ?? "Virtual",
        recruiter: c.recruiter,
        status: "Scheduled" as const,
        notes: c.interviewNotes,
      };
    })
    .sort((a, b) => a.datetime.localeCompare(b.datetime));
}

export async function listUpcomingInterviews(limit = 5) {
  const now = Date.now();
  return (await listInterviews())
    .filter((i) => new Date(i.datetime).getTime() >= now - 3600_000)
    .slice(0, limit);
}

export async function listRecentActivity(limit = 8): Promise<ActivityEvent[]> {
  const [candidates, jobs] = await Promise.all([
    listCandidates(),
    listJobOrders(),
  ]);
  const events: ActivityEvent[] = [];

  for (const c of candidates.slice(0, 10)) {
    events.push({
      id: `cand-${c.id}`,
      kind:
        c.status === "Interview Scheduled"
          ? "interview_scheduled"
          : c.status === "Approved"
            ? "offer_accepted"
            : "stage_moved",
      timestamp: `${c.lastUpdated}T12:00:00`,
      description: `${c.name} — ${c.status} for ${c.positionApplied}`,
    });
  }
  for (const j of jobs.slice(0, 5)) {
    events.push({
      id: `job-${j.id}`,
      kind: "job_order_created",
      timestamp: new Date().toISOString(),
      description: `Job order "${j.title}" at ${j.company} is ${j.status}.`,
    });
  }

  return events
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}

export async function listMessageThreads(): Promise<RecruiterMessageThread[]> {
  const { listStaffCandidateThreads } = await import("@/lib/staff/messages");
  const candidateThreads = await listStaffCandidateThreads("recruiter");

  const byEmployee: RecruiterMessageThread[] = candidateThreads.map((t) => ({
    id: t.employeeId,
    participantType: "candidate" as const,
    participantName: t.participantName,
    participantId: t.employeeId,
    subject: t.subject,
    preview: t.preview,
    updatedAt: t.updatedAt,
    unread: t.unread,
    messages: t.messages,
  }));

  // Structured employer placeholder threads (client portal uses client_messages).
  const clients = await listClients();
  const employerThreads: RecruiterMessageThread[] = clients.slice(0, 3).map((c) => ({
    id: `emp-${c.id}`,
    participantType: "employer" as const,
    participantName: c.company,
    participantId: c.id,
    subject: `Account check-in · ${c.company}`,
    preview: "Placeholder employer conversation — ready for DB integration.",
    updatedAt: c.lastContact,
    unread: 0,
    messages: [
      {
        id: `seed-${c.id}`,
        sender: "Morgan Recruiter",
        senderRole: "recruiter",
        body: `Hi ${c.primaryContact}, following up on open roles at ${c.company}.`,
        createdAt: `${c.lastContact}T10:00:00`,
        mine: true,
      },
      {
        id: `seed2-${c.id}`,
        sender: c.primaryContact,
        senderRole: "employer",
        body: "Thanks — please send any approved candidates this week.",
        createdAt: `${c.lastContact}T11:00:00`,
        mine: false,
      },
    ],
  }));

  return [...byEmployee, ...employerThreads].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export async function getRecruiterProfile(): Promise<RecruiterProfile> {
  const user = await getAppUser();
  const [metrics, placements, candidates, jobs] = await Promise.all([
    getDashboardMetrics(),
    listPlacementsThisMonth(),
    listCandidates(),
    listJobOrders(),
  ]);
  const interviews = await listInterviews();
  const hired = candidates.filter(
    (c) => c.applicationStatus === "offered" || c.status === "Hired",
  ).length;
  const interviewToHire =
    interviews.length === 0 ? 0 : hired / Math.max(interviews.length, 1);

  return {
    id: user?.id ?? "recruiter",
    name: user?.name ?? "Morgan Recruiter",
    email: user?.email ?? "recruiter@talentquest.demo",
    phone: "(601) 555-0140",
    office: "Jackson, MS",
    department: "Talent Acquisition",
    jobTitle: "Senior Recruiter",
    recruiterId: `TQ-R-${(user?.id ?? "0000").slice(0, 8).toUpperCase()}`,
    biography:
      "Staffing recruiter focused on accounting, finance, and healthcare placements across the Mid-South.",
    hireDate: "2024-03-01",
    photoUrl: null,
    metrics: {
      placementsThisYear: placements.length,
      openJobOrders: metrics.openJobOrders,
      activeCandidates: candidates.filter((c) => c.status !== "Rejected").length,
      averageTimeToFill: 18,
      interviewToHireRate: interviewToHire,
    },
  };
}

export async function candidateFilterOptions() {
  const rows = await listCandidates();
  return {
    statuses: [...new Set(rows.map((c) => c.status))],
    locations: [...new Set(rows.map((c) => c.location))],
    recruiters: [...new Set(rows.map((c) => c.recruiter))],
    skills: [...new Set(rows.flatMap((c) => c.skills))].sort(),
  };
}

export async function jobOrderFilterOptions() {
  const rows = await listJobOrders();
  return {
    clients: [...new Set(rows.map((j) => j.client))],
    statuses: [...new Set(rows.map((j) => j.status))],
    locations: [...new Set(rows.map((j) => j.location))],
    priorities: [...new Set(rows.map((j) => j.priority))],
  };
}
