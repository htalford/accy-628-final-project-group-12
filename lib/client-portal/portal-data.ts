import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireEmployerUser } from "@/lib/client-portal/require-employer";
import type {
  ClientMessageThread,
  ClientPortalMessage,
  JobRequestStatus,
  PortalJobRequest,
  PortalSubmittal,
  SubmittalExperience,
  SubmittalStage,
} from "@/lib/types/database";

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

/** Live client↔recruiter threads (does not touch candidate messages). */
export async function listClientMessageThreads(): Promise<
  ClientMessageThread[]
> {
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

  const list = threads ?? [];
  if (list.length === 0) return [];

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
    return {
      id,
      client_id: String(t.client_id),
      subject: String(t.subject ?? ""),
      recruiter_name: String(t.recruiter_name),
      created_at: String(t.created_at),
      updated_at: String(t.updated_at),
      messages,
      preview: last?.body.slice(0, 64) ?? "No messages yet",
      unread: 0,
    };
  });
}
