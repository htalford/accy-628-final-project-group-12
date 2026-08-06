"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAccounting } from "@/lib/accounting/messages";
import {
  markStaffThreadRead,
  sendStaffMessageToCandidate,
} from "@/lib/staff/messages";

function revalidateMessaging() {
  revalidatePath("/accounting/messages");
  revalidatePath("/recruiter/messages");
  revalidatePath("/candidate/messages");
  revalidatePath("/client/messages");
}

export async function sendAccountingMessage(input: {
  employeeId: string;
  subject?: string;
  body: string;
}) {
  return sendAccountingCandidateMessage({
    employeeId: input.employeeId,
    subject: input.subject ?? "Message from accounting",
    body: input.body,
  });
}

export async function sendAccountingCandidateMessage(input: {
  employeeId: string;
  subject: string;
  body: string;
}) {
  const { error: authError } = await requireAccounting();
  if (authError) return { ok: false as const, error: authError };

  const result = await sendStaffMessageToCandidate({
    lane: "accounting",
    employeeId: input.employeeId,
    subject: input.subject,
    body: input.body,
  });
  if (!result.ok) return result;
  revalidateMessaging();
  return { ok: true as const, message: "Message sent to candidate." };
}

export async function markAccountingCandidateThreadRead(employeeId: string) {
  const { error: authError } = await requireAccounting();
  if (authError) return { ok: false as const, error: authError };

  const result = await markStaffThreadRead("accounting", employeeId);
  if (!result.ok) return result;
  revalidateMessaging();
  return { ok: true as const };
}

export async function sendAccountingEmployerMessage(input: {
  threadId: string;
  body: string;
}) {
  const { error: authError, user } = await requireAccounting();
  if (authError || !user) {
    return { ok: false as const, error: authError ?? "Unauthorized" };
  }

  const body = input.body.trim();
  if (!input.threadId || !body) {
    return { ok: false as const, error: "Thread and message body are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("client_messages").insert({
    thread_id: input.threadId,
    sender_role: "staff",
    body,
  });
  if (error) return { ok: false as const, error: error.message };

  await supabase
    .from("client_message_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.threadId);

  revalidateMessaging();
  return { ok: true as const, message: "Message sent to employer." };
}

export async function sendAccountingRecruiterMessage(input: {
  threadId: string;
  body: string;
}) {
  const { error: authError, user } = await requireAccounting();
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
    sender_role: "accounting",
    body,
  });
  if (error) return { ok: false as const, error: error.message };

  await supabase
    .from("staff_message_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.threadId);

  revalidateMessaging();
  return { ok: true as const, message: "Message sent to recruiter." };
}
