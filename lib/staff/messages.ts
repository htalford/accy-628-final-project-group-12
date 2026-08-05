import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth/get-app-user";
import type { UserRole } from "@/lib/types/database";
import type {
  StaffCandidateThread,
  StaffChatMessage,
  StaffMessageLane,
} from "@/lib/staff/message-types";

export type {
  StaffCandidateThread,
  StaffChatMessage,
  StaffMessageLane,
} from "@/lib/staff/message-types";

function fullName(first?: string | null, last?: string | null) {
  return `${first ?? ""} ${last ?? ""}`.trim() || "Candidate";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function str(value: unknown) {
  return value == null ? "" : String(value);
}

/** Candidate threads for a staff lane (recruiter or accounting only). */
export async function listStaffCandidateThreads(
  lane: StaffMessageLane,
): Promise<StaffCandidateThread[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, employee_id, sender_name, sender_role, subject, body, is_read, staff_is_read, counterpart_role, created_at, employees(first_name, last_name)",
    )
    .or(`counterpart_role.eq.${lane},counterpart_role.is.null`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listStaffCandidateThreads", error.message);
    return [];
  }

  const byEmployee = new Map<string, StaffCandidateThread>();

  for (const m of data ?? []) {
    const role = (m.counterpart_role as string | null) ?? "recruiter";
    // Legacy null counterpart treated as recruiter lane only.
    if (role !== lane) continue;
    // Extra safety: ignore the other staff role's outbound in this lane.
    if (
      m.sender_role === "recruiter" &&
      lane === "accounting"
    ) {
      continue;
    }
    if (m.sender_role === "accounting" && lane === "recruiter") {
      continue;
    }

    const emp = asRecord(m.employees);
    const empId = m.employee_id as string;
    const name = emp
      ? fullName(str(emp.first_name), str(emp.last_name))
      : (m.sender_name as string);
    const existing = byEmployee.get(empId);
    const mine = (m.sender_role as string) === lane;
    const msg: StaffChatMessage = {
      id: m.id as string,
      sender: m.sender_name as string,
      senderRole: m.sender_role as string,
      body: m.body as string,
      createdAt: m.created_at as string,
      mine,
    };
    const staffUnread =
      m.sender_role === "candidate" && m.staff_is_read === false ? 1 : 0;

    if (!existing) {
      byEmployee.set(empId, {
        id: empId,
        employeeId: empId,
        participantName: name,
        subject: (m.subject as string) || `Chat with candidate`,
        preview: m.body as string,
        updatedAt: m.created_at as string,
        unread: staffUnread,
        messages: [msg],
      });
    } else {
      existing.messages.push(msg);
      existing.unread += staffUnread;
      if ((m.created_at as string) > existing.updatedAt) {
        existing.updatedAt = m.created_at as string;
        existing.preview = m.body as string;
        existing.subject = (m.subject as string) || existing.subject;
      }
    }
  }

  for (const t of byEmployee.values()) {
    t.messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  return [...byEmployee.values()].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export async function sendStaffMessageToCandidate(input: {
  lane: StaffMessageLane;
  employeeId: string;
  subject: string;
  body: string;
}) {
  const user = await getAppUser();
  if (!user || user.role !== input.lane) {
    return { ok: false as const, error: "Unauthorized for this message lane." };
  }

  const body = input.body.trim();
  const subject = input.subject.trim() || `Message from ${user.name}`;
  if (!body) return { ok: false as const, error: "Message is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    employee_id: input.employeeId,
    sender_name: user.name,
    sender_role: input.lane,
    counterpart_role: input.lane,
    subject,
    body,
    is_read: false,
    staff_is_read: true,
  });

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function markStaffThreadRead(
  lane: StaffMessageLane,
  employeeId: string,
) {
  const user = await getAppUser();
  if (!user || user.role !== lane) {
    return { ok: false as const, error: "Unauthorized" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("messages")
    .update({ staff_is_read: true })
    .eq("employee_id", employeeId)
    .eq("counterpart_role", lane)
    .eq("sender_role", "candidate")
    .eq("staff_is_read", false);

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export function staffLaneFromRole(role: UserRole): StaffMessageLane | null {
  if (role === "recruiter" || role === "accounting") return role;
  return null;
}
