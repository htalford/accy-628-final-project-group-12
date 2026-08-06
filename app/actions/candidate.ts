"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCandidateContext } from "@/lib/candidate/data";
import { extractResumeText } from "@/lib/matching/extract-resume-text";

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
  if (includeProfile) {
    const { data: employee } = await supabase
      .from("employees")
      .select(
        "first_name, last_name, email, phone, certifications, resume_url, resume_text, emergency_contact_name, emergency_contact_phone, education_background, previous_employments, employment_type, status",
      )
      .eq("id", employeeId)
      .maybeSingle();

    profileSnapshot = {
      displayName: user.name,
      accountEmail: user.email,
      ...(employee ?? {}),
      ...(extractedResumeText ? { resume_text: extractedResumeText } : {}),
    };
  }

  const { error } = await supabase.from("applications").insert({
    job_id: jobId,
    employee_id: employeeId,
    status: "submitted",
    note: coverLetter
      ? null
      : includeProfile
        ? "Sent profile information"
        : resumeUrl
          ? "Attached resume"
          : null,
    cover_letter: coverLetter || null,
    resume_url: resumeUrl || null,
    include_profile: includeProfile,
    profile_snapshot: profileSnapshot,
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
  }

  revalidatePath("/candidate/jobs");
  revalidatePath("/candidate/applications");
  revalidatePath("/candidate/dashboard");
  revalidatePath("/client/candidates");
  revalidatePath("/client/dashboard");
  revalidatePath("/client/job-requests");
  return { ok: true };
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
  const certifications = String(formData.get("certifications") ?? "").trim();
  const educationBackground = String(
    formData.get("educationBackground") ?? "",
  ).trim();
  const emergencyContactName = String(
    formData.get("emergencyContactName") ?? "",
  ).trim();
  const emergencyContactPhone = String(
    formData.get("emergencyContactPhone") ?? "",
  ).trim();
  const keepExistingResume = formData.get("keepExistingResume") === "on";
  const resumeFile = formData.get("resumeFile");
  const previousEmploymentsRaw = String(
    formData.get("previousEmployments") ?? "[]",
  );

  if (!firstName || !lastName || !displayName) {
    return { ok: false, error: "Name fields are required." };
  }

  let previousEmployments: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    description: string;
  }> = [];
  try {
    const parsed = JSON.parse(previousEmploymentsRaw) as unknown;
    if (!Array.isArray(parsed)) {
      return { ok: false, error: "Previous employments format is invalid." };
    }
    previousEmployments = parsed
      .slice(0, 3)
      .map((row) => {
        const r = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
        return {
          company: String(r.company ?? "").trim(),
          title: String(r.title ?? "").trim(),
          startDate: String(r.startDate ?? "").trim(),
          endDate: String(r.endDate ?? "").trim(),
          description: String(r.description ?? "").trim(),
        };
      });
    while (previousEmployments.length < 3) {
      previousEmployments.push({
        company: "",
        title: "",
        startDate: "",
        endDate: "",
        description: "",
      });
    }
  } catch {
    return { ok: false, error: "Previous employments format is invalid." };
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

  const employeeUpdate: Record<string, unknown> = {
    first_name: firstName,
    last_name: lastName,
    phone: phone || null,
    certifications: certifications || null,
    education_background: educationBackground || null,
    previous_employments: previousEmployments,
    emergency_contact_name: emergencyContactName || null,
    emergency_contact_phone: emergencyContactPhone || null,
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
