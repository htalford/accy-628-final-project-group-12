"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore, Trash2 } from "lucide-react";
import {
  deleteAccountingThread,
  deleteAccountingThreads,
  markAccountingCandidateThreadRead,
  restoreAccountingThread,
  restoreAccountingThreads,
  sendAccountingCandidateMessage,
  sendAccountingEmployerMessage,
  sendAccountingRecruiterMessage,
} from "@/app/actions/accounting-messages";
import type { AccountingMessageThread } from "@/lib/accounting/messages";

type Filter = "all" | "candidate" | "employer" | "recruiter";
type Folder = "inbox" | "deleted";

type Thread = AccountingMessageThread & { deletedAt?: string };

function threadKey(t: Pick<Thread, "participantType" | "id">) {
  return `${t.participantType}:${t.id}`;
}

function daysLeft(deletedAt: string) {
  const end = new Date(deletedAt).getTime() + 30 * 24 * 60 * 60 * 1000;
  const left = Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000));
  return Math.max(0, left);
}

export function AccountingMessagesCenter({
  inboxThreads = [],
  deletedThreads = [],
  folder,
}: {
  inboxThreads?: AccountingMessageThread[];
  deletedThreads?: (AccountingMessageThread & { deletedAt: string })[];
  folder: Folder;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [activeKey, setActiveKey] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState("");
  const [subject, setSubject] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const threads: Thread[] =
    folder === "deleted" ? deletedThreads : inboxThreads;

  const filtered = useMemo(
    () =>
      (threads ?? []).filter(
        (t) => filter === "all" || t.participantType === filter,
      ),
    [threads, filter],
  );

  useEffect(() => {
    setSelectedKeys(new Set());
    setDraft("");
    setSubject("");
    setNotice(null);
  }, [folder]);

  useEffect(() => {
    if (filtered.length === 0) {
      setActiveKey("");
      return;
    }
    const first = filtered[0];
    if (!first) {
      setActiveKey("");
      return;
    }
    setActiveKey((prev) =>
      filtered.some((t) => threadKey(t) === prev) ? prev : threadKey(first),
    );
  }, [filtered]);

  const active =
    filtered.find((t) => threadKey(t) === activeKey) ?? filtered[0] ?? null;

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
      await markAccountingCandidateThreadRead(active.participantId);
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

  function setFolder(next: Folder) {
    setFilter("all");
    setSelectedKeys(new Set());
    setDraft("");
    setSubject("");
    setNotice(null);
    const params = new URLSearchParams();
    if (next === "deleted") params.set("folder", "deleted");
    router.replace(
      params.toString()
        ? `/accounting/messages?${params}`
        : "/accounting/messages",
      { scroll: false },
    );
  }

  function toggleSelected(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSelectAll() {
    const visible = filtered.map(threadKey);
    const allSelected =
      visible.length > 0 && visible.every((k) => selectedKeys.has(k));
    if (allSelected) {
      setSelectedKeys(new Set());
      return;
    }
    setSelectedKeys(new Set(visible));
  }

  function refsFromKeys(keys: Iterable<string>) {
    return Array.from(keys).flatMap((key) => {
      const [participantType, ...rest] = key.split(":");
      const threadId = rest.join(":");
      if (
        participantType !== "candidate" &&
        participantType !== "employer" &&
        participantType !== "recruiter"
      ) {
        return [];
      }
      if (!threadId) return [];
      return [
        {
          participantType: participantType as
            | "candidate"
            | "employer"
            | "recruiter",
          threadId,
        },
      ];
    });
  }

  function onDeleteThread() {
    if (!active || folder !== "inbox") return;
    startTransition(async () => {
      const result = await deleteAccountingThread({
        participantType: active.participantType,
        threadId: active.id,
      });
      if (result.ok) {
        setNotice(null);
        setSelectedKeys((prev) => {
          const next = new Set(prev);
          next.delete(threadKey(active));
          return next;
        });
        router.refresh();
      } else {
        setNotice(result.error ?? "Failed to delete");
      }
    });
  }

  function onDeleteSelected() {
    const refs = refsFromKeys(selectedKeys);
    if (refs.length === 0) return;
    startTransition(async () => {
      const result = await deleteAccountingThreads(refs);
      if (result.ok) {
        setNotice(null);
        setSelectedKeys(new Set());
        router.refresh();
      } else {
        setNotice(result.error ?? "Failed to delete");
      }
    });
  }

  function onRestoreThread() {
    if (!active || folder !== "deleted") return;
    startTransition(async () => {
      const result = await restoreAccountingThread({
        participantType: active.participantType,
        threadId: active.id,
      });
      if (result.ok) {
        setNotice(null);
        setSelectedKeys((prev) => {
          const next = new Set(prev);
          next.delete(threadKey(active));
          return next;
        });
        router.replace("/accounting/messages", { scroll: false });
        router.refresh();
      } else {
        setNotice(result.error ?? "Failed to restore");
      }
    });
  }

  function onRestoreSelected() {
    const refs = refsFromKeys(selectedKeys);
    if (refs.length === 0) return;
    startTransition(async () => {
      const result = await restoreAccountingThreads(refs);
      if (result.ok) {
        setNotice(null);
        setSelectedKeys(new Set());
        router.replace("/accounting/messages", { scroll: false });
        router.refresh();
      } else {
        setNotice(result.error ?? "Failed to restore");
      }
    });
  }

  function send() {
    if (!active || !draft.trim() || folder === "deleted") return;
    const body = draft.trim();
    const subj = subject.trim() || active.subject;
    setDraft("");
    startTransition(async () => {
      let result: { ok: boolean; message?: string; error?: string };
      if (active.participantType === "candidate") {
        result = await sendAccountingCandidateMessage({
          employeeId: active.participantId,
          subject: subj,
          body,
        });
      } else if (active.participantType === "employer") {
        result = await sendAccountingEmployerMessage({
          threadId: active.id,
          body,
        });
      } else {
        result = await sendAccountingRecruiterMessage({
          threadId: active.id,
          body,
        });
      }
      setNotice(result.ok ? (result.message ?? "Sent") : (result.error ?? "Failed"));
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--cf-border)] bg-white shadow-sm">
      {notice ? (
        <div
          className={`border-b px-4 py-2 text-sm ${
            notice.toLowerCase().includes("fail") ||
            notice.toLowerCase().includes("required") ||
            notice.toLowerCase().includes("unauthorized")
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {notice}
        </div>
      ) : null}
      <div className="grid min-h-[28rem] lg:grid-cols-[18rem_1fr]">
        <aside className="border-b border-[var(--cf-border)] lg:border-r lg:border-b-0">
          <div className="space-y-2 border-b border-[var(--cf-border)] p-3">
            <div className="flex rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] p-0.5">
              <button
                type="button"
                onClick={() => setFolder("inbox")}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                  folder === "inbox"
                    ? "bg-white text-[var(--cf-ink)] shadow-sm"
                    : "text-[var(--cf-muted)] hover:text-[var(--cf-ink)]"
                }`}
              >
                Inbox
              </button>
              <button
                type="button"
                onClick={() => setFolder("deleted")}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition ${
                  folder === "deleted"
                    ? "bg-white text-[var(--cf-ink)] shadow-sm"
                    : "text-[var(--cf-muted)] hover:text-[var(--cf-ink)]"
                }`}
              >
                Deleted
                {deletedThreads.length > 0 ? (
                  <span className="ml-1 text-[10px] text-[var(--cf-muted)]">
                    ({deletedThreads.length})
                  </span>
                ) : null}
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {(["all", "recruiter", "employer", "candidate"] as const).map(
                (f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize ${
                      filter === f
                        ? "bg-[var(--cf-navy)] text-white"
                        : "text-[var(--cf-muted)] hover:bg-[var(--cf-surface)]"
                    }`}
                  >
                    {f}
                  </button>
                ),
              )}
            </div>
            {filtered.length > 0 ? (
              <div className="flex items-center justify-between gap-2 pt-1">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[var(--cf-muted)]">
                  <input
                    type="checkbox"
                    checked={
                      filtered.length > 0 &&
                      filtered.every((t) => selectedKeys.has(threadKey(t)))
                    }
                    onChange={toggleSelectAll}
                    className="h-3.5 w-3.5 rounded border-[var(--cf-border)]"
                  />
                  Select all
                </label>
                {selectedKeys.size > 0 ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={
                      folder === "deleted" ? onRestoreSelected : onDeleteSelected
                    }
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                      folder === "deleted"
                        ? "text-[var(--cf-ink)] hover:bg-[var(--cf-accent)]/10"
                        : "text-red-700 hover:bg-red-50"
                    }`}
                  >
                    {folder === "deleted" ? (
                      <ArchiveRestore className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {folder === "deleted" ? "Restore" : "Delete"} (
                    {selectedKeys.size})
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
          <ul className="max-h-[24rem] overflow-y-auto">
            {filtered.map((t) => {
              const key = threadKey(t);
              const isActive = active ? threadKey(active) === key : false;
              return (
                <li key={key}>
                  <div
                    className={`flex w-full items-start gap-2 border-b border-[var(--cf-border)] px-2 py-2.5 hover:bg-[var(--cf-surface)] ${
                      isActive ? "bg-[var(--cf-accent)]/10" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedKeys.has(key)}
                      onChange={() => toggleSelected(key)}
                      aria-label={`Select ${t.participantName}`}
                      className="mt-2.5 h-3.5 w-3.5 shrink-0 rounded border-[var(--cf-border)]"
                    />
                    <button
                      type="button"
                      onClick={() => setActiveKey(key)}
                      className="min-w-0 flex-1 py-0.5 text-left"
                    >
                      <p className="text-sm font-medium text-[var(--cf-ink)]">
                        {t.participantName}
                      </p>
                      <p className="truncate text-xs text-[var(--cf-muted)]">
                        {t.preview}
                      </p>
                      <p className="mt-1 text-[10px] tracking-wide text-[var(--cf-muted)] uppercase">
                        {t.participantType}
                        {folder === "deleted" && t.deletedAt
                          ? ` · ${daysLeft(t.deletedAt)}d left`
                          : t.unread
                            ? ` · ${t.unread} unread`
                            : ""}
                      </p>
                    </button>
                  </div>
                </li>
              );
            })}
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
              <div className="flex items-start gap-3 border-b border-[var(--cf-border)] px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--cf-ink)]">
                    {active.participantName}
                  </p>
                  <p className="text-xs text-[var(--cf-muted)]">
                    {folder === "deleted" && active.deletedAt
                      ? `Deleted · ${daysLeft(active.deletedAt)} day${daysLeft(active.deletedAt) === 1 ? "" : "s"} remaining`
                      : active.subject}
                  </p>
                </div>
                {folder === "inbox" ? (
                  <button
                    type="button"
                    onClick={onDeleteThread}
                    disabled={pending}
                    title="Move to Deleted"
                    aria-label="Delete conversation"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cf-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--cf-muted)] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    Delete
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onRestoreThread}
                    disabled={pending}
                    title="Restore to Inbox"
                    aria-label="Restore conversation"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cf-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--cf-ink)] transition hover:bg-[var(--cf-accent)]/10 disabled:opacity-50"
                  >
                    <ArchiveRestore className="h-3.5 w-3.5" aria-hidden />
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
                  {active.participantType === "candidate" ? (
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Subject"
                      className="w-full rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm"
                    />
                  ) : null}
                  <div className="flex gap-2">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={2}
                      placeholder={`Message ${active.participantName}…`}
                      className="min-h-[2.5rem] flex-1 rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={pending || !draft.trim()}
                      className="self-end rounded-lg bg-[var(--cf-navy)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                      onClick={send}
                    >
                      Send
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-[var(--cf-border)] px-4 py-3 text-xs text-[var(--cf-muted)]">
                  Restore this conversation to reply, or it will leave Deleted
                  after 30 days.
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-[var(--cf-muted)]">
              {folder === "deleted"
                ? "No deleted conversations"
                : "Select a conversation"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
