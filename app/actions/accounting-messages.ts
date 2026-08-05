"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAccounting } from "@/lib/accounting/messages";

function revalidateMessaging() {
  revalidatePath("/accounting/messages");
  revalidatePath("/recruiter/messages");
  revalidatePath("/candidate/messages");
  revalidatePath("/client/messages");
}

export async function sendAccountingCandidateMessage(input: {
  employeeId: string;
  subject: string;
  body: string;
}) {
  const { error: authError, user } = await requireAccounting();
  if (authError || !user) {
    return { ok: false as const, error: authError ?? "Unauthorized" };
  }

  const body = input.body.trim();
  const subject = input.subject.trim() || "Message from Accounting";
  if (!input.employeeId || !body) {
    return { ok: false as const, error: "Employee and message body are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    employee_id: input.employeeId,
    sender_name: user.name,
    sender_role: "accounting",
    subject,
    body,
    is_read: false,
  });

  if (error) return { ok: false as const, error: error.message };
  revalidateMessaging();
  return { ok: true as const, message: "Message sent to candidate." };
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
