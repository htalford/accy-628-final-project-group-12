"use server";

import { revalidatePath } from "next/cache";
import { getAppUser } from "@/lib/auth/get-app-user";
import {
  markStaffThreadRead,
  sendStaffMessageToCandidate,
} from "@/lib/staff/messages";

async function requireAccounting() {
  const user = await getAppUser();
  if (!user || user.role !== "accounting") {
    return { error: "Only accounting can perform this action." as const, user: null };
  }
  return { error: null, user };
}

function revalidateAccountingMessages() {
  revalidatePath("/accounting/messages");
  revalidatePath("/candidate/messages");
}

export async function sendAccountingMessage(input: {
  employeeId: string;
  subject?: string;
  body: string;
}) {
  const { error: authError } = await requireAccounting();
  if (authError) return { ok: false as const, error: authError };

  const result = await sendStaffMessageToCandidate({
    lane: "accounting",
    employeeId: input.employeeId,
    subject: input.subject ?? "Message from accounting",
    body: input.body,
  });
  if (!result.ok) return result;
  revalidateAccountingMessages();
  return { ok: true as const, message: "Message sent." };
}

export async function markAccountingCandidateThreadRead(employeeId: string) {
  const { error: authError } = await requireAccounting();
  if (authError) return { ok: false as const, error: authError };

  const result = await markStaffThreadRead("accounting", employeeId);
  if (!result.ok) return result;
  revalidateAccountingMessages();
  return { ok: true as const };
}
