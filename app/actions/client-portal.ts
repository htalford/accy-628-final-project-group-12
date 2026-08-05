"use server";

import { revalidatePath } from "next/cache";
import { getAppUser } from "@/lib/auth/get-app-user";
import { createClient } from "@/lib/supabase/server";
import type { SubmittalStage, TimesheetStatus } from "@/lib/types/database";

export type ActionResult =
  | { ok: true; message: string; id?: string }
  | { ok: false; message: string };

async function requireEmployerClientId(): Promise<
  | { ok: true; clientId: string; userName: string }
  | { ok: false; message: string }
> {
  const user = await getAppUser();
  if (!user || user.role !== "employer" || !user.linked_client_id) {
    return { ok: false, message: "Not authorized as an employer." };
  }
  return { ok: true, clientId: user.linked_client_id, userName: user.name };
}

export async function updateTimesheetStatusAction(
  timesheetId: string,
  nextStatus: Extract<TimesheetStatus, "approved" | "rejected" | "disputed">,
  reason?: string,
): Promise<ActionResult> {
  const auth = await requireEmployerClientId();
  if (!auth.ok) return auth;

  const supabase = await createClient();

  const { data: timesheet, error: tsError } = await supabase
    .from("timesheets")
    .select("id, status, placement_id")
    .eq("id", timesheetId)
    .maybeSingle();

  if (tsError || !timesheet) {
    return { ok: false, message: tsError?.message ?? "Timesheet not found." };
  }

  const { data: placement, error: plError } = await supabase
    .from("placements")
    .select("client_id")
    .eq("id", timesheet.placement_id)
    .maybeSingle();

  if (plError || !placement) {
    return {
      ok: false,
      message: plError?.message ?? "Placement for timesheet not found.",
    };
  }

  if (placement.client_id !== auth.clientId) {
    return {
      ok: false,
      message: "That timesheet is not linked to your company.",
    };
  }

  if (timesheet.status !== "submitted") {
    if (timesheet.status === nextStatus) {
      return { ok: true, message: `Timesheet is already ${nextStatus}.` };
    }
    return {
      ok: false,
      message: `Only submitted timesheets can be set to ${nextStatus} (current: ${timesheet.status}).`,
    };
  }

  const note = reason?.trim() || null;

  const { error: updateError } = await supabase
    .from("timesheets")
    .update({
      status: nextStatus,
      employer_note: note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", timesheetId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  revalidatePath("/client/timesheets");
  revalidatePath(`/client/timesheets/${timesheetId}`);
  revalidatePath("/client/dashboard");
  revalidatePath("/client/employees");

  return {
    ok: true,
    message: note
      ? `Timesheet ${nextStatus} (note saved).`
      : `Timesheet ${nextStatus}.`,
  };
}

/**
 * Update linked clients row only (name, industry, billing_email).
 * Does not touch users, jobs, or other portals.
 */
export async function updateClientProfileAction(formData: {
  companyName: string;
  industry: string;
  billingEmail: string;
}): Promise<ActionResult> {
  const auth = await requireEmployerClientId();
  if (!auth.ok) return auth;

  const name = formData.companyName.trim();
  if (!name) return { ok: false, message: "Company name is required." };

  const industry = formData.industry.trim() || null;
  const billingEmail = formData.billingEmail.trim() || null;
  if (billingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) {
    return { ok: false, message: "Enter a valid billing email." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({
      name,
      industry,
      billing_email: billingEmail,
      updated_at: new Date().toISOString(),
    })
    .eq("id", auth.clientId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/client/profile");
  revalidatePath("/client/dashboard");
  revalidatePath("/client/invoices");

  return { ok: true, message: "Company profile saved." };
}

/**
 * Insert into job_requests only (not public.jobs).
 * Employer client_id is forced from session — never trusts form for client id.
 */
export async function createJobRequestAction(formData: {
  title: string;
  department: string;
  employmentType: string;
  openings: number;
  location: string;
  payRate: string;
  startDate: string;
  skills: string;
  description: string;
  notes: string;
}): Promise<ActionResult> {
  const auth = await requireEmployerClientId();
  if (!auth.ok) return auth;

  const title = formData.title.trim();
  if (!title) return { ok: false, message: "Position title is required." };

  const positions = Math.max(1, Math.floor(Number(formData.openings) || 1));
  const skills = formData.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_requests")
    .insert({
      client_id: auth.clientId,
      title,
      department: formData.department.trim() || "General",
      positions,
      status: "open",
      employment_type: formData.employmentType.trim() || "Temporary",
      location: formData.location.trim() || null,
      pay_rate_text: formData.payRate.trim() || null,
      start_date: formData.startDate || null,
      skills,
      description: formData.description.trim() || null,
      notes: formData.notes.trim() || null,
      recruiter_name: "Morgan Recruiter",
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/client/job-requests");
  revalidatePath("/client/dashboard");

  return {
    ok: true,
    message: "Job request submitted.",
    id: data?.id ? String(data.id) : undefined,
  };
}

/**
 * Update submittal stage only on public.submittals (not applications).
 */
export async function updateSubmittalStageAction(
  submittalId: string,
  stage: Extract<SubmittalStage, "accepted" | "rejected">,
  note?: string,
): Promise<ActionResult> {
  const auth = await requireEmployerClientId();
  if (!auth.ok) return auth;

  const supabase = await createClient();
  const { data: row, error: findError } = await supabase
    .from("submittals")
    .select("id, stage, interview_notes, candidate_name")
    .eq("id", submittalId)
    .eq("client_id", auth.clientId)
    .maybeSingle();

  if (findError || !row) {
    return { ok: false, message: findError?.message ?? "Submittal not found." };
  }

  const notes = note?.trim()
    ? `${row.interview_notes ?? ""} · Decision note: ${note.trim()}`.replace(
        /^ · /,
        "",
      )
    : row.interview_notes;

  const { error } = await supabase
    .from("submittals")
    .update({
      stage,
      interview_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", submittalId)
    .eq("client_id", auth.clientId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/client/candidates");
  revalidatePath(`/client/candidates/${submittalId}`);
  revalidatePath("/client/dashboard");

  return {
    ok: true,
    message: `${row.candidate_name} marked ${stage.replaceAll("_", " ")}.`,
  };
}

/**
 * Update application status when employer accepts/rejects a jobs-board applicant.
 * Writes public.applications only (not submittals).
 */
export async function updateApplicationStatusAction(
  applicationId: string,
  decision: "accepted" | "rejected",
  note?: string,
): Promise<ActionResult> {
  const auth = await requireEmployerClientId();
  if (!auth.ok) return auth;

  const supabase = await createClient();
  const { data: row, error: findError } = await supabase
    .from("applications")
    .select("id, status, note, interview_notes, jobs(client_id, employer_name)")
    .eq("id", applicationId)
    .maybeSingle();

  if (findError || !row) {
    return {
      ok: false,
      message: findError?.message ?? "Application not found.",
    };
  }

  const nextStatus = decision === "accepted" ? "offered" : "rejected";
  const decisionNote = note?.trim()
    ? `Employer ${decision}: ${note.trim()}`
    : `Employer ${decision}.`;
  const existingNotes = row.interview_notes
    ? String(row.interview_notes)
    : "";
  const interview_notes = existingNotes
    ? `${existingNotes} · ${decisionNote}`
    : decisionNote;

  const { error } = await supabase
    .from("applications")
    .update({
      status: nextStatus,
      interview_notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/client/candidates");
  revalidatePath(`/client/candidates/applications/${applicationId}`);
  revalidatePath("/client/dashboard");
  revalidatePath("/candidate/applications");
  revalidatePath("/candidate/dashboard");

  return {
    ok: true,
    message:
      decision === "accepted"
        ? "Application marked as offer extended."
        : "Application rejected.",
  };
}

/**
 * Insert into client_messages only (not public.messages).
 */
export async function sendClientMessageAction(
  threadId: string,
  body: string,
): Promise<ActionResult> {
  const auth = await requireEmployerClientId();
  if (!auth.ok) return auth;

  const text = body.trim();
  if (!text) return { ok: false, message: "Message cannot be empty." };

  const supabase = await createClient();
  const { data: thread, error: tError } = await supabase
    .from("client_message_threads")
    .select("id")
    .eq("id", threadId)
    .eq("client_id", auth.clientId)
    .maybeSingle();

  if (tError || !thread) {
    return {
      ok: false,
      message: tError?.message ?? "Conversation not found for your company.",
    };
  }

  const { error } = await supabase.from("client_messages").insert({
    thread_id: threadId,
    sender_role: "client",
    body: text,
  });

  if (error) return { ok: false, message: error.message };

  await supabase
    .from("client_message_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", threadId)
    .eq("client_id", auth.clientId);

  revalidatePath("/client/messages");

  return { ok: true, message: "Message sent." };
}

/**
 * Start a new client↔recruiter thread (client_message_threads + first message).
 * Never writes to candidate public.messages.
 */
export async function createClientMessageThreadAction(formData: {
  subject: string;
  body: string;
  recruiterName?: string;
}): Promise<ActionResult> {
  const auth = await requireEmployerClientId();
  if (!auth.ok) return auth;

  const subject = formData.subject.trim();
  const body = formData.body.trim();
  if (!subject) return { ok: false, message: "Subject is required." };
  if (!body) return { ok: false, message: "Message cannot be empty." };

  const recruiter =
    formData.recruiterName?.trim() || "Morgan Recruiter";

  const supabase = await createClient();
  const { data: thread, error: threadError } = await supabase
    .from("client_message_threads")
    .insert({
      client_id: auth.clientId,
      subject,
      recruiter_name: recruiter,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (threadError || !thread) {
    return {
      ok: false,
      message: threadError?.message ?? "Could not create conversation.",
    };
  }

  const { error: msgError } = await supabase.from("client_messages").insert({
    thread_id: thread.id,
    sender_role: "client",
    body,
  });

  if (msgError) {
    return { ok: false, message: msgError.message };
  }

  revalidatePath("/client/messages");

  return {
    ok: true,
    message: "Conversation started.",
    id: String(thread.id),
  };
}

/**
 * Delete a client↔recruiter thread owned by this employer (cascades client_messages).
 */
export async function deleteClientMessageThreadAction(
  threadId: string,
): Promise<ActionResult> {
  const auth = await requireEmployerClientId();
  if (!auth.ok) return auth;

  const supabase = await createClient();
  const { data: thread, error: findError } = await supabase
    .from("client_message_threads")
    .select("id, subject")
    .eq("id", threadId)
    .eq("client_id", auth.clientId)
    .maybeSingle();

  if (findError || !thread) {
    return {
      ok: false,
      message: findError?.message ?? "Conversation not found for your company.",
    };
  }

  const { error } = await supabase
    .from("client_message_threads")
    .delete()
    .eq("id", threadId)
    .eq("client_id", auth.clientId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/client/messages");
  revalidatePath("/client/dashboard");

  return {
    ok: true,
    message: thread.subject
      ? `Deleted “${String(thread.subject)}”.`
      : "Conversation deleted.",
  };
}

