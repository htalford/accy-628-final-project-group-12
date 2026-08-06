/**
 * Recruiter data accessors — Supabase jobs/applications plus employer Client
 * Portal tables (job_requests, submittals, client messages) so recruiters see
 * the same hiring activity employers create. Does not call employer-gated loaders.
 */

import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth/get-app-user";
import { filterCandidates, filterJobOrders } from "@/lib/recruiter/filters";
import { mapJobRequest, mapSubmittal } from "@/lib/client-portal/portal-data";
import {
  applicationStatusToPipeline,
  jobRequestStatusToDb,
  jobRequestStatusToUi,
  jobStatusToUi,
  submittalStageToPipeline,
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
  JobRequestStatus,
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

/** Staff-scoped: all employer job requests (same rows Client Portal shows). */
async function fetchEmployerJobRequests() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_requests")
    .select(
      `*, clients(id, name, billing_email)`,
    )
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("fetchEmployerJobRequests", error.message);
    return [];
  }
  return data ?? [];
}

/** Staff-scoped: all employer candidate submittals. */
async function fetchEmployerSubmittals() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submittals")
    .select("*, job_request:job_requests(title, location), clients(name)")
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("fetchEmployerSubmittals", error.message);
    return [];
  }
  return data ?? [];
}

function mapEmployerRequestToJobOrder(
  row: Record<string, unknown>,
): RecruiterJobOrder {
  const mapped = mapJobRequest(row);
  const client = asRecord(row.clients);
  const status = mapped.status as JobRequestStatus;
  const uiStatus = jobRequestStatusToUi(status);
  const open =
    status === "open" || status === "in_progress" ? mapped.positions : 0;

  return {
    id: mapped.id,
    title: mapped.title,
    clientId: mapped.client_id,
    client: str(client?.name, "Employer"),
    employerName: str(client?.name, "Employer"),
    primaryContact: str(client?.billing_email, "Primary contact TBD"),
    company: str(client?.name, "Employer"),
    location: mapped.location || "—",
    status: uiStatus,
    dbStatus: jobRequestStatusToDb(status),
    openPositions: open,
    filledPositions: status === "filled" ? mapped.positions : 0,
    priority: status === "open" ? "High" : "Medium",
    description: mapped.description || mapped.notes || "",
    requiredSkills: mapped.skills,
    requiredCertifications: mapped.certifications ?? [],
    payRate: 0,
    billRate: 0,
    assignedRecruiter: mapped.recruiter_name || "Morgan Recruiter",
    contractSummary: mapped.employment_type,
    assignedCandidateIds: [],
    assignedEmployeeId: null,
    interviewProgress: `${mapped.positions} open seat(s) · Employer request`,
    notes: mapped.notes || "",
    recruiterNotes: mapped.notes
      ? [
          {
            id: `note-${mapped.id}`,
            body: mapped.notes,
            author: mapped.recruiter_name || "Employer / Recruiter",
            createdAt: mapped.updated_at,
          },
        ]
      : [],
    source: "employer_request",
  };
}

function parseInterviewFromNotes(notes: string | null | undefined): {
  interviewAt: string | null;
  interviewType: InterviewType | null;
} {
  if (!notes) return { interviewAt: null, interviewType: null };
  const typeMatch = notes.match(/\((Virtual|Phone|In Person)\)/i);
  const interviewType = (typeMatch?.[1] as InterviewType | undefined) ?? null;

  // Prefer ISO if present
  const iso = notes.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  if (iso) {
    const d = new Date(iso[0]);
    if (!Number.isNaN(d.getTime())) {
      return { interviewAt: d.toISOString(), interviewType };
    }
  }

  // Locale string from scheduleInterview: "Interview 9/10/2026, 10:30:00 AM (Virtual)"
  const legacy = notes.match(
    /Interview\s+(\d{1,2}\/\d{1,2}\/\d{4}),\s*(\d{1,2}:\d{2}:\d{2}\s*[AP]M)/i,
  );
  if (legacy) {
    const d = new Date(`${legacy[1]} ${legacy[2]}`);
    if (!Number.isNaN(d.getTime())) {
      return { interviewAt: d.toISOString(), interviewType };
    }
  }

  return { interviewAt: null, interviewType };
}

