import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireEmployerUser } from "@/lib/client-portal/require-employer";
import type {
  ApplicationStatus,
  ClientCandidate,
  ClientMessageThread,
  ClientPortalMessage,
  JobRequestStatus,
  PortalJobRequest,
  PortalSubmittal,
  SubmittalExperience,
  SubmittalStage,
} from "@/lib/types/database";
import { isClientDeletedThreadVisible } from "@/lib/client-portal/message-retention";
import type { InterestedCandidateRow } from "@/lib/client-portal/types";
import { scoreMatch } from "@/lib/matching/score";

export type { InterestedCandidateRow } from "@/lib/client-portal/types";

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  return [];
}

function asExperience(v: unknown): SubmittalExperience[] {
  if (!Array.isArray(v)) return [];
  return v.map((item) => {
    const o = item as Record<string, unknown>;
    return {
      company: String(o.company ?? ""),
      title: String(o.title ?? ""),
      years: String(o.years ?? ""),
    };
  });
}

export function mapJobRequest(row: Record<string, unknown>): PortalJobRequest {
  return {
    id: String(row.id),
    client_id: String(row.client_id),
    title: String(row.title),
    department: String(row.department ?? ""),
    positions: Number(row.positions ?? 1),
    status: row.status as JobRequestStatus,
    employment_type: String(row.employment_type ?? "Temporary"),
    location: row.location == null ? null : String(row.location),
    pay_rate_text: row.pay_rate_text == null ? null : String(row.pay_rate_text),
    start_date: row.start_date == null ? null : String(row.start_date),
    skills: asStringArray(row.skills),
    description: row.description == null ? null : String(row.description),
    notes: row.notes == null ? null : String(row.notes),
    recruiter_name:
      row.recruiter_name == null ? null : String(row.recruiter_name),
    source_job_id:
      row.source_job_id == null ? null : String(row.source_job_id),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function mapSubmittal(row: Record<string, unknown>): PortalSubmittal {
  const jr = row.job_request as Record<string, unknown> | null | undefined;
  return {
    id: String(row.id),
    job_request_id: String(row.job_request_id),
    client_id: String(row.client_id),
    employee_id: row.employee_id == null ? null : String(row.employee_id),
    application_id:
      row.application_id == null ? null : String(row.application_id),
    candidate_name: String(row.candidate_name),
    candidate_email:
      row.candidate_email == null ? null : String(row.candidate_email),
    candidate_phone:
      row.candidate_phone == null ? null : String(row.candidate_phone),
    position_title: String(row.position_title ?? ""),
    recruiter_name:
      row.recruiter_name == null ? null : String(row.recruiter_name),
    years_experience:
      row.years_experience == null ? null : Number(row.years_experience),
    stage: row.stage as SubmittalStage,
    resume_status: String(row.resume_status ?? "On File"),
    skills: asStringArray(row.skills),
    certifications: asStringArray(row.certifications),
    experience: asExperience(row.experience_json),
    interview_notes:
      row.interview_notes == null ? null : String(row.interview_notes),
    resume_summary:
      row.resume_summary == null ? null : String(row.resume_summary),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    job_title: jr?.title == null ? null : String(jr.title),
  };
}

/** Live job requests for the logged-in employer client only. */
export async function listJobRequestsForClient(): Promise<PortalJobRequest[]> {
  const user = await requireEmployerUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_requests")
    .select("*")
    .eq("client_id", user.linked_client_id!)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("job_requests list", error.message);
    return [];
  }
  return (data ?? []).map((r) => mapJobRequest(r as Record<string, unknown>));
}

export async function getJobRequestForClient(
  id: string,
): Promise<PortalJobRequest | null> {
  const user = await requireEmployerUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_requests")
    .select("*")
    .eq("id", id)
    .eq("client_id", user.linked_client_id!)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("job_requests get", error.message);
    return null;
  }
  return mapJobRequest(data as Record<string, unknown>);
}

