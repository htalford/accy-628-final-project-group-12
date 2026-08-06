"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore, Trash2 } from "lucide-react";
import {
  markRecruiterCandidateThreadRead,
  sendAccountingStaffMessage,
  sendEmployerMessage,
  sendRecruiterMessage,
} from "@/app/actions/recruiter";
import type { RecruiterMessageThread } from "@/lib/recruiter/types";

type Filter = "all" | "employer" | "candidate" | "accounting";
type Folder = "inbox" | "deleted";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "employer", label: "Employers" },
  { id: "candidate", label: "Candidates" },
  { id: "accounting", label: "Accounting" },
];

const PLACEHOLDER = "Write a message…";
const STORAGE_KEY = "recruiter-deleted-threads-v1";
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

type DeletedMap = Record<string, string>; // threadKey -> ISO deletedAt

function threadKey(t: Pick<RecruiterMessageThread, "participantType" | "id">) {
  return `${t.participantType}:${t.id}`;
}

function daysLeft(deletedAt: string) {
  const end = new Date(deletedAt).getTime() + RETENTION_MS;
  const left = Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000));
  return Math.max(0, left);
}

function readDeletedMap(): DeletedMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DeletedMap;
    const now = Date.now();
    const pruned: DeletedMap = {};
    for (const [key, deletedAt] of Object.entries(parsed)) {
      if (now - new Date(deletedAt).getTime() < RETENTION_MS) {
        pruned[key] = deletedAt;
      }
    }
    if (Object.keys(pruned).length !== Object.keys(parsed).length) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
    }
    return pruned;
  } catch {
    return {};
  }
}

