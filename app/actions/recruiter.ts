"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth/get-app-user";
import type { ApplicationStatus, JobStatus } from "@/lib/types/database";
import { uiJobStatusToDb, type JobOrderStatus } from "@/lib/recruiter/types";

async function requireRecruiter() {
  const user = await getAppUser();
  if (!user || user.role !== "recruiter") {
    return { error: "Only recruiters can perform this action." as const, user: null };
  }
  return { error: null, user };
}

function revalidateRecruiter() {
  revalidatePath("/recruiter", "layout");
  revalidatePath("/accounting/messages");
  revalidatePath("/candidate/messages");
}

export async function approveApplication(applicationId: string) {
  const { error: authError } = await requireRecruiter();
  if (authError) return { ok: false as const, error: authError };

  const supabase = await createClient();
  const { data: app, error: appErr } = await supabase
    .from("applications")
    .update({ status: "reviewing" satisfies ApplicationStatus })
    .eq("id", applicationId)
    .select("id")
    .maybeSingle();

  if (!appErr && app) {
    revalidateRecruiter();
    return { ok: true as const, message: "Application approved." };
  }

  // Employer portal submittal (same id space as recruiter candidate rows)
  const { error } = await supabase
    .from("submittals")
    .update({ stage: "under_review" })
    .eq("id", applicationId);

  if (error) return { ok: false as const, error: error.message || appErr?.message || "Not found" };
  revalidateRecruiter();
  return { ok: true as const, message: "Employer submittal marked under review." };
}

export async function rejectApplication(applicationId: string) {
  const { error: authError } = await requireRecruiter();
  if (authError) return { ok: false as const, error: authError };

  const supabase = await createClient();
  const { data: app } = await supabase
    .from("applications")
    .update({ status: "rejected" satisfies ApplicationStatus })
    .eq("id", applicationId)
    .select("id")
    .maybeSingle();

  if (app) {
    revalidateRecruiter();
    return { ok: true as const, message: "Candidate rejected." };
  }

  const { error } = await supabase
    .from("submittals")
    .update({ stage: "rejected" })
    .eq("id", applicationId);

  if (error) return { ok: false as const, error: error.message };
  revalidateRecruiter();
  return { ok: true as const, message: "Employer submittal rejected." };
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
) {
  const { error: authError, user } = await requireRecruiter();
  if (authError || !user) {
    return { ok: false as const, error: authError ?? "Unauthorized" };
  }

  const supabase = await createClient();
  const { data: app } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId)
    .select("id")
    .maybeSingle();

  if (app) {
    if (status === "offered") {
      const { createContractIfHighMatch } = await import(
        "@/lib/recruiter/create-contract-on-accept"
      );
      const contract = await createContractIfHighMatch({
        supabase,
        user,
        applicationId,
      });

      revalidateRecruiter();
      revalidatePath("/client/contracts");
      revalidatePath("/candidate/contracts");
      revalidatePath("/accounting/contracts");
      revalidatePath("/client/messages");
      revalidatePath("/candidate/messages");
      revalidatePath("/accounting/messages");

      if (contract.created) {
        return {
          ok: true as const,
          message: contract.alreadyExisted
            ? `Offer sent. Existing contract reused (${Math.round(contract.matchScore)}% match).`
            : `Offer sent and contract created (${Math.round(contract.matchScore)}% match). Employer, candidate, and accounting were notified.`,
          contractCreated: true as const,
          placementId: contract.placementId,
          matchScore: contract.matchScore,
        };
      }

      return {
        ok: true as const,
        message: `Status updated to offered. ${contract.reason}`,
        contractCreated: false as const,
        matchScore: contract.matchScore,
      };
    }

    revalidateRecruiter();
    return { ok: true as const, message: `Status updated to ${status}.` };
  }

  const stageMap: Record<ApplicationStatus, string> = {
    submitted: "submitted",
    reviewing: "under_review",
    interview: "interview",
    offered: "offer",
    rejected: "rejected",
    withdrawn: "rejected",
  };

  const { error } = await supabase
    .from("submittals")
    .update({ stage: stageMap[status] ?? "submitted" })
    .eq("id", applicationId);

  if (error) return { ok: false as const, error: error.message };
  revalidateRecruiter();
  return { ok: true as const, message: `Employer submittal updated to ${status}.` };
}

