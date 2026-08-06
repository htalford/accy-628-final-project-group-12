"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  requireAccounting,
  type AccountingParticipantType,
} from "@/lib/accounting/messages";
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

const PARTICIPANT_TYPES = new Set<AccountingParticipantType>([
  "candidate",
  "employer",
  "recruiter",
]);

type ThreadRef = {
  participantType: AccountingParticipantType;
  threadId: string;
};

function normalizeThreadRefs(threads: ThreadRef[]): ThreadRef[] {
  const seen = new Set<string>();
  const out: ThreadRef[] = [];
  for (const t of threads) {
    if (!PARTICIPANT_TYPES.has(t.participantType) || !t.threadId.trim()) {
      continue;
    }
    const key = `${t.participantType}:${t.threadId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      participantType: t.participantType,
      threadId: t.threadId.trim(),
    });
  }
  return out;
}

async function clearAccountingDeleted(
  participantType: AccountingParticipantType,
  threadId: string,
) {
  const supabase = await createClient();
  await supabase
    .from("accounting_deleted_threads")
    .delete()
    .eq("participant_type", participantType)
    .eq("thread_id", threadId);
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
  // Sending restores the thread from Deleted if it was soft-deleted.
  await clearAccountingDeleted("candidate", input.employeeId);
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

  await clearAccountingDeleted("employer", input.threadId);
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

  await clearAccountingDeleted("recruiter", input.threadId);
  revalidateMessaging();
  return { ok: true as const, message: "Message sent to recruiter." };
}

export async function deleteAccountingThread(input: ThreadRef) {
  return deleteAccountingThreads([input]);
}

export async function deleteAccountingThreads(threads: ThreadRef[]) {
  const { error: authError, user } = await requireAccounting();
  if (authError || !user) {
    return { ok: false as const, error: authError ?? "Unauthorized" };
  }

  const refs = normalizeThreadRefs(threads);
  if (refs.length === 0) {
    return { ok: false as const, error: "Select at least one conversation." };
  }

  const supabase = await createClient();
  const deletedAt = new Date().toISOString();
  const { error } = await supabase.from("accounting_deleted_threads").upsert(
    refs.map((t) => ({
      participant_type: t.participantType,
      thread_id: t.threadId,
      deleted_at: deletedAt,
      deleted_by: user.id,
    })),
    { onConflict: "participant_type,thread_id" },
  );

  if (error) return { ok: false as const, error: error.message };

  revalidateMessaging();
  return { ok: true as const };
}

export async function restoreAccountingThread(input: ThreadRef) {
  return restoreAccountingThreads([input]);
}

export async function restoreAccountingThreads(threads: ThreadRef[]) {
  const { error: authError } = await requireAccounting();
  if (authError) return { ok: false as const, error: authError };

  const refs = normalizeThreadRefs(threads);
  if (refs.length === 0) {
    return { ok: false as const, error: "Select at least one conversation." };
  }

  const supabase = await createClient();
  for (const ref of refs) {
    const { error } = await supabase
      .from("accounting_deleted_threads")
      .delete()
      .eq("participant_type", ref.participantType)
      .eq("thread_id", ref.threadId);
    if (error) return { ok: false as const, error: error.message };
  }

  revalidateMessaging();
  return { ok: true as const };
}
