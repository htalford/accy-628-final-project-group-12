"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore, Trash2 } from "lucide-react";
import {
  deleteCandidateThread,
  deleteCandidateThreads,
  markMessageRead,
  restoreCandidateThread,
  restoreCandidateThreads,
  sendCandidateMessage,
} from "@/app/actions/candidate";
import type { CandidateDeletedThread } from "@/lib/candidate/data";
import type { Message } from "@/lib/types/database";

type Counterpart = "recruiter" | "accounting" | "system";
type Folder = "inbox" | "deleted";

const STAFF_CONTACTS: {
  role: Counterpart;
  name: string;
  subtitle: string;
}[] = [
  {
    role: "recruiter",
    name: "Morgan Recruiter",
    subtitle: "Recruiting · placements & jobs",
  },
  {
    role: "accounting",
    name: "Avery Accounting",
    subtitle: "Accounting · pay & timesheets",
  },
];

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(0, 16);
  }
}

function formatShort(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function daysLeft(deletedAt: string) {
  const end = new Date(deletedAt).getTime() + 30 * 24 * 60 * 60 * 1000;
  const left = Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000));
  return Math.max(0, left);
}

function isCandidateMessage(message: Message) {
  return message.sender_role === "candidate";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function resolveCounterpart(message: Message): Counterpart {
  const stored = message.counterpart_role;
  if (stored === "recruiter" || stored === "accounting" || stored === "system") {
    return stored;
  }
  if (message.sender_role === "accounting") return "accounting";
  if (message.sender_role === "system") return "system";
  if (
    message.sender_role !== "candidate" &&
    /desk|support/i.test(message.sender_name)
  ) {
    return "system";
  }
  if (
    message.sender_role === "candidate" &&
    /accounting|pay|payroll/i.test(message.subject ?? "")
  ) {
    return "accounting";
  }
  return "recruiter";
}

type Conversation = {
  id: Counterpart;
  role: Counterpart;
  name: string;
  subtitle: string;
  preview: string;
  updatedAt: string;
  unread: number;
  messages: Message[];
  deletedAt?: string;
};

function buildConversations(
  messages: Message[],
  options: {
    includeRoles: Set<Counterpart> | "all";
    excludeRoles?: Set<Counterpart>;
    requireMessages?: boolean;
    deletedAtByRole?: Map<Counterpart, string>;
  },
): Conversation[] {
  const sorted = [...messages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const buckets = new Map<Counterpart, Message[]>();
  for (const m of sorted) {
    const role = resolveCounterpart(m);
    const list = buckets.get(role) ?? [];
    list.push(m);
    buckets.set(role, list);
  }

  const contacts: Conversation[] = STAFF_CONTACTS.filter((c) => {
    if (options.excludeRoles?.has(c.role)) return false;
    if (options.includeRoles !== "all" && !options.includeRoles.has(c.role)) {
      return false;
    }
    if (options.requireMessages && !(buckets.get(c.role)?.length)) return false;
    return true;
  }).map((c) => {
    const thread = buckets.get(c.role) ?? [];
    const last = thread.at(-1);
    return {
      id: c.role,
      role: c.role,
      name: last && !isCandidateMessage(last) ? last.sender_name : c.name,
      subtitle: c.subtitle,
      preview: last?.body ?? "Say hello to start this conversation",
      updatedAt: last?.created_at ?? "",
      unread: thread.filter((m) => !m.is_read && !isCandidateMessage(m)).length,
      messages: thread,
      deletedAt: options.deletedAtByRole?.get(c.role),
    };
  });

  const systemThread = buckets.get("system") ?? [];
  const includeSystem =
    (options.includeRoles === "all" || options.includeRoles.has("system")) &&
    !options.excludeRoles?.has("system") &&
    (!options.requireMessages || systemThread.length > 0);

  if (includeSystem && (systemThread.length > 0 || options.includeRoles !== "all")) {
    if (systemThread.length > 0 || options.deletedAtByRole?.has("system")) {
      const last = systemThread.at(-1);
      contacts.push({
        id: "system",
        role: "system",
        name: last?.sender_name || "TalentQuest Desk",
        subtitle: "Support",
        preview: last?.body ?? "No messages in this conversation",
        updatedAt: last?.created_at ?? options.deletedAtByRole?.get("system") ?? "",
        unread: systemThread.filter((m) => !m.is_read && !isCandidateMessage(m))
          .length,
        messages: systemThread,
        deletedAt: options.deletedAtByRole?.get("system"),
      });
    }
  }

  return contacts;
}

export function MessagesPanel({
  messages,
  deletedThreads,
  hiddenRoles,
  folder = "inbox",
  withRecruiter = null,
}: {
  messages: Message[];
  deletedThreads: CandidateDeletedThread[];
  hiddenRoles: Array<"recruiter" | "accounting" | "system">;
  folder?: Folder;
  withRecruiter?: string | null;
}) {
  const router = useRouter();
  const hidden = useMemo(() => new Set(hiddenRoles), [hiddenRoles]);
  const deletedAtByRole = useMemo(() => {
    const map = new Map<Counterpart, string>();
    for (const row of deletedThreads) {
      map.set(row.counterpart_role, row.deleted_at);
    }
    return map;
  }, [deletedThreads]);

  const inboxConversations = useMemo(
    () =>
      buildConversations(messages, {
        includeRoles: "all",
        excludeRoles: hidden,
      }),
    [messages, hidden],
  );

  const deletedConversations = useMemo(
    () =>
      buildConversations(messages, {
        includeRoles: new Set(deletedThreads.map((t) => t.counterpart_role)),
        requireMessages: false,
        deletedAtByRole,
      }),
    [messages, deletedThreads, deletedAtByRole],
  );

  const conversations =
    folder === "deleted" ? deletedConversations : inboxConversations;

  const [listQuery, setListQuery] = useState("");
  const [activeId, setActiveId] = useState<Counterpart | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<Counterpart>>(new Set());
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const markedKey = useRef("");

  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const valid = new Set(conversations.map((c) => c.id));
      const next = new Set(
        Array.from(prev).filter((id) => valid.has(id)),
      );
      return next.size === prev.size ? prev : next;
    });
  }, [conversations]);

  useEffect(() => {
    if (folder === "deleted") {
      setActiveId(deletedConversations[0]?.id ?? null);
      return;
    }
    if (withRecruiter) {
      if (/account/i.test(withRecruiter)) {
        setActiveId("accounting");
        return;
      }
      const match = inboxConversations.find(
        (c) => c.name.toLowerCase() === withRecruiter.toLowerCase(),
      );
      if (match) {
        setActiveId(match.id);
        return;
      }
    }
    setActiveId(
      inboxConversations.find((c) => c.unread > 0)?.id ??
        inboxConversations[0]?.id ??
        null,
    );
  }, [folder, withRecruiter, inboxConversations, deletedConversations]);

  const filteredList = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.role.includes(q) ||
        c.preview.toLowerCase().includes(q),
    );
  }, [conversations, listQuery]);

  const active =
    filteredList.find((c) => c.id === activeId) ??
    conversations.find((c) => c.id === activeId) ??
    filteredList[0] ??
    conversations[0] ??
    null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [active?.id, active?.messages.length]);

  useEffect(() => {
    if (folder !== "inbox" || !active || active.unread === 0) return;
    const key = `${active.id}:${active.unread}`;
    if (markedKey.current === key) return;
    markedKey.current = key;
    const unreadIds = active.messages
      .filter((m) => !m.is_read && !isCandidateMessage(m))
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    startTransition(async () => {
      await Promise.all(unreadIds.map((id) => markMessageRead(id)));
      router.refresh();
    });
  }, [active, folder, router]);

  function setFolder(next: Folder) {
    setListQuery("");
    setDraft("");
    setNotice(null);
    setSelectedIds(new Set());
    const params = new URLSearchParams();
    if (next === "deleted") params.set("folder", "deleted");
    router.replace(
      params.toString() ? `/candidate/messages?${params}` : "/candidate/messages",
      { scroll: false },
    );
  }

  function toggleSelected(id: Counterpart) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const visibleIds = filteredList.map((c) => c.id);
    const allSelected =
      visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(visibleIds));
  }

  function selectConversation(c: Conversation) {
    setActiveId(c.id);
    setDraft("");
    setNotice(null);
    const params = new URLSearchParams();
    if (folder === "deleted") params.set("folder", "deleted");
    params.set("with", c.name);
    router.replace(`/candidate/messages?${params.toString()}`, {
      scroll: false,
    });
  }

  function onDeleteThread() {
    if (!active) return;
    startTransition(async () => {
      const result = await deleteCandidateThread(active.role);
      if (result.ok) {
        setNotice(null);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(active.role);
          return next;
        });
        router.refresh();
      } else {
        setNotice(result.error);
      }
    });
  }

  function onDeleteSelected() {
    const roles = Array.from(selectedIds);
    if (roles.length === 0) return;
    startTransition(async () => {
      const result = await deleteCandidateThreads(roles);
      if (result.ok) {
        setNotice(null);
        setSelectedIds(new Set());
        router.refresh();
      } else {
        setNotice(result.error);
      }
    });
  }

  function onRestoreThread() {
    if (!active) return;
    startTransition(async () => {
      const result = await restoreCandidateThread(active.role);
      if (result.ok) {
        setNotice(null);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(active.role);
          return next;
        });
        router.replace(
          `/candidate/messages?with=${encodeURIComponent(active.name)}`,
          { scroll: false },
        );
        router.refresh();
      } else {
        setNotice(result.error);
      }
    });
  }

  function onRestoreSelected() {
    const roles = Array.from(selectedIds);
    if (roles.length === 0) return;
    startTransition(async () => {
      const result = await restoreCandidateThreads(roles);
      if (result.ok) {
        setNotice(null);
        setSelectedIds(new Set());
        router.replace("/candidate/messages", { scroll: false });
        router.refresh();
      } else {
        setNotice(result.error);
      }
    });
  }

  function onSend(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !active || folder === "deleted") return;
    if (active.role === "system") {
      setNotice("Reply to Recruiter or Accounting — Desk messages are inbound only.");
      return;
    }
    setNotice(null);
    startTransition(async () => {
      const result = await sendCandidateMessage({
        body,
        counterpartRole:
          active.role === "accounting" ? "accounting" : "recruiter",
        subject:
          active.role === "accounting"
            ? "Chat with accounting"
            : `Chat with ${active.name}`,
      });
      if (result.ok) {
        setDraft("");
        router.refresh();
      } else {
        setNotice(result.error);
      }
    });
  }

  return (
    <div className="grid min-h-[34rem] overflow-hidden rounded-2xl border border-[var(--cf-border)] bg-white shadow-sm lg:grid-cols-[300px_1fr]">
      <aside className="flex flex-col border-b border-[var(--cf-border)] lg:border-r lg:border-b-0">
        <div className="border-b border-[var(--cf-border)] px-3 py-3">
          <div className="mb-3 flex rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] p-0.5">
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
              {deletedConversations.length > 0 ? (
                <span className="ml-1 text-[10px] text-[var(--cf-muted)]">
                  ({deletedConversations.length})
                </span>
              ) : null}
            </button>
          </div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-[var(--cf-muted)] uppercase">
            {folder === "deleted" ? "Deleted (30 days)" : "Conversations"}
          </p>
          <input
            type="search"
            value={listQuery}
            onChange={(e) => setListQuery(e.target.value)}
            placeholder={
              folder === "deleted"
                ? "Search deleted…"
                : "Search recruiter or accounting…"
            }
            aria-label="Search conversations"
            className="w-full rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--cf-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--cf-accent)]/20"
          />
          {filteredList.length > 0 ? (
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[var(--cf-muted)]">
                <input
                  type="checkbox"
                  checked={
                    filteredList.length > 0 &&
                    filteredList.every((c) => selectedIds.has(c.id))
                  }
                  onChange={toggleSelectAll}
                  className="h-3.5 w-3.5 rounded border-[var(--cf-border)]"
                />
                Select all
              </label>
              {selectedIds.size > 0 ? (
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
                  {folder === "deleted" ? "Restore" : "Delete"} ({selectedIds.size})
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <ul className="flex-1 overflow-y-auto">
          {filteredList.length === 0 ? (
            <li className="px-4 py-8 text-center text-xs text-[var(--cf-muted)]">
              {folder === "deleted"
                ? "No deleted conversations in the last 30 days."
                : "No conversations yet."}
            </li>
          ) : (
            filteredList.map((c) => {
              const selected = c.id === active?.id;
              const checked = selectedIds.has(c.id);
              return (
                <li key={c.id}>
                  <div
                    className={`flex w-full items-start gap-2 border-b border-[var(--cf-border)] px-2 py-2.5 transition hover:bg-[var(--cf-surface)] ${
                      selected ? "bg-[var(--cf-surface)]" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelected(c.id)}
                      aria-label={`Select ${c.name}`}
                      className="mt-2.5 h-3.5 w-3.5 shrink-0 rounded border-[var(--cf-border)]"
                    />
                    <button
                      type="button"
                      onClick={() => selectConversation(c)}
                      className="flex min-w-0 flex-1 items-start gap-3 py-0.5 text-left"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--cf-navy)] text-xs font-semibold text-white">
                        {initials(c.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-[var(--cf-ink)]">
                            {c.name}
                          </span>
                          {c.updatedAt ? (
                            <span className="shrink-0 text-[10px] text-[var(--cf-muted)]">
                              {formatShort(c.updatedAt)}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-[var(--cf-muted)]">
                          {folder === "deleted" && c.deletedAt
                            ? `${daysLeft(c.deletedAt)} day${daysLeft(c.deletedAt) === 1 ? "" : "s"} left`
                            : c.subtitle}
                        </span>
                        <span className="mt-0.5 flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-[var(--cf-muted)]">
                            {c.preview}
                          </span>
                          {folder === "inbox" && c.unread > 0 ? (
                            <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--cf-accent)] px-1.5 text-[10px] font-bold text-white">
                              {c.unread}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </aside>

      <section className="flex min-h-[22rem] flex-col">
        {active ? (
          <>
            <header className="flex items-center gap-3 border-b border-[var(--cf-border)] bg-[linear-gradient(180deg,var(--cf-surface)_0%,#fff_100%)] px-4 py-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--cf-navy)] text-sm font-semibold text-white">
                {initials(active.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--cf-ink)]">
                  {active.name}
                </p>
                <p className="text-xs text-[var(--cf-muted)]">
                  {folder === "deleted" && active.deletedAt
                    ? `Deleted · ${daysLeft(active.deletedAt)} day${daysLeft(active.deletedAt) === 1 ? "" : "s"} remaining`
                    : active.subtitle}
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
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cf-border)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--cf-ink)] transition hover:border-[var(--cf-accent)]/40 hover:bg-[var(--cf-accent)]/10 disabled:opacity-50"
                >
                  <ArchiveRestore className="h-3.5 w-3.5" aria-hidden />
                  Restore
                </button>
              )}
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--cf-surface)]/35 px-3 py-4 sm:px-5">
              {active.messages.length === 0 ? (
                <div className="flex h-full min-h-[14rem] flex-col items-center justify-center text-center">
                  <p className="text-sm font-medium text-[var(--cf-ink)]">
                    No messages yet
                  </p>
                  <p className="mt-1 text-xs text-[var(--cf-muted)]">
                    Only you and {active.name} will see this conversation.
                  </p>
                </div>
              ) : (
                active.messages.map((message) => {
                  const mine = isCandidateMessage(message);
                  return (
                    <div
                      key={message.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm sm:max-w-[72%] ${
                          mine
                            ? "rounded-br-md bg-[var(--cf-navy)] text-white"
                            : "rounded-bl-md border border-[var(--cf-border)] bg-white text-[var(--cf-ink)]"
                        }`}
                      >
                        {!mine ? (
                          <p className="mb-1 text-[11px] font-semibold text-[var(--cf-accent)]">
                            {message.sender_name}
                          </p>
                        ) : null}
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {message.body}
                        </p>
                        <p
                          className={`mt-1.5 text-[10px] ${
                            mine ? "text-white/70" : "text-[var(--cf-muted)]"
                          }`}
                        >
                          {formatWhen(message.created_at)}
                          {mine ? " · You" : ""}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {folder === "deleted" ? (
              <div className="border-t border-[var(--cf-border)] bg-white px-4 py-3 text-xs text-[var(--cf-muted)]">
                Restore this conversation to reply again. After 30 days it is
                removed from Deleted permanently.
              </div>
            ) : (
              <form
                onSubmit={onSend}
                className="border-t border-[var(--cf-border)] bg-white px-3 py-3 sm:px-4"
              >
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        onSend(e);
                      }
                    }}
                    rows={2}
                    disabled={active.role === "system"}
                    placeholder={
                      active.role === "system"
                        ? "Desk messages are read-only"
                        : `Message ${active.name}…`
                    }
                    className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)] px-3 py-2.5 text-sm outline-none transition focus:border-[var(--cf-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--cf-accent)]/20 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={
                      pending || !draft.trim() || active.role === "system"
                    }
                    className="rounded-xl bg-[var(--cf-navy)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--cf-navy-hover)] disabled:opacity-50"
                  >
                    {pending ? "…" : "Send"}
                  </button>
                </div>
                {notice ? (
                  <p className="mt-2 text-xs text-red-600">{notice}</p>
                ) : (
                  <p className="mt-2 text-[11px] text-[var(--cf-muted)]">
                    Private to this portal —{" "}
                    {active.role === "accounting"
                      ? "accounting"
                      : active.role === "recruiter"
                        ? "recruiter"
                        : "support"}{" "}
                    only
                  </p>
                )}
              </form>
            )}
            {notice && folder === "deleted" ? (
              <p className="border-t border-[var(--cf-border)] px-4 py-2 text-xs text-red-600">
                {notice}
              </p>
            ) : null}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-[var(--cf-muted)]">
            {folder === "deleted"
              ? "Deleted conversations appear here for 30 days."
              : "Select a conversation."}
          </div>
        )}
      </section>
    </div>
  );
}
