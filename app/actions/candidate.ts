"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCandidateContext } from "@/lib/candidate/data";
import { extractResumeText } from "@/lib/matching/extract-resume-text";
import {
  candidateInputFromProfile,
} from "@/lib/matching/profile-from-employee";
import { jobInputFromPublicJob, requirementsForPublicJobs } from "@/lib/matching";
import { scoreMatch } from "@/lib/matching/score";
import {
  routeToRecruiterNote,
  shouldRouteToRecruiter,
} from "@/lib/matching/threshold";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function applyToJob(formData: FormData): Promise<ActionResult> {
  const user = await requireCandidateContext();
  if (!user) return { ok: false, error: "Candidate session required." };

  const jobId = String(formData.get("jobId") ?? "").trim();
  if (!jobId) return { ok: false, error: "Job is required." };

  const includeProfile = formData.get("includeProfile") === "on";
  const coverLetter = String(formData.get("coverLetter") ?? "").trim();
  let resumeUrl = String(formData.get("resumeUrl") ?? "").trim();
  const resumeFile = formData.get("resumeFile");

  const supabase = await createClient();
  const employeeId = user.linked_employee_id!;

  let extractedResumeText: string | null = null;
  if (resumeFile instanceof File && resumeFile.size > 0) {
    const safeName = resumeFile.name.replace(/[^\w.\-()+ ]+/g, "_");
    const path = `${employeeId}/${Date.now()}-${safeName}`;
    const bytes = new Uint8Array(await resumeFile.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("candidate-resumes")
      .upload(path, bytes, {
        contentType: resumeFile.type || "application/octet-stream",
        upsert: false,
      });
    if (uploadError) {
      return { ok: false, error: `Resume upload failed: ${uploadError.message}` };
    }
    const { data: signed, error: signError } = await supabase.storage
      .from("candidate-resumes")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signError || !signed?.signedUrl) {
      return {
        ok: false,
        error: signError?.message ?? "Could not create resume link.",
      };
    }
    resumeUrl = signed.signedUrl;
    extractedResumeText = await extractResumeText(
      bytes,
      resumeFile.name,
      resumeFile.type || "",
    );
    if (extractedResumeText) {
      await supabase
        .from("employees")
        .update({
          resume_url: resumeUrl,
          resume_text: extractedResumeText,
          updated_at: new Date().toISOString(),
        })
        .eq("id", employeeId);
    }
  }

  if (!includeProfile && !coverLetter && !resumeUrl) {
    return {
      ok: false,
      error:
        "Choose at least one option: send profile, add a cover letter, or attach a resume.",
    };
  }

  let profileSnapshot: Record<string, unknown> | null = null;
  let employeeRow: Record<string, unknown> | null = null;
  {
    const { data: employee } = await supabase
      .from("employees")
      .select(
        "first_name, last_name, email, phone, industry, skills, years_experience, certifications, resume_url, resume_text, emergency_contact_name, emergency_contact_phone, education_background, previous_employments, employment_type, status",
      )
      .eq("id", employeeId)
      .maybeSingle();
    employeeRow = (employee as Record<string, unknown> | null) ?? null;
    if (includeProfile) {
      profileSnapshot = {
        displayName: user.name,
        accountEmail: user.email,
        ...(employee ?? {}),
        ...(extractedResumeText ? { resume_text: extractedResumeText } : {}),
      };
    }
  }

  // Score against job-request required skills so low-match apps can auto-route.
  let matchScore: number | null = null;
  {
    const { data: job } = await supabase
      .from("jobs")
      .select(
        "id, title, description, location, employment_type, pay_rate_min, pay_rate_max",
      )
      .eq("id", jobId)
      .maybeSingle();
    if (job) {
      const reqMap = await requirementsForPublicJobs([jobId]);
      const req = reqMap.get(jobId) ?? { skills: [], certifications: [] };
      const profile = candidateInputFromProfile(
        {
          certifications:
            employeeRow?.certifications == null
              ? null
              : String(employeeRow.certifications),
          skills:
            employeeRow?.skills == null ? null : String(employeeRow.skills),
          years_experience:
            employeeRow?.years_experience == null
              ? null
              : String(employeeRow.years_experience),
          industry:
            employeeRow?.industry == null
              ? null
              : String(employeeRow.industry),
          employment_type:
            employeeRow?.employment_type == null
              ? null
              : String(employeeRow.employment_type),
          education_background:
            employeeRow?.education_background == null
              ? null
              : String(employeeRow.education_background),
          previous_employments: employeeRow?.previous_employments ?? null,
          resume_text:
            extractedResumeText ||
            (employeeRow?.resume_text == null
              ? null
              : String(employeeRow.resume_text)),
        },
        {
          profileText: coverLetter || null,
          titles: [String(job.title ?? "")],
        },
      );
      const match = scoreMatch(
        jobInputFromPublicJob(job, req.skills, req.certifications),
        profile,
      );
      matchScore = match.score;
    }
  }

  const routeNote =
    matchScore != null && shouldRouteToRecruiter(matchScore)
      ? routeToRecruiterNote(matchScore)
      : null;
  const baseNote = coverLetter
    ? null
    : includeProfile
      ? "Sent profile information"
      : resumeUrl
        ? "Attached resume"
        : null;
  const applicationNote = routeNote
    ? [baseNote, routeNote].filter(Boolean).join("\n")
    : baseNote;

  const { error } = await supabase.from("applications").insert({
    job_id: jobId,
    employee_id: employeeId,
    status: "submitted",
    note: applicationNote,
    cover_letter: coverLetter || null,
    resume_url: resumeUrl || null,
    include_profile: includeProfile,
    profile_snapshot: profileSnapshot,
    interview_notes: routeNote,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You already applied to this job." };
    }
    return { ok: false, error: error.message };
  }

  // DB trigger also forwards; call RPC so the employer Candidates list updates even if trigger is missing.
  const { data: appRow } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("employee_id", employeeId)
    .maybeSingle();
  if (appRow?.id) {
    await supabase.rpc("forward_application_to_client", {
      p_application_id: appRow.id,
    });

    // Message inserts as candidate may fail RLS; note + UI flag still route the app.
    if (routeNote) {
      await notifyRecruiterLowMatch({
        supabase,
        jobId,
        employeeId,
        applicationId: String(appRow.id),
        matchScore: matchScore!,
        note: routeNote,
      });
    }
  }

  revalidatePath("/candidate/jobs");
  revalidatePath("/candidate/applications");
  revalidatePath("/candidate/dashboard");
  revalidatePath("/client/candidates");
  revalidatePath("/client/dashboard");
  revalidatePath("/client/job-requests");
  revalidatePath("/client/messages");
  revalidatePath("/recruiter/candidates");
  revalidatePath("/recruiter/messages");
  revalidatePath("/recruiter/job-orders");
  return { ok: true };
}

