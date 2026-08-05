"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCandidateContext } from "@/lib/candidate/data";

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
        "first_name, last_name, email, phone, certifications, resume_url, emergency_contact_name, emergency_contact_phone, employment_type, status",
      )
      .eq("id", employeeId)
      .maybeSingle();

    profileSnapshot = {
      displayName: user.name,
      accountEmail: user.email,
      ...(employee ?? {}),
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

  revalidatePath("/candidate/messages");
  revalidatePath("/candidate/dashboard");
  revalidatePath("/recruiter/messages");
  revalidatePath("/accounting/messages");
  return { ok: true };
}

export async function updateCandidateProfile(formData: {
  firstName: string;
  lastName: string;
  phone: string;
  displayName: string;
  certifications: string;
  resumeUrl: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}): Promise<ActionResult> {
  const user = await requireCandidateContext();
  if (!user) return { ok: false, error: "Candidate session required." };

  const firstName = formData.firstName.trim();
  const lastName = formData.lastName.trim();
  const displayName = formData.displayName.trim();
  if (!firstName || !lastName || !displayName) {
    return { ok: false, error: "Name fields are required." };
  }

  const supabase = await createClient();
  const { error: empError } = await supabase
    .from("employees")
    .update({
      first_name: firstName,
      last_name: lastName,
      phone: formData.phone.trim() || null,
      certifications: formData.certifications?.trim() || null,
      resume_url: formData.resumeUrl?.trim() || null,
      emergency_contact_name: formData.emergencyContactName?.trim() || null,
      emergency_contact_phone: formData.emergencyContactPhone?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.linked_employee_id!);

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
  return { ok: true };
}
