"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCandidateContext } from "@/lib/candidate/data";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function applyToJob(
  jobId: string,
  note?: string,
): Promise<ActionResult> {
  const user = await requireCandidateContext();
  if (!user) return { ok: false, error: "Candidate session required." };

  const supabase = await createClient();
  const { error } = await supabase.from("applications").insert({
    job_id: jobId,
    employee_id: user.linked_employee_id!,
    status: "submitted",
    note: note?.trim() || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You already applied to this job." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/candidate/jobs");
  revalidatePath("/candidate/applications");
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
  subject: string;
  body: string;
}): Promise<ActionResult> {
  const user = await requireCandidateContext();
  if (!user) return { ok: false, error: "Candidate session required." };

  const subject = formData.subject.trim();
  const body = formData.body.trim();
  if (!subject || !body) {
    return { ok: false, error: "Subject and message are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    employee_id: user.linked_employee_id!,
    sender_name: user.name,
    sender_role: "candidate",
    subject,
    body,
    is_read: true,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/candidate/messages");
  return { ok: true };
}

export async function updateCandidateProfile(formData: {
  firstName: string;
  lastName: string;
  phone: string;
  displayName: string;
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