export async function scheduleInterview(input: {
  applicationId: string;
  datetime: string;
  interviewType: string;
  notes?: string;
}) {
  const { error: authError, user } = await requireRecruiter();
  if (authError || !user) return { ok: false as const, error: authError ?? "Unauthorized" };

  const supabase = await createClient();
  const { data: app, error: fetchError } = await supabase
    .from("applications")
    .select("id, employee_id, jobs(title)")
    .eq("id", input.applicationId)
    .maybeSingle();

  if (app) {
    const { error } = await supabase
      .from("applications")
      .update({
        status: "interview" satisfies ApplicationStatus,
        interview_at: input.datetime,
        interview_type: input.interviewType,
        interview_notes: input.notes ?? null,
      })
      .eq("id", input.applicationId);

    if (error) return { ok: false as const, error: error.message };

    const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs;
    await supabase.from("messages").insert({
      employee_id: app.employee_id,
      sender_name: user.name,
      sender_role: "recruiter",
      subject: `Interview scheduled${job?.title ? ` · ${job.title}` : ""}`,
      body: `Your interview is scheduled for ${new Date(input.datetime).toLocaleString()} (${input.interviewType}).${input.notes ? `\n\nNotes: ${input.notes}` : ""}`,
      is_read: false,
    });

    revalidateRecruiter();
    return { ok: true as const, message: "Interview scheduled." };
  }

  const note = `Interview ${new Date(input.datetime).toLocaleString()} (${input.interviewType})${input.notes ? ` — ${input.notes}` : ""}`;
  const { error } = await supabase
    .from("submittals")
    .update({
      stage: "interview",
      interview_at: input.datetime,
      interview_type: input.interviewType,
      interview_notes: note,
    })
    .eq("id", input.applicationId);

  if (error) {
    return {
      ok: false as const,
      error: error.message || fetchError?.message || "Not found",
    };
  }
  revalidateRecruiter();
  return { ok: true as const, message: "Interview scheduled on employer submittal." };
}

export async function rescheduleInterview(input: {
  applicationId: string;
  datetime: string;
  interviewType?: string;
  notes?: string;
}) {
  const { error: authError } = await requireRecruiter();
  if (authError) return { ok: false as const, error: authError };

  const supabase = await createClient();
  const patch: Record<string, unknown> = {
    status: "interview" satisfies ApplicationStatus,
    interview_at: input.datetime,
  };
  if (input.interviewType) patch.interview_type = input.interviewType;
  if (input.notes !== undefined) patch.interview_notes = input.notes;

  const { data: app } = await supabase
    .from("applications")
    .update(patch)
    .eq("id", input.applicationId)
    .select("id")
    .maybeSingle();

  if (app) {
    revalidateRecruiter();
    return { ok: true as const, message: "Interview rescheduled." };
  }

  const subPatch: Record<string, unknown> = {
    stage: "interview",
    interview_at: input.datetime,
  };
  if (input.interviewType) subPatch.interview_type = input.interviewType;
  if (input.notes !== undefined) {
    subPatch.interview_notes = `Interview ${new Date(input.datetime).toLocaleString()}${input.interviewType ? ` (${input.interviewType})` : ""}${input.notes ? ` — ${input.notes}` : ""}`;
  } else {
    subPatch.interview_notes = `Interview ${new Date(input.datetime).toLocaleString()}${input.interviewType ? ` (${input.interviewType})` : ""}`;
  }

  const { error } = await supabase
    .from("submittals")
    .update(subPatch)
    .eq("id", input.applicationId);

  if (error) return { ok: false as const, error: error.message };
  revalidateRecruiter();
  return { ok: true as const, message: "Interview rescheduled." };
}

