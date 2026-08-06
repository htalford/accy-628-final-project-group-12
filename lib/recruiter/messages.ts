import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth/get-app-user";
import { listMessageThreads } from "@/lib/recruiter/data";
import type { RecruiterMessageThread } from "@/lib/recruiter/types";

export type RecruiterParticipantType =
  RecruiterMessageThread["participantType"];

const DELETED_THREAD_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export type RecruiterDeletedThread = {
  participantType: RecruiterParticipantType;
  threadId: string;
  deletedAt: string;
};

async function requireRecruiter() {
  const user = await getAppUser();
  if (!user || user.role !== "recruiter") {
    return { error: "Only recruiters can view these messages." as const, user: null };
  }
  return { error: null, user };
}

export function isRecruiterDeletedThreadVisible(
  deletedAt: string,
  now = Date.now(),
) {
  const t = new Date(deletedAt).getTime();
  if (Number.isNaN(t)) return false;
  return now - t <= DELETED_THREAD_RETENTION_MS;
}

export async function listRecruiterDeletedThreadKeys(): Promise<
  RecruiterDeletedThread[]
> {
  const { error } = await requireRecruiter();
  if (error) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("recruiter_deleted_threads")
    .select("participant_type, thread_id, deleted_at")
    .order("deleted_at", { ascending: false });

  return (data ?? []).map((row) => ({
    participantType: row.participant_type as RecruiterParticipantType,
    threadId: String(row.thread_id),
    deletedAt: String(row.deleted_at),
  }));
}

export async function listRecruiterInboxThreads(): Promise<
  RecruiterMessageThread[]
> {
  const [threads, deleted] = await Promise.all([
    listMessageThreads(),
    listRecruiterDeletedThreadKeys(),
  ]);
  const hidden = new Set(
    deleted.map((d) => `${d.participantType}:${d.threadId}`),
  );
  return threads.filter((t) => !hidden.has(`${t.participantType}:${t.id}`));
}

export async function listRecruiterDeletedThreads(): Promise<
  (RecruiterMessageThread & { deletedAt: string })[]
> {
  const [threads, deleted] = await Promise.all([
    listMessageThreads(),
    listRecruiterDeletedThreadKeys(),
  ]);
  const visibleDeleted = deleted.filter((d) =>
    isRecruiterDeletedThreadVisible(d.deletedAt),
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