async function notifyRecruiterLowMatch(args: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  jobId: string;
  employeeId: string;
  applicationId: string;
  matchScore: number;
  note: string;
}) {
  const { supabase, jobId, employeeId, matchScore, note } = args;
  try {
    const { data: job } = await supabase
      .from("jobs")
      .select("id, title, client_id, employer_name")
      .eq("id", jobId)
      .maybeSingle();
    const { data: emp } = await supabase
      .from("employees")
      .select("first_name, last_name")
      .eq("id", employeeId)
      .maybeSingle();

    const name = emp
      ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim() || "Candidate"
      : "Candidate";
    const title = job?.title ? String(job.title) : "Open role";
    const clientId =
      job?.client_id != null ? String(job.client_id) : null;

    // Prefer employer inbox conversation with the recruiter (per-person thread).
    if (clientId) {
      const recruiterName = "Morgan Recruiter";
      const { data: existing } = await supabase
        .from("client_message_threads")
        .select("id")
        .eq("client_id", clientId)
        .eq("recruiter_name", recruiterName)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let threadId = existing?.id as string | undefined;
      if (!threadId) {
        const { data: created } = await supabase
          .from("client_message_threads")
          .insert({
            client_id: clientId,
            subject: `Messages with ${recruiterName}`,
            recruiter_name: recruiterName,
          })
          .select("id")
          .maybeSingle();
        threadId = created?.id as string | undefined;
      }
      if (threadId) {
        await supabase.from("client_messages").insert({
          thread_id: threadId,
          sender_role: "recruiter",
          body: `${note}\n\n${name} applied to ${title} with a ${Math.round(matchScore)}% skill match. Please review and support screening.`,
        });
        await supabase
          .from("client_message_threads")
          .update({
            updated_at: new Date().toISOString(),
            deleted_at: null,
          })
          .eq("id", threadId);
      }
    }
  } catch (err) {
    console.error("notifyRecruiterLowMatch", err);
  }
}

