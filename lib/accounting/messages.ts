import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth/get-app-user";

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

function fullName(first: string, last: string) {
  return `${first} ${last}`.trim();
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

  const { data: messages, error } = await supabase
    .from("messages")
    .select(
      "id, employee_id, sender_name, sender_role, subject, body, is_read, created_at, employees(first_name, last_name)",
    )
    .order("created_at", { ascending: false });

  if (error) console.error("accounting messages", error.message);

  const byEmployee = new Map<string, AccountingMessageThread>();
  for (const m of messages ?? []) {
    const emp = asRecord(m.employees);
    const empId = m.employee_id as string;
    const name = emp
      ? fullName(String(emp.first_name ?? ""), String(emp.last_name ?? ""))
      : (m.sender_name as string);
    const msg = {
      id: m.id as string,
      sender: m.sender_name as string,
      senderRole: m.sender_role as string,
      body: m.body as string,
      createdAt: m.created_at as string,
      mine:
        (m.sender_role as string) === "accounting" ||
        (m.sender_role as string) === "staff",
    };
    const existing = byEmployee.get(empId);
    if (!existing) {
      byEmployee.set(empId, {
        id: empId,
        participantType: "candidate",
        participantName: name || "Candidate",
        participantId: empId,
        subject: m.subject as string,
        preview: m.body as string,
        updatedAt: m.created_at as string,
        unread: m.is_read ? 0 : msg.mine ? 0 : 1,
        messages: [msg],
      });
    } else {
      existing.messages.push(msg);
      if (!m.is_read && !msg.mine) existing.unread += 1;
      if ((m.created_at as string) > existing.updatedAt) {
        existing.updatedAt = m.created_at as string;
        existing.preview = m.body as string;
        existing.subject = m.subject as string;
      }
    }
  }
  for (const t of byEmployee.values()) {
    t.messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

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
              ? "Avery Accounting"
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
    const tid = String(m.thread_id);
    const list = msgsByStaff.get(tid) ?? [];
    list.push(m as Record<string, unknown>);
    msgsByStaff.set(tid, list);
  }

  const recruiterThreads: AccountingMessageThread[] = (staffThreads ?? []).map(
    (t) => {
      const id = String(t.id);
      const msgs = msgsByStaff.get(id) ?? [];
      const last = msgs[msgs.length - 1];
      const recruiterId = String(t.recruiter_user_id ?? "");
      const recruiter =
        userName.get(recruiterId) ?? "Morgan Recruiter";
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
            (m.sender_role === "accounting"
              ? "Avery Accounting"
              : "Morgan Recruiter"),
          senderRole: String(m.sender_role),
          body: String(m.body),
          createdAt: String(m.created_at),
          mine: m.sender_role === "accounting",
        })),
      };
    },
  );

  return [
    ...byEmployee.values(),
    ...employerThreads,
    ...recruiterThreads,
  ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