/** Live submittals (candidates) for this employer only. */
export async function listSubmittalsForClient(): Promise<PortalSubmittal[]> {
  const user = await requireEmployerUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submittals")
    .select("*, job_request:job_requests(title)")
    .eq("client_id", user.linked_client_id!)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("submittals list", error.message);
    return [];
  }
  return (data ?? []).map((r) => mapSubmittal(r as Record<string, unknown>));
}

export async function getSubmittalForClient(
  id: string,
): Promise<PortalSubmittal | null> {
  const user = await requireEmployerUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submittals")
    .select("*, job_request:job_requests(title)")
    .eq("id", id)
    .eq("client_id", user.linked_client_id!)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("submittals get", error.message);
    return null;
  }
  return mapSubmittal(data as Record<string, unknown>);
}

function applicationStatusToStage(status: string): SubmittalStage {
  switch (status) {
    case "submitted":
      return "submitted";
    case "reviewing":
      return "under_review";
    case "interview":
      return "interview";
    case "offered":
      return "offer";
    case "rejected":
    case "withdrawn":
      return "rejected";
    default:
      return "submitted";
  }
}

function submittalToCandidate(s: PortalSubmittal): ClientCandidate {
  return {
    id: s.id,
    source: "submittal",
    detail_href: `/client/candidates/${s.id}`,
    candidate_name: s.candidate_name,
    candidate_email: s.candidate_email,
    candidate_phone: s.candidate_phone,
    position_title: s.position_title || s.job_title || "",
    recruiter_name: s.recruiter_name,
    years_experience: s.years_experience,
    stage: s.stage,
    source_label: "Recruiter submittal",
    resume_status: s.resume_status,
    skills: s.skills,
    certifications: s.certifications,
    experience: s.experience,
    interview_notes: s.interview_notes,
    resume_summary: s.resume_summary,
    created_at: s.created_at,
    updated_at: s.updated_at,
    job_title: s.job_title,
  };
}

function mapApplicationToCandidate(
  row: Record<string, unknown>,
): ClientCandidate {
  const job = (row.jobs ?? row.job) as Record<string, unknown> | null | undefined;
  const emp = (row.employees ?? row.employee) as
    | Record<string, unknown>
    | null
    | undefined;
  const first = emp?.first_name != null ? String(emp.first_name) : "";
  const last = emp?.last_name != null ? String(emp.last_name) : "";
  const name =
    `${first} ${last}`.trim() ||
    (emp?.email != null ? String(emp.email) : "Applicant");
  const status = String(row.status ?? "submitted") as ApplicationStatus;
  const snap = row.profile_snapshot as Record<string, unknown> | null;
  const certs =
    emp?.certifications != null
      ? String(emp.certifications)
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : [];
  const summaryParts: string[] = [];
  if (row.cover_letter) summaryParts.push(String(row.cover_letter));
  if (row.note) summaryParts.push(String(row.note));
  if (snap) {
    summaryParts.push(
      `Profile submitted from candidate portal (${Object.keys(snap).length} fields).`,
    );
  }
  // Certifications double as skill signals for automated matching.
  const skillsFromSnap =
    snap && Array.isArray(snap.skills)
      ? (snap.skills as unknown[]).map(String)
      : [];

  const skills = Array.from(new Set([...certs, ...skillsFromSnap]));
  const jobTitle = job?.title != null ? String(job.title) : "Open role";
  const match = scoreMatch(
    {
      title: jobTitle,
      description: job?.description != null ? String(job.description) : null,
      location: job?.location != null ? String(job.location) : null,
      employmentType:
        job?.employment_type != null ? String(job.employment_type) : null,
      requiredSkills: [],
    },
    {
      skills,
      certifications: certs,
      employmentType:
        emp?.employment_type != null ? String(emp.employment_type) : null,
      profileText: summaryParts.join("\n"),
      titles: [jobTitle],
      locations:
        job?.location != null ? [String(job.location)] : [],
    },
  );

  return {
    id: String(row.id),
    source: "application",
    detail_href: `/client/candidates/applications/${row.id}`,
    candidate_name: name,
    candidate_email: emp?.email != null ? String(emp.email) : null,
    candidate_phone: emp?.phone != null ? String(emp.phone) : null,
    position_title: jobTitle,
    recruiter_name: "Jobs board",
    years_experience: null,
    stage: applicationStatusToStage(status),
    application_status: status,
    source_label: "Candidate portal application",
    resume_status: row.resume_url ? "Attached" : "None",
    skills,
    certifications: certs,
    experience: [],
    interview_notes:
      row.interview_notes == null ? null : String(row.interview_notes),
    resume_summary: summaryParts.join("\n\n") || null,
    cover_letter: row.cover_letter == null ? null : String(row.cover_letter),
    resume_url: row.resume_url == null ? null : String(row.resume_url),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    job_title: job?.title != null ? String(job.title) : null,
    match_score: match.score,
    match_band: match.band,
    match_reasons: match.reasons,
    match_skills: match.skillHits,
    job_location: job?.location != null ? String(job.location) : null,
  };
}

