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
}

export async function approveApplication(applicationId: string) {
  const { error: authError } = await requireRecruiter();
  if (authError) return { ok: false as const, error: authError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("applications")
    .update({ status: "reviewing" satisfies ApplicationStatus })
    .eq("id", applicationId);

  if (error) return { ok: false as const, error: error.message };
  revalidateRecruiter();
  return { ok: true as const, message: "Application approved." };
}

export async function rejectApplication(applicationId: string) {
  const { error: authError } = await requireRecruiter();
  if (authError) return { ok: false as const, error: authError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("applications")
    .update({ status: "rejected" satisfies ApplicationStatus })
    .eq("id", applicationId);

  if (error) return { ok: false as const, error: error.message };
  revalidateRecruiter();
  return { ok: true as const, message: "Candidate rejected." };
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
) {
  const { error: authError } = await requireRecruiter();
  if (authError) return { ok: false as const, error: authError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", applicationId);

  if (error) return { ok: false as const, error: error.message };
  revalidateRecruiter();
  return { ok: true as const, message: `Status updated to ${status}.` };
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

  if (fetchError || !app) {
    return { ok: false as const, error: fetchError?.message ?? "Application not found" };
  }

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

  const { error } = await supabase
    .from("applications")
    .update(patch)
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
    subject: input.subject,
    body: input.body,
    is_read: false,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidateRecruiter();
  return { ok: true as const, message: "Message sent." };
}

export async function updateJobStatus(jobId: string, status: JobOrderStatus) {
  const { error: authError } = await requireRecruiter();
  if (authError) return { ok: false as const, error: authError };

  const dbStatus: JobStatus = uiJobStatusToDb(status);
  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({ status: dbStatus })
    .eq("id", jobId);

  if (error) return { ok: false as const, error: error.message };
  revalidateRecruiter();
  return { ok: true as const, message: `Job status set to ${status}.` };
}

export async function assignCandidateToJob(jobId: string, employeeId: string) {
  const { error: authError } = await requireRecruiter();
  if (authError) return { ok: false as const, error: authError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("jobs")
    .update({ assigned_employee_id: employeeId })
    .eq("id", jobId);

  if (error) return { ok: false as const, error: error.message };
  revalidateRecruiter();
  return { ok: true as const, message: "Candidate assigned to job order." };
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

  if (fetchError || !job) {
    return { ok: false as const, error: fetchError?.message ?? "Job not found" };
  }

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
