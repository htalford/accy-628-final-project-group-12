import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth/get-app-user";
import { listStaffCandidateThreads } from "@/lib/staff/messages";

export type AccountingParticipantType = "candidate" | "employer" | "recruiter";

export type AccountingMessageThread = {
  id: string;
  participantType: AccountingParticipantType;
  participantName: string;
  participantId: string;
  subject: string;
  preview: string;
  updatedAt: string;
  unread: number;
  messages: {
    id: string;
    sender: string;
    senderRole: string;
    body: string;
    createdAt: string;
    mine: boolean;
  }[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    const first = value[0];
    return first && typeof first === "object"
      ? (first as Record<string, unknown>)
      : null;
  }
  return value as Record<string, unknown>;
}

export async function requireAccounting() {
  const user = await getAppUser();
  if (!user || user.role !== "accounting") {
    return { error: "Unauthorized", user: null };
  }
  return { error: null, user };
}

export async function listAccountingMessageThreads(): Promise<
  AccountingMessageThread[]
> {
  const supabase = await createClient();

  const candidateThreads: AccountingMessageThread[] = (
    await listStaffCandidateThreads("accounting")
  ).map((t) => ({
    id: t.employeeId,
    participantType: "candidate" as const,
    participantName: t.participantName,
    participantId: t.employeeId,
    subject: t.subject,
    preview: t.preview,
    updatedAt: t.updatedAt,
    unread: t.unread,
    messages: t.messages,
  }));

  const [{ data: threads }, { data: clients }] = await Promise.all([
    supabase
      .from("client_message_threads")
      .select("*")
      .order("updated_at", { ascending: false }),
    supabase.from("clients").select("id, name"),
  ]);
  const clientName = new Map(
    (clients ?? []).map((c) => [c.id as string, c.name as string]),
  );
  const threadIds = (threads ?? []).map((t) => t.id as string);
  const { data: clientMsgs } =
    threadIds.length === 0
      ? { data: [] as Record<string, unknown>[] }
      : await supabase
          .from("client_messages")
          .select("*")
          .in("thread_id", threadIds)
          .order("created_at", { ascending: true });

  const msgsByThread = new Map<string, Record<string, unknown>[]>();
  for (const m of clientMsgs ?? []) {
    const tid = String(m.thread_id);
    const list = msgsByThread.get(tid) ?? [];
    list.push(m as Record<string, unknown>);
    msgsByThread.set(tid, list);
  }

  const employerThreads: AccountingMessageThread[] = (threads ?? []).map(
    (t) => {
      const id = String(t.id);
      const msgs = msgsByThread.get(id) ?? [];
      const last = msgs[msgs.length - 1];
      const company = clientName.get(String(t.client_id)) ?? "Employer";
      return {
        id,
        participantType: "employer" as const,
        participantName: company,
        participantId: String(t.client_id),
        subject: String(t.subject ?? "Conversation"),
        preview: last ? String(last.body).slice(0, 80) : "No messages yet",
        updatedAt: String(t.updated_at),
        unread: 0,
        messages: msgs.map((m) => ({
          id: String(m.id),
          sender:
            m.sender_role === "staff"
              ? "Accounting"
              : m.sender_role === "recruiter"
                ? String(t.recruiter_name || "Recruiter")
                : company,
          senderRole: String(m.sender_role),
          body: String(m.body),
          createdAt: String(m.created_at),
          mine: m.sender_role === "staff",
        })),
      };
    },
  );

  const { data: staffThreads } = await supabase
    .from("staff_message_threads")
    .select(
      "id, subject, accounting_user_id, recruiter_user_id, updated_at, created_at",
    )
    .order("updated_at", { ascending: false });

  const staffIds = (staffThreads ?? []).map((t) => t.id as string);
  const [{ data: staffMsgs }, { data: staffUsers }] = await Promise.all([
    staffIds.length === 0
      ? Promise.resolve({ data: [] as Record<string, unknown>[] })
      : supabase
          .from("staff_messages")
          .select("*")
          .in("thread_id", staffIds)
          .order("created_at", { ascending: true }),
    supabase
      .from("users")
      .select("id, name, role")
      .in("role", ["recruiter", "accounting"]),
  ]);

  const userName = new Map(
    (staffUsers ?? []).map((u) => [u.id as string, u.name as string]),
  );
  const msgsByStaff = new Map<string, Record<string, unknown>[]>();
  for (const m of staffMsgs ?? []) {
    const row = asRecord(m) ?? (m as Record<string, unknown>);
    const tid = String(row.thread_id);
    const list = msgsByStaff.get(tid) ?? [];
    list.push(row);
    msgsByStaff.set(tid, list);
  }

  const recruiterThreads: AccountingMessageThread[] = (staffThreads ?? []).map(
    (t) => {
      const id = String(t.id);
      const msgs = msgsByStaff.get(id) ?? [];
      const last = msgs[msgs.length - 1];
      const recruiterId = String(t.recruiter_user_id ?? "");
      const recruiter = userName.get(recruiterId) ?? "Recruiter";
      return {
        id,
        participantType: "recruiter" as const,
        participantName: recruiter,
        participantId: recruiterId,
        subject: String(t.subject ?? "Staff conversation"),
        preview: last ? String(last.body).slice(0, 80) : "No messages yet",
        updatedAt: String(t.updated_at ?? t.created_at),
        unread: 0,
        messages: msgs.map((m) => ({
          id: String(m.id),
          sender:
            userName.get(String(m.sender_user_id)) ??
            (m.sender_role === "accounting" ? "Accounting" : "Recruiter"),
          senderRole: String(m.sender_role),
          body: String(m.body),
          createdAt: String(m.created_at),
          mine: m.sender_role === "accounting",
        })),
      };
    },
  );

  return [...candidateThreads, ...employerThreads, ...recruiterThreads].sort(
    (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  );
}

const DELETED_THREAD_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export type AccountingDeletedThread = {
  participantType: AccountingParticipantType;
  threadId: string;
  deletedAt: string;
};

export function isAccountingDeletedThreadVisible(
  deletedAt: string,
  now = Date.now(),
) {
  const t = new Date(deletedAt).getTime();
  if (Number.isNaN(t)) return false;
  return now - t <= DELETED_THREAD_RETENTION_MS;
}

export async function listAccountingDeletedThreadKeys(): Promise<
  AccountingDeletedThread[]
> {
  const { error } = await requireAccounting();
  if (error) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("accounting_deleted_threads")
    .select("participant_type, thread_id, deleted_at")
    .order("deleted_at", { ascending: false });

  return (data ?? []).map((row) => ({
    participantType: row.participant_type as AccountingParticipantType,
    threadId: String(row.thread_id),
    deletedAt: String(row.deleted_at),
  }));
}

export async function listAccountingInboxThreads(): Promise<
  AccountingMessageThread[]
> {
  const [threads, deleted] = await Promise.all([
    listAccountingMessageThreads(),
    listAccountingDeletedThreadKeys(),
  ]);
  const hidden = new Set(
    deleted.map((d) => `${d.participantType}:${d.threadId}`),
  );
  return threads.filter((t) => !hidden.has(`${t.participantType}:${t.id}`));
}

export async function listAccountingDeletedThreads(): Promise<
  (AccountingMessageThread & { deletedAt: string })[]
> {
  const [threads, deleted] = await Promise.all([
    listAccountingMessageThreads(),
    listAccountingDeletedThreadKeys(),
  ]);
  const visibleDeleted = deleted.filter((d) =>
    isAccountingDeletedThreadVisible(d.deletedAt),
  );
  const byKey = new Map(
    visibleDeleted.map((d) => [`${d.participantType}:${d.threadId}`, d]),
  );
  return threads
    .filter((t) => byKey.has(`${t.participantType}:${t.id}`))
    .map((t) => ({
      ...t,
      deletedAt: byKey.get(`${t.participantType}:${t.id}`)!.deletedAt,
      unread: 0,
    }))
    .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
}