function writeDeletedMap(map: DeletedMap) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function MessagesCenter({
  threads,
}: {
  threads: RecruiterMessageThread[];
}) {
  const router = useRouter();
  const [folder, setFolder] = useState<Folder>("inbox");
  const [filter, setFilter] = useState<Filter>("all");
  const [deletedMap, setDeletedMap] = useState<DeletedMap>({});
  const [activeId, setActiveId] = useState("");
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setDeletedMap(readDeletedMap());
  }, []);

  const inboxThreads = useMemo(
    () => threads.filter((t) => !deletedMap[threadKey(t)]),
    [threads, deletedMap],
  );

  const deletedThreads = useMemo(
    () =>
      threads
        .filter((t) => deletedMap[threadKey(t)])
        .map((t) => ({
          ...t,
          deletedAt: deletedMap[threadKey(t)]!,
        })),
    [threads, deletedMap],
  );

  const folderThreads = folder === "deleted" ? deletedThreads : inboxThreads;

  const filtered = useMemo(
    () =>
      folderThreads.filter(
        (t) => filter === "all" || t.participantType === filter,
      ),
    [folderThreads, filter],
  );

  useEffect(() => {
    if (filtered.length === 0) {
      setActiveId("");
      return;
    }
    setActiveId((prev) =>
      filtered.some((t) => t.id === prev) ? prev : filtered[0]!.id,
    );
  }, [filtered]);

  const active =
    filtered.find((t) => t.id === activeId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (
      folder !== "inbox" ||
      !active ||
      active.participantType !== "candidate" ||
      active.unread === 0
    ) {
      return;
    }
    startTransition(async () => {
      await markRecruiterCandidateThreadRead(active.participantId);
      router.refresh();
    });
  }, [
    folder,
    active?.id,
    active?.unread,
    active?.participantType,
    active?.participantId,
    router,
  ]);

  function switchFolder(next: Folder) {
    setFolder(next);
    setFilter("all");
    setDraft("");
    setNotice(null);
    setConfirmDelete(false);
  }

  function moveToDeleted() {
    if (!active || folder !== "inbox") return;
    const key = threadKey(active);
    const next = { ...readDeletedMap(), [key]: new Date().toISOString() };
    writeDeletedMap(next);
    setDeletedMap(next);
    setConfirmDelete(false);
    setNotice("Conversation moved to Deleted.");
  }

  function restoreConversation() {
    if (!active || folder !== "deleted") return;
    const key = threadKey(active);
    const next = { ...readDeletedMap() };
    delete next[key];
    writeDeletedMap(next);
    setDeletedMap(next);
    setNotice("Conversation restored to Inbox.");
    switchFolder("inbox");
  }

  function sendActiveMessage() {
    if (!active || folder === "deleted") return;
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    startTransition(async () => {
      const result =
        active.participantType === "candidate"
          ? await sendRecruiterMessage({
              employeeId: active.participantId,
              subject: active.subject || "Message",
              body,
            })
          : active.participantType === "accounting"
            ? await sendAccountingStaffMessage({
                threadId: active.id,
                body,
              })
            : await sendEmployerMessage({
                threadId: active.id,
                body,
              });
      setNotice(
        result.ok ? (result.message ?? "Sent") : (result.error ?? "Failed"),
      );
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--cf-border)] bg-white shadow-sm">
      {notice ? (
        <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
          {notice}
        </div>
      ) : null}
      <div className="grid min-h-[28rem] lg:grid-cols-[16rem_1fr]">
        <aside className="flex flex-col border-b border-[var(--cf-border)] lg:border-r lg:border-b-0">
          <div className="space-y-2 p-3">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => switchFolder("inbox")}
                className={`rounded-lg px-2.5 py-2 text-center text-xs font-semibold ${
                  folder === "inbox"
                    ? "bg-[var(--cf-navy)] text-white"
                    : "border border-[var(--cf-border)] text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
                }`}
              >
                Inbox
              </button>
              <button
                type="button"
                onClick={() => switchFolder("deleted")}
                className={`rounded-lg px-2.5 py-2 text-center text-xs font-semibold ${
                  folder === "deleted"
                    ? "bg-[var(--cf-navy)] text-white"
                    : "border border-[var(--cf-border)] text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
                }`}
              >
                Deleted
                {deletedThreads.length > 0
                  ? ` (${deletedThreads.length})`
                  : ""}
              </button>
            </div>

            {folder === "inbox" ? (
              <div className="flex flex-col gap-0.5 border-t border-[var(--cf-border)] pt-2">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setFilter(f.id);
                      setConfirmDelete(false);
                    }}
                    className={`rounded-md px-2.5 py-1.5 text-left text-xs font-medium ${
                      filter === f.id
                        ? "bg-[var(--cf-accent)]/15 text-[var(--cf-navy)]"
                        : "text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="border-t border-[var(--cf-border)] pt-2 text-[11px] text-[var(--cf-muted)]">
                Conversations kept for 30 days, then removed permanently.
              </p>
            )}
          </div>
          <ul className="max-h-[24rem] flex-1 overflow-y-auto border-t border-[var(--cf-border)]">
            {filtered.map((t) => (
              <li key={`${t.participantType}-${t.id}`}>
                <button
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  className={`w-full border-b border-[var(--cf-border)] px-3 py-3 text-left hover:bg-[var(--cf-surface)] ${
                    active?.id === t.id ? "bg-[var(--cf-accent)]/10" : ""
                  }`}
                >
                  <p className="text-sm font-medium text-[var(--cf-ink)]">
                    {t.participantName}
                  </p>
                  <p className="truncate text-xs text-[var(--cf-muted)]">
                    {t.preview}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--cf-muted)]">
                    {t.participantType}
                    {folder === "deleted" && "deletedAt" in t
                      ? ` · ${daysLeft(String(t.deletedAt))}d left`
                      : t.unread
                        ? ` · ${t.unread} unread`
                        : ""}
                  </p>
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="px-3 py-8 text-center text-sm text-[var(--cf-muted)]">
                {folder === "deleted"
                  ? "No deleted conversations in the last 30 days."
                  : "No conversations"}
              </li>
            ) : null}
          </ul>
        </aside>

        <div className="flex flex-col">
          {active ? (
            <>
              <div className="flex items-start justify-between gap-3 border-b border-[var(--cf-border)] px-4 py-3">
                <div>
                  <p className="font-semibold text-[var(--cf-ink)]">
                    {active.participantName}
                  </p>
                  <p className="text-xs text-[var(--cf-muted)]">
                    {folder === "deleted" && "deletedAt" in active
                      ? `Deleted · ${daysLeft(String(active.deletedAt))} day${daysLeft(String(active.deletedAt)) === 1 ? "" : "s"} remaining`
                      : active.participantType === "candidate"
                        ? "Candidate · recruiter lane"
                        : active.participantType === "accounting"
                          ? "Accounting · staff conversation"
                          : active.subject}
                  </p>
                </div>
                {folder === "inbox" ? (
                  <button
                    type="button"
                    title="Move conversation to Deleted"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--cf-border)] px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                ) : (
                  <button
                    type="button"
                    title="Restore to Inbox"
                    onClick={restoreConversation}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--cf-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--cf-navy)] hover:bg-[var(--cf-surface)]"
                  >
                    <ArchiveRestore className="h-3.5 w-3.5" />
                    Restore
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {active.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      m.mine
                        ? "ml-auto bg-[var(--cf-navy)] text-white"
                        : "bg-[var(--cf-surface)] text-[var(--cf-ink)]"
                    }`}
                  >
                    <p className="text-[10px] opacity-70">
                      {m.sender} · {new Date(m.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                  </div>
                ))}
              </div>
              {folder === "inbox" ? (
                <div className="space-y-2 border-t border-[var(--cf-border)] p-4">
                  <div className="flex gap-2">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={2}
                      placeholder={PLACEHOLDER}
                      className="min-h-[2.5rem] flex-1 rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={pending || !draft.trim()}
                      className="self-end rounded-lg bg-[var(--cf-navy)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                      onClick={sendActiveMessage}
                    >
                      Send
                    </button>
                  </div>
                  {active.participantType === "accounting" ? (
                    <p className="text-[11px] text-[var(--cf-muted)]">
                      Synced with Accounting Portal staff conversations.
                    </p>
                  ) : active.participantType === "employer" ? (
                    <p className="text-[11px] text-[var(--cf-muted)]">
                      Synced with Client Portal employer conversations.
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="border-t border-[var(--cf-border)] px-4 py-3 text-xs text-[var(--cf-muted)]">
                  Restore this conversation to reply again. After 30 days it is
                  removed from Deleted permanently.
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-[var(--cf-muted)]">
              {folder === "deleted"
                ? "Deleted conversations appear here for 30 days."
                : "Select a conversation"}
            </div>
          )}
        </div>
      </div>

      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border border-[var(--cf-border)] bg-white p-5 shadow-lg">
            <p className="text-sm font-medium text-[var(--cf-ink)]">
              Delete this conversation?
            </p>
            <p className="mt-2 text-xs text-[var(--cf-muted)]">
              It will move to Deleted and stay available for 30 days.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={moveToDeleted}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white"
              >
                Delete conversation
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