/** Applications submitted via the candidate portal for this employer's jobs. */
export async function listApplicationsForClient(): Promise<ClientCandidate[]> {
  const user = await requireEmployerUser();
  void user;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select(
      "*, jobs(id, title, client_id, employer_name, description, location, employment_type), employees(id, first_name, last_name, email, phone, certifications, employment_type)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("applications list for client", error.message);
    return [];
  }

  return (data ?? []).map((r) =>
    mapApplicationToCandidate(r as Record<string, unknown>),
  );
}

export async function getApplicationForClient(
  id: string,
): Promise<ClientCandidate | null> {
  await requireEmployerUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select(
      "*, jobs(id, title, client_id, employer_name), employees(id, first_name, last_name, email, phone, certifications)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("applications get", error.message);
    return null;
  }
  return mapApplicationToCandidate(data as Record<string, unknown>);
}

/**
 * Candidates for the employer: people who applied via the candidate portal
 * (public.applications only — not recruiter submittals or placed employees).
 */
export async function listClientCandidates(): Promise<ClientCandidate[]> {
  return listApplicationsForClient();
}

/** Application IDs the employer has liked for their client. */
export async function listLikedApplicationIdsForClient(): Promise<string[]> {
  const user = await requireEmployerUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employer_candidate_likes")
    .select("application_id")
    .eq("client_id", user.linked_client_id!)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("employer_candidate_likes list", error.message);
    return [];
  }
  return (data ?? []).map((r) => String(r.application_id));
}

/**
 * Candidates who marked 👍 Interested on this company's public jobs
 * (candidate portal job_interests — not formal applications).
 */
export async function listInterestedCandidatesForClient(): Promise<
  InterestedCandidateRow[]
> {
  await requireEmployerUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("job_interests")
    .select(
      "id, job_id, employee_id, created_at, jobs(id, title, location, client_id, employer_name), employees(id, first_name, last_name, email, phone)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("job_interests list for client", error.message);
    return [];
  }

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const jobIds = Array.from(
    new Set(rows.map((r) => String(r.job_id)).filter(Boolean)),
  );
  const employeeIds = Array.from(
    new Set(rows.map((r) => String(r.employee_id)).filter(Boolean)),
  );

  const { data: apps } = await supabase
    .from("applications")
    .select("id, job_id, employee_id")
    .in("job_id", jobIds)
    .in("employee_id", employeeIds);

  const appByKey = new Map<string, string>();
  for (const a of apps ?? []) {
    appByKey.set(`${a.job_id}:${a.employee_id}`, String(a.id));
  }

  return rows.map((row) => {
    const jobRaw = row.jobs as
      | {
          id: string;
          title: string;
          location: string | null;
        }
      | {
          id: string;
          title: string;
          location: string | null;
        }[]
      | null;
    const job = Array.isArray(jobRaw) ? jobRaw[0] : jobRaw;
    const empRaw = row.employees as
      | {
          id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
        }
      | {
          id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
        }[]
      | null;
    const emp = Array.isArray(empRaw) ? empRaw[0] : empRaw;
    const applicationId =
      appByKey.get(`${row.job_id}:${row.employee_id}`) ?? null;
    const name = emp
      ? `${emp.first_name} ${emp.last_name}`.trim()
      : "Candidate";

    return {
      interestId: String(row.id),
      jobId: String(row.job_id),
      jobTitle: job?.title ? String(job.title) : "Open role",
      jobLocation: job?.location != null ? String(job.location) : null,
      employeeId: String(row.employee_id),
      name,
      email: emp?.email != null ? String(emp.email) : null,
      phone: emp?.phone != null ? String(emp.phone) : null,
      interestedAt: String(row.created_at),
      applicationId,
      detailHref: applicationId
        ? `/client/candidates/applications/${applicationId}`
        : null,
    };
  });
}