function mapEmployerSubmittalToCandidate(
  row: Record<string, unknown>,
): RecruiterCandidate {
  const mapped = mapSubmittal(row);
  const jr = asRecord(row.job_request);
  const client = asRecord(row.clients);
  const stage = mapped.stage;
  const status = submittalStageToPipeline(stage);
  const fromCol = (row.interview_at as string | null) ?? null;
  const typeCol = (row.interview_type as InterviewType | null) ?? null;
  const parsed = parseInterviewFromNotes(mapped.interview_notes);
  const interviewAt = fromCol || parsed.interviewAt;
  const interviewType = typeCol || parsed.interviewType;

  return {
    id: mapped.id,
    applicationId: null,
    employeeId: mapped.employee_id || mapped.id,
    name: mapped.candidate_name,
    email: mapped.candidate_email || "—",
    phone: mapped.candidate_phone || "—",
    positionApplied:
      mapped.position_title || mapped.job_title || str(jr?.title, "Role"),
    jobId: mapped.job_request_id,
    jobTitle: mapped.job_title || str(jr?.title) || null,
    experienceYears: mapped.years_experience ?? 0,
    status: interviewAt && status === "Applied" ? "Interview Scheduled" : status,
    applicationStatus: null,
    skills: mapped.skills.length
      ? mapped.skills
      : [str(client?.name, "General")].filter(Boolean),
    location: str(jr?.location, str(client?.name, "—")),
    recruiter: mapped.recruiter_name || "Morgan Recruiter",
    lastUpdated: mapped.updated_at.slice(0, 10),
    education: "—",
    notes:
      mapped.interview_notes ||
      mapped.resume_summary ||
      `Employer submittal (${stage}).`,
    resumeUrl: null,
    interviewAt,
    interviewType,
    interviewNotes: mapped.interview_notes,
    interviewHistory: interviewAt
      ? [
          {
            id: `iv-sub-${mapped.id}`,
            date: interviewAt.slice(0, 10),
            type: interviewType ?? "Virtual",
            outcome: stage === "interview" ? "Scheduled" : "Recorded",
          },
        ]
      : [],
    source: "employer_submittal",
  };
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
       employees(id, first_name, last_name, email, phone, employment_type, status, resume_url, resume_text, certifications, education_background, previous_employments)`,
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
    const education =
      emp?.education_background != null && String(emp.education_background).trim()
        ? String(emp.education_background)
        : "—";
    const previousEmployments = Array.isArray(emp?.previous_employments)
      ? (emp?.previous_employments as import("@/lib/types/database").PreviousEmployment[])
      : null;
    const certSkills = emp?.certifications
      ? String(emp.certifications)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

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
      skills: certSkills.length
        ? certSkills
        : [str(job?.employer_name, "General")].filter(Boolean),
      location: str(job?.location, "—"),
      recruiter: "Morgan Recruiter",
      lastUpdated: String(app.updated_at ?? app.created_at).slice(0, 10),
      education,
      notes: (app.note as string) || (app.cover_letter as string) || "No notes.",
      resumeUrl,
      resumeText:
        emp?.resume_text != null ? String(emp.resume_text) : null,
      previousEmployments,
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
      source: "application" as const,
    };
  });

  const employerRows = (await fetchEmployerSubmittals()).map((row) =>
    mapEmployerSubmittalToCandidate(row as Record<string, unknown>),
  );

  return filterCandidates([...rows, ...employerRows], filters);
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
      c.source === "application"
        ? c.applicationStatus === "reviewing" ||
          c.applicationStatus === "interview" ||
          c.applicationStatus === "offered"
        : c.status === "Client Review" ||
          c.status === "Interview Scheduled" ||
          c.status === "Offer Sent" ||
          c.status === "Approved",
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
      requiredCertifications: [],
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
      source: "public_job" as const,
    };
  });

  const employerOrders = (await fetchEmployerJobRequests()).map((row) =>
    mapEmployerRequestToJobOrder(row as Record<string, unknown>),
  );

  // Link submittals onto employer job requests for assignedCandidateIds
  const submittals = await fetchEmployerSubmittals();
  const byRequest = new Map<string, string[]>();
  for (const s of submittals) {
    const jrId = String(s.job_request_id);
    const empId = s.employee_id ? String(s.employee_id) : String(s.id);
    const list = byRequest.get(jrId) ?? [];
    list.push(empId);
    byRequest.set(jrId, list);
  }
  for (const order of employerOrders) {
    order.assignedCandidateIds = byRequest.get(order.id) ?? [];
    order.interviewProgress = `${order.assignedCandidateIds.length} submittal(s) · Employer request`;
  }

  return filterJobOrders([...rows, ...employerOrders], filters);
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
  const [{ data: clients }, { data: jobs }, { data: placements }, requests] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, name, industry, billing_email, status, updated_at")
        .order("name"),
      supabase.from("jobs").select("client_id, employer_name, status"),
      supabase.from("placements").select("client_id, status"),
      fetchEmployerJobRequests(),
    ]);

  return (clients ?? []).map((c) => {
    const openBoardJobs = (jobs ?? []).filter(
      (j) =>
        (j.client_id === c.id || j.employer_name === c.name) &&
        j.status === "open",
    ).length;
    const openEmployerRequests = requests.filter((r) => {
      const mapped = mapJobRequest(r as Record<string, unknown>);
      return (
        mapped.client_id === c.id &&
        (mapped.status === "open" || mapped.status === "in_progress")
      );
    }).length;
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
      openJobs: openBoardJobs + openEmployerRequests,
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
    openJobOrders: jobs.filter(
      (j) => j.status === "Open" || j.status === "Interviewing",
    ).length,
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
  const all = await listJobOrders();
  const open = all.filter(
    (j) => j.status === "Open" || j.status === "Interviewing",
  );
  const rest = all.filter(
    (j) => j.status !== "Open" && j.status !== "Interviewing",
  );
  return [...open, ...rest].slice(0, limit);
}

export async function listInterviews(): Promise<RecruiterInterview[]> {
  const [candidates, jobs] = await Promise.all([
    listCandidates(),
    listJobOrders(),
  ]);
  const jobById = new Map(jobs.map((j) => [j.id, j]));

  return candidates
    .filter((c) => {
      if (!c.interviewAt) return false;
      const t = new Date(c.interviewAt).getTime();
      return !Number.isNaN(t);
    })
    .map((c) => {
      const dt = new Date(c.interviewAt!);
      const job = c.jobId ? jobById.get(c.jobId) : undefined;
      const company =
        job?.company ||
        job?.client ||
        job?.employerName ||
        (c.location !== "—" ? c.location : "Employer");
      return {
        id: `int-${c.applicationId ?? c.id}`,
        applicationId: c.applicationId ?? c.id,
        candidate: c.name,
        candidateId: c.employeeId,
        company,
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

  for (const c of candidates.slice(0, 12)) {
    const fromEmployer = c.source === "employer_submittal";
    events.push({
      id: `cand-${c.id}`,
      kind:
        c.status === "Interview Scheduled"
          ? "interview_scheduled"
          : c.status === "Hired" || c.status === "Offer Sent"
            ? "offer_accepted"
            : "stage_moved",
      timestamp: `${c.lastUpdated}T12:00:00`,
      description: fromEmployer
        ? `${c.name} — employer submittal (${c.status}) for ${c.positionApplied}`
        : `${c.name} — ${c.status} for ${c.positionApplied}`,
    });
  }
  for (const j of jobs.slice(0, 8)) {
    events.push({
      id: `job-${j.id}`,
      kind: "job_order_created",
      timestamp: new Date().toISOString(),
      description:
        j.source === "employer_request"
          ? `Employer job request "${j.title}" at ${j.company} is ${j.status}.`
          : `Job order "${j.title}" at ${j.company} is ${j.status}.`,
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

  // Live employer threads from Client Portal (same table employers use).
  const supabase = await createClient();
  const [{ data: threads }, clients] = await Promise.all([
    supabase
      .from("client_message_threads")
      .select("*")
      .order("updated_at", { ascending: false }),
    listClients(),
  ]);
  const clientName = new Map(clients.map((c) => [c.id, c.company]));

  const threadIds = (threads ?? []).map((t) => String(t.id));
  const { data: clientMsgs } =
    threadIds.length === 0
      ? { data: [] as Record<string, unknown>[] }
      : await supabase
          .from("client_messages")
          .select("*")
          .in("thread_id", threadIds)
          .order("created_at", { ascending: true });

  const msgsByThread = new Map<string, typeof clientMsgs>();
  for (const m of clientMsgs ?? []) {
    const tid = String(m.thread_id);
    const list = msgsByThread.get(tid) ?? [];
    list.push(m);
    msgsByThread.set(tid, list);
  }

  const employerThreads: RecruiterMessageThread[] = (threads ?? []).map((t) => {
    const id = String(t.id);
    const msgs = msgsByThread.get(id) ?? [];
    const last = msgs[msgs.length - 1];
    const company =
      clientName.get(String(t.client_id)) ?? "Employer";
    return {
      id,
      participantType: "employer" as const,
      participantName: company,
      participantId: String(t.client_id),
      subject: String(t.subject ?? "Conversation"),
      preview: last ? String(last.body).slice(0, 80) : "No messages yet",
      updatedAt: String(t.updated_at),
      unread: 0,
      messages: msgs.map((m) => ({
        id: String(m.id),
        sender:
          m.sender_role === "staff"
            ? "Accounting"
            : m.sender_role === "recruiter"
              ? String(t.recruiter_name || "Recruiter")
              : company,
        senderRole: String(m.sender_role),
        body: String(m.body),
        createdAt: String(m.created_at),
        mine: m.sender_role === "recruiter",
      })),
    };
  });

  const { data: staffThreads } = await supabase
    .from("staff_message_threads")
    .select(
      "id, subject, accounting_user_id, recruiter_user_id, updated_at, created_at",
    )
    .order("updated_at", { ascending: false });

  const staffIds = (staffThreads ?? []).map((t) => t.id as string);
  const [{ data: staffMsgs }, { data: staffUsers }] = await Promise.all([
    staffIds.length === 0
      ? Promise.resolve({ data: [] as Record<string, unknown>[] })
      : supabase
          .from("staff_messages")
          .select("*")
          .in("thread_id", staffIds)
          .order("created_at", { ascending: true }),
    supabase
      .from("users")
      .select("id, name, role")
      .in("role", ["recruiter", "accounting"]),
  ]);

  const userName = new Map(
    (staffUsers ?? []).map((u) => [u.id as string, u.name as string]),
  );
  const msgsByStaff = new Map<string, Record<string, unknown>[]>();
  for (const m of staffMsgs ?? []) {
    const tid = String(m.thread_id);
    const list = msgsByStaff.get(tid) ?? [];
    list.push(m as Record<string, unknown>);
    msgsByStaff.set(tid, list);
  }

  const accountingThreads: RecruiterMessageThread[] = (staffThreads ?? []).map(
    (t) => {
      const id = String(t.id);
      const msgs = msgsByStaff.get(id) ?? [];
      const last = msgs[msgs.length - 1];
      const accountingId = String(t.accounting_user_id ?? "");
      const accountingName = userName.get(accountingId) ?? "Accounting";
      return {
        id,
        participantType: "accounting" as const,
        participantName: accountingName,
        participantId: accountingId,
        subject: String(t.subject ?? "Staff conversation"),
        preview: last ? String(last.body).slice(0, 80) : "No messages yet",
        updatedAt: String(t.updated_at ?? t.created_at),
        unread: 0,
        messages: msgs.map((m) => ({
          id: String(m.id),
          sender:
            userName.get(String(m.sender_user_id)) ??
            (m.sender_role === "accounting" ? "Accounting" : "Recruiter"),
          senderRole: String(m.sender_role),
          body: String(m.body),
          createdAt: String(m.created_at),
          mine: m.sender_role === "recruiter",
        })),
      };
    },
  );

  return [...byEmployee, ...employerThreads, ...accountingThreads].sort(
    (a, b) => b.updatedAt.localeCompare(a.updatedAt),
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