export async function sendRecruiterMessage(input: {
  employeeId: string;
  subject: string;
  body: string;
}) {
  const { error: authError, user } = await requireRecruiter();
  if (authError || !user) return { ok: false as const, error: authError ?? "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    employee_id: input.employeeId,
    sender_name: user.name,
    sender_role: "recruiter",
    counterpart_role: "recruiter",
    subject: input.subject,
    body: input.body,
    is_read: false,
    staff_is_read: true,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidateRecruiter();
  return { ok: true as const, message: "Message sent." };
}

export async function markRecruiterCandidateThreadRead(employeeId: string) {
  const { error: authError } = await requireRecruiter();
  if (authError) return { ok: false as const, error: authError };

  const { markStaffThreadRead } = await import("@/lib/staff/messages");
  const result = await markStaffThreadRead("recruiter", employeeId);
  if (!result.ok) return result;
  revalidateRecruiter();
  return { ok: true as const };
}

export async function updateJobStatus(jobId: string, status: JobOrderStatus) {
  const { error: authError } = await requireRecruiter();
  if (authError) return { ok: false as const, error: authError };

  const dbStatus: JobStatus = uiJobStatusToDb(status);
  const supabase = await createClient();
  const { data: job } = await supabase
    .from("jobs")
    .update({ status: dbStatus })
    .eq("id", jobId)
    .select("id")
    .maybeSingle();

  if (job) {
    revalidateRecruiter();
    return { ok: true as const, message: `Job status set to ${status}.` };
  }

  const requestStatus =
    status === "Interviewing"
      ? "in_progress"
      : status === "Filled"
        ? "filled"
        : status === "Closed"
          ? "closed"
          : "open";

  const { error } = await supabase
    .from("job_requests")
    .update({ status: requestStatus })
    .eq("id", jobId);

  if (error) return { ok: false as const, error: error.message };
  revalidateRecruiter();
  return { ok: true as const, message: `Employer job request set to ${status}.` };
}

export async function assignCandidateToJob(jobId: string, employeeId: string) {
  const { error: authError, user } = await requireRecruiter();
  if (authError || !user) return { ok: false as const, error: authError ?? "Unauthorized" };

  const supabase = await createClient();
  const { data: job } = await supabase
    .from("jobs")
    .update({ assigned_employee_id: employeeId })
    .eq("id", jobId)
    .select("id")
    .maybeSingle();

  if (job) {
    revalidateRecruiter();
    return { ok: true as const, message: "Candidate assigned to job order." };
  }

  // Employer job request: ensure a submittal exists for this employee/candidate id
  const { data: request } = await supabase
    .from("job_requests")
    .select("id, client_id, title")
    .eq("id", jobId)
    .maybeSingle();

  if (!request) return { ok: false as const, error: "Job not found" };

  const { data: existing } = await supabase
    .from("submittals")
    .select("id")
    .eq("job_request_id", jobId)
    .or(`employee_id.eq.${employeeId},id.eq.${employeeId}`)
    .maybeSingle();

  if (existing) {
    revalidateRecruiter();
    return { ok: true as const, message: "Candidate already submitted on this request." };
  }

  const { data: emp } = await supabase
    .from("employees")
    .select("id, first_name, last_name, email, phone")
    .eq("id", employeeId)
    .maybeSingle();

  const { error } = await supabase.from("submittals").insert({
    job_request_id: jobId,
    client_id: request.client_id,
    employee_id: emp?.id ?? null,
    candidate_name: emp
      ? `${emp.first_name} ${emp.last_name}`.trim()
      : "Assigned candidate",
    candidate_email: emp?.email ?? null,
    candidate_phone: emp?.phone ?? null,
    position_title: request.title,
    recruiter_name: user.name,
    stage: "submitted",
    resume_status: "On File",
    skills: [],
    certifications: [],
    experience_json: [],
  });

  if (error) return { ok: false as const, error: error.message };
  revalidateRecruiter();
  return { ok: true as const, message: "Candidate submitted to employer job request." };
}

export async function addJobNote(jobId: string, body: string) {
  const { error: authError, user } = await requireRecruiter();
  if (authError || !user) return { ok: false as const, error: authError ?? "Unauthorized" };

  const supabase = await createClient();
  const { data: job, error: fetchError } = await supabase
    .from("jobs")
    .select("recruiter_notes")
    .eq("id", jobId)
    .maybeSingle();

  if (job) {
    const existing = Array.isArray(job.recruiter_notes) ? job.recruiter_notes : [];
    const next = [
      {
        id: crypto.randomUUID(),
        body,
        author: user.name,
        created_at: new Date().toISOString(),
      },
      ...existing,
    ];

    const { error } = await supabase
      .from("jobs")
      .update({ recruiter_notes: next })
      .eq("id", jobId);

    if (error) return { ok: false as const, error: error.message };
    revalidateRecruiter();
    return { ok: true as const, message: "Note added." };
  }

  const { data: request } = await supabase
    .from("job_requests")
    .select("notes")
    .eq("id", jobId)
    .maybeSingle();

  if (!request) {
    return { ok: false as const, error: fetchError?.message ?? "Job not found" };
  }

  const stamp = new Date().toISOString();
  const prior = request.notes ? `${request.notes}\n\n` : "";
  const { error } = await supabase
    .from("job_requests")
    .update({
      notes: `${prior}[${stamp}] ${user.name}: ${body}`,
    })
    .eq("id", jobId);

  if (error) return { ok: false as const, error: error.message };
  revalidateRecruiter();
  return { ok: true as const, message: "Note added to employer job request." };
}

export async function sendEmployerMessage(input: {
  threadId: string;
  body: string;
}) {
  const { error: authError, user } = await requireRecruiter();
  if (authError || !user) return { ok: false as const, error: authError ?? "Unauthorized" };

  const supabase = await createClient();
  const { error } = await supabase.from("client_messages").insert({
    thread_id: input.threadId,
    sender_role: "recruiter",
    body: input.body,
  });

  if (error) return { ok: false as const, error: error.message };

  await supabase
    .from("client_message_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.threadId);

  revalidateRecruiter();
  return { ok: true as const, message: "Message sent to employer." };
}

export async function sendAccountingStaffMessage(input: {
  threadId: string;
  body: string;
}) {
  const { error: authError, user } = await requireRecruiter();
  if (authError || !user) {
    return { ok: false as const, error: authError ?? "Unauthorized" };
  }

  const body = input.body.trim();
  if (!input.threadId || !body) {
    return { ok: false as const, error: "Thread and message body are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("staff_messages").insert({
    thread_id: input.threadId,
    sender_user_id: user.id,
    sender_role: "recruiter",
    body,
  });
  if (error) return { ok: false as const, error: error.message };

  await supabase
    .from("staff_message_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.threadId);

  revalidateRecruiter();
  return { ok: true as const, message: "Message sent to accounting." };
}

const DELETED_MESSAGE_BODY = "Message Deleted";

export async function deleteRecruiterMessage(input: {
  messageId: string;
  participantType: "candidate" | "employer" | "accounting";
}) {
  const { error: authError } = await requireRecruiter();
  if (authError) return { ok: false as const, error: authError };

  if (!input.messageId) {
    return { ok: false as const, error: "Message id is required." };
  }

  const supabase = await createClient();
  const table =
    input.participantType === "candidate"
      ? "messages"
      : input.participantType === "employer"
        ? "client_messages"
        : "staff_messages";

  const { error } = await supabase
    .from(table)
    .update({ body: DELETED_MESSAGE_BODY })
    .eq("id", input.messageId);

  if (error) return { ok: false as const, error: error.message };
  revalidateRecruiter();
  return { ok: true as const, message: "Message deleted." };
}