export async function getClientCandidate(
  id: string,
  source?: "submittal" | "application",
): Promise<ClientCandidate | null> {
  if (source === "application") {
    return getApplicationForClient(id);
  }
  if (source === "submittal") {
    const s = await getSubmittalForClient(id);
    return s ? submittalToCandidate(s) : null;
  }
  const s = await getSubmittalForClient(id);
  if (s) return submittalToCandidate(s);
  return getApplicationForClient(id);
}

type MessageThreadFolder = "inbox" | "deleted";

async function mapClientMessageThreads(
  list: Array<Record<string, unknown>>,
): Promise<ClientMessageThread[]> {
  if (list.length === 0) return [];

  const supabase = await createClient();
  const ids = list.map((t) => String(t.id));
  const { data: msgs } = await supabase
    .from("client_messages")
    .select("*")
    .in("thread_id", ids)
    .order("created_at", { ascending: true });

  const byThread = new Map<string, ClientPortalMessage[]>();
  for (const m of msgs ?? []) {
    const tid = String(m.thread_id);
    const item: ClientPortalMessage = {
      id: String(m.id),
      thread_id: tid,
      sender_role: m.sender_role as ClientPortalMessage["sender_role"],
      body: String(m.body),
      created_at: String(m.created_at),
    };
    const arr = byThread.get(tid) ?? [];
    arr.push(item);
    byThread.set(tid, arr);
  }

  return list.map((t) => {
    const id = String(t.id);
    const messages = byThread.get(id) ?? [];
    const last = messages[messages.length - 1];
    const deletedAt = t.deleted_at != null ? String(t.deleted_at) : null;
    return {
      id,
      client_id: String(t.client_id),
      subject: String(t.subject ?? ""),
      recruiter_name: String(t.recruiter_name),
      created_at: String(t.created_at),
      updated_at: String(t.updated_at),
      deleted_at: deletedAt,
      messages,
      preview: last?.body.slice(0, 64) ?? "No messages yet",
      unread: 0,
    };
  });
}

/**
 * Client↔recruiter threads for the employer inbox or Deleted folder.
 * Soft-deleted threads stay out of inbox; Deleted keeps last 30 days.
 */
export async function listClientMessageThreads(
  folder: MessageThreadFolder = "inbox",
): Promise<ClientMessageThread[]> {
  const user = await requireEmployerUser();
  const supabase = await createClient();
  const { data: threads, error } = await supabase
    .from("client_message_threads")
    .select("*")
    .eq("client_id", user.linked_client_id!)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("client_message_threads", error.message);
    return [];
  }

  const raw = (threads ?? []) as Array<Record<string, unknown>>;
  const filtered =
    folder === "deleted"
      ? raw.filter(
          (t) =>
            t.deleted_at != null &&
            isClientDeletedThreadVisible(String(t.deleted_at)),
        )
      : raw.filter((t) => t.deleted_at == null);

  return mapClientMessageThreads(filtered);
}