export async function toggleJobInterest(
  jobId: string,
  interested: boolean,
): Promise<ActionResult> {
  const user = await requireCandidateContext();
  if (!user) return { ok: false, error: "Candidate session required." };

  const trimmed = jobId.trim();
  if (!trimmed) return { ok: false, error: "Job is required." };

  const supabase = await createClient();
  const employeeId = user.linked_employee_id!;

  if (interested) {
    const { error } = await supabase.from("job_interests").insert({
      job_id: trimmed,
      employee_id: employeeId,
    });
    if (error && error.code !== "23505") {
      return { ok: false, error: error.message };
    }
  } else {
    const { error } = await supabase
      .from("job_interests")
      .delete()
      .eq("job_id", trimmed)
      .eq("employee_id", employeeId);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/candidate/jobs");
  revalidatePath("/candidate/dashboard");
  return { ok: true };
}

export async function submitTimesheet(formData: {
  placementId: string;
  weekEndingDate: string;
  hoursRegular: number;
  hoursOvertime: number;
}): Promise<ActionResult> {
  const user = await requireCandidateContext();
  if (!user) return { ok: false, error: "Candidate session required." };

  if (!formData.placementId || !formData.weekEndingDate) {
    return { ok: false, error: "Placement and week ending date are required." };
  }
  if (formData.hoursRegular < 0 || formData.hoursOvertime < 0) {
    return { ok: false, error: "Hours cannot be negative." };
  }

  const supabase = await createClient();
  const { data: placement } = await supabase
    .from("placements")
    .select("id, employee_id, status")
    .eq("id", formData.placementId)
    .maybeSingle();

  if (
    !placement ||
    placement.employee_id !== user.linked_employee_id ||
    placement.status !== "active"
  ) {
    return { ok: false, error: "Choose an active placement that belongs to you." };
  }

  const { error } = await supabase.from("timesheets").insert({
    placement_id: formData.placementId,
    week_ending_date: formData.weekEndingDate,
    hours_regular: formData.hoursRegular,
    hours_overtime: formData.hoursOvertime,
    status: "submitted",
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/candidate/timesheets");
  revalidatePath("/candidate/pay");
  revalidatePath("/candidate/dashboard");
  return { ok: true };
}

export async function markMessageRead(messageId: string): Promise<ActionResult> {
  const user = await requireCandidateContext();
  if (!user) return { ok: false, error: "Candidate session required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("id", messageId)
    .eq("employee_id", user.linked_employee_id!);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/candidate/messages");
  revalidatePath("/candidate/dashboard");
  return { ok: true };
}

export async function sendCandidateMessage(formData: {
  subject?: string;
  body: string;
  counterpartRole?: "recruiter" | "accounting";
}): Promise<ActionResult> {
  const user = await requireCandidateContext();
  if (!user) return { ok: false, error: "Candidate session required." };

  const body = formData.body.trim();
  const counterpartRole = formData.counterpartRole ?? "recruiter";
  const subject =
    (formData.subject ?? "").trim() ||
    (counterpartRole === "accounting"
      ? "Chat with accounting"
      : "Chat with recruiter");
  if (!body) {
    return { ok: false, error: "Message is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    employee_id: user.linked_employee_id!,
    sender_name: user.name,
    sender_role: "candidate",
    counterpart_role: counterpartRole,
    subject,
    body,
    is_read: true,
    staff_is_read: false,
  });

  if (error) return { ok: false, error: error.message };

  // Sending restores the thread from Deleted if it was soft-deleted.
  await supabase
    .from("candidate_deleted_threads")
    .delete()
    .eq("employee_id", user.linked_employee_id!)
    .eq("counterpart_role", counterpartRole);

  revalidatePath("/candidate/messages");
  revalidatePath("/candidate/dashboard");
  revalidatePath("/recruiter/messages");
  revalidatePath("/accounting/messages");
  return { ok: true };
}

export async function deleteCandidateThread(
  counterpartRole: "recruiter" | "accounting" | "system",
): Promise<ActionResult> {
  return deleteCandidateThreads([counterpartRole]);
}

export async function deleteCandidateThreads(
  counterpartRoles: Array<"recruiter" | "accounting" | "system">,
): Promise<ActionResult> {
  const user = await requireCandidateContext();
  if (!user) return { ok: false, error: "Candidate session required." };

  const roles = Array.from(
    new Set(
      counterpartRoles.filter((role) =>
        ["recruiter", "accounting", "system"].includes(role),
      ),
    ),
  );
  if (roles.length === 0) {
    return { ok: false, error: "Select at least one conversation." };
  }

  const supabase = await createClient();
  const deletedAt = new Date().toISOString();
  const { error } = await supabase.from("candidate_deleted_threads").upsert(
    roles.map((counterpart_role) => ({
      employee_id: user.linked_employee_id!,
      counterpart_role,
      deleted_at: deletedAt,
    })),
    { onConflict: "employee_id,counterpart_role" },
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/candidate/messages");
  revalidatePath("/candidate/dashboard");
  return { ok: true };
}

export async function restoreCandidateThread(
  counterpartRole: "recruiter" | "accounting" | "system",
): Promise<ActionResult> {
  return restoreCandidateThreads([counterpartRole]);
}

export async function restoreCandidateThreads(
  counterpartRoles: Array<"recruiter" | "accounting" | "system">,
): Promise<ActionResult> {
  const user = await requireCandidateContext();
  if (!user) return { ok: false, error: "Candidate session required." };

  const roles = Array.from(
    new Set(
      counterpartRoles.filter((role) =>
        ["recruiter", "accounting", "system"].includes(role),
      ),
    ),
  );
  if (roles.length === 0) {
    return { ok: false, error: "Select at least one conversation." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("candidate_deleted_threads")
    .delete()
    .eq("employee_id", user.linked_employee_id!)
    .in("counterpart_role", roles);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/candidate/messages");
  revalidatePath("/candidate/dashboard");
  return { ok: true };
}

export async function updateCandidateProfile(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireCandidateContext();
  if (!user) return { ok: false, error: "Candidate session required." };

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim();
  const certifications = String(formData.get("certifications") ?? "").trim();
  const skills = String(formData.get("skills") ?? "").trim();
  const yearsExperience = String(formData.get("yearsExperience") ?? "").trim();
  const educationBackground = String(
    formData.get("educationBackground") ?? "",
  ).trim();
  const otherTags = String(formData.get("otherTags") ?? "").trim();
  const keepExistingResume = formData.get("keepExistingResume") === "on";
  const resumeFile = formData.get("resumeFile");

  if (!firstName || !lastName || !displayName) {
    return { ok: false, error: "Name fields are required." };
  }

  const supabase = await createClient();
  const employeeId = user.linked_employee_id!;

  let resumeUrl: string | null | undefined;
  let resumeText: string | null | undefined;
  if (resumeFile instanceof File && resumeFile.size > 0) {
    const safeName = resumeFile.name.replace(/[^\w.\-()+ ]+/g, "_");
    const path = `${employeeId}/profile-${Date.now()}-${safeName}`;
    const bytes = new Uint8Array(await resumeFile.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("candidate-resumes")
      .upload(path, bytes, {
        contentType: resumeFile.type || "application/octet-stream",
        upsert: false,
      });
    if (uploadError) {
      return { ok: false, error: `Resume upload failed: ${uploadError.message}` };
    }
    const { data: signed, error: signError } = await supabase.storage
      .from("candidate-resumes")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signError || !signed?.signedUrl) {
      return {
        ok: false,
        error: signError?.message ?? "Could not create resume link.",
      };
    }
    resumeUrl = signed.signedUrl;
    resumeText = await extractResumeText(
      bytes,
      resumeFile.name,
      resumeFile.type || "",
    );
  } else if (!keepExistingResume) {
    resumeUrl = null;
    resumeText = null;
  }

  // Fold industry “other” tags into skills so matching still sees them.
  const skillsJoined = [skills, otherTags]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");

  const employeeUpdate: Record<string, unknown> = {
    first_name: firstName,
    last_name: lastName,
    phone: phone || null,
    industry: industry || null,
    skills: skillsJoined || null,
    years_experience: yearsExperience || null,
    certifications: certifications || null,
    education_background: educationBackground || null,
    updated_at: new Date().toISOString(),
  };
  if (resumeUrl !== undefined) {
    employeeUpdate.resume_url = resumeUrl;
  }
  if (resumeText !== undefined) {
    employeeUpdate.resume_text = resumeText;
  }

  const { error: empError } = await supabase
    .from("employees")
    .update(employeeUpdate)
    .eq("id", employeeId);

  if (empError) return { ok: false, error: empError.message };

  const { error: userError } = await supabase
    .from("users")
    .update({
      name: displayName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (userError) return { ok: false, error: userError.message };

  revalidatePath("/candidate/profile");
  revalidatePath("/candidate/dashboard");
  revalidatePath("/candidate/jobs");
  return { ok: true };
}

/**
 * Candidate responds to an offer (accept/decline) or acknowledges a rejection.
 * Offer/decline notifications stay until this is recorded.
 */
export async function respondToApplicationOutcome(input: {
  applicationId: string;
  decision: "accepted" | "declined" | "acknowledged";
}): Promise<ActionResult> {
  const user = await requireCandidateContext();
  if (!user) return { ok: false, error: "Candidate session required." };

  const applicationId = input.applicationId.trim();
  if (!applicationId) return { ok: false, error: "Application is required." };

  const supabase = await createClient();
  const { data: app, error: findError } = await supabase
    .from("applications")
    .select("id, status, candidate_decision")
    .eq("id", applicationId)
    .eq("employee_id", user.linked_employee_id!)
    .maybeSingle();

  if (findError || !app) {
    return { ok: false, error: findError?.message ?? "Application not found." };
  }

  if (app.candidate_decision) {
    return { ok: false, error: "You already responded to this update." };
  }

  if (input.decision === "acknowledged") {
    if (app.status !== "rejected") {
      return { ok: false, error: "Only declined applications can be acknowledged." };
    }
  } else if (app.status !== "offered") {
    return { ok: false, error: "Only open offers can be accepted or declined." };
  }

  const patch: Record<string, unknown> = {
    candidate_decision: input.decision,
    candidate_decision_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (input.decision === "declined") {
    patch.status = "withdrawn";
  }

  const { error } = await supabase
    .from("applications")
    .update(patch)
    .eq("id", applicationId)
    .eq("employee_id", user.linked_employee_id!);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/candidate/applications");
  revalidatePath("/candidate/dashboard");
  revalidatePath("/candidate/messages");
  revalidatePath("/recruiter/candidates");
  revalidatePath("/client/candidates");
  return { ok: true };
}
