"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markMessageRead,
  sendCandidateMessage,
} from "@/app/actions/candidate";
import type { Message } from "@/lib/types/database";

type Counterpart = "recruiter" | "accounting" | "system";

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
};

function buildConversations(messages: Message[]): Conversation[] {
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

  const contacts: Conversation[] = STAFF_CONTACTS.map((c) => {
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
    };
  });

  const systemThread = buckets.get("system") ?? [];
  if (systemThread.length > 0) {
    const last = systemThread.at(-1)!;
    contacts.push({
      id: "system",
      role: "system",
      name: last.sender_name || "TalentQuest Desk",
      subtitle: "Support",
      preview: last.body,
      updatedAt: last.created_at,
      unread: systemThread.filter((m) => !m.is_read && !isCandidateMessage(m))
        .length,
      messages: systemThread,
    });
  }

  return contacts;
}

export function MessagesPanel({
  messages,
  withRecruiter = null,
}: {
  messages: Message[];
  withRecruiter?: string | null;
}) {
  const router = useRouter();
  const conversations = useMemo(() => buildConversations(messages), [messages]);
  const [listQuery, setListQuery] = useState("");
  const [activeId, setActiveId] = useState<Counterpart>(() => {
    if (withRecruiter) {
      const match = conversations.find(
        (c) => c.name.toLowerCase() === withRecruiter.toLowerCase(),
      );
      if (match) return match.id;
      if (/account/i.test(withRecruiter)) return "accounting";
    }
    return conversations.find((c) => c.unread > 0)?.id ?? "recruiter";
  });
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const markedKey = useRef("");

  useEffect(() => {
    if (!withRecruiter) return;
    if (/account/i.test(withRecruiter)) {
      setActiveId("accounting");
      return;
    }
    const match = conversations.find(
      (c) => c.name.toLowerCase() === withRecruiter.toLowerCase(),
    );
    if (match) setActiveId(match.id);
  }, [withRecruiter, conversations]);

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
    if (!active || active.unread === 0) return;
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
  }, [active, router]);

  function selectConversation(c: Conversation) {
    setActiveId(c.id);
    setDraft("");
    setNotice(null);
    router.replace(`/candidate/messages?with=${encodeURIComponent(c.name)}`, {
      scroll: false,
    });
  }

  function onSend(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !active) return;
    if (active.role === "system") {
      setNotice("Reply to Recruiter or Accounting — Desk messages are inbound only.");
      return;
    }
    setNotice(null);
    startTransition(async () => {
      const result = await sendCandidateMessage({
        body,
        counterpartRole: active.role,
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
    <div className="grid min-h-[34rem] overflow-hidden rounded-2xl border border-[var(--cf-border)] bg-white shadow-sm lg:grid-cols-[280px_1fr]">
      <aside className="flex flex-col border-b border-[var(--cf-border)] lg:border-r lg:border-b-0">
        <div className="border-b border-[var(--cf-border)] px-3 py-3">
          <p className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-[var(--cf-muted)] uppercase">
            Conversations
          </p>
          <input
            type="search"
            value={listQuery}
            onChange={(e) => setListQuery(e.target.value)}
            placeholder="Search recruiter or accounting…"
            aria-label="Search conversations"
            className="w-full rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] px-3 py-2 text-sm outline-none transition focus:border-[var(--cf-accent)] focus:bg-white focus:ring-2 focus:ring-[var(--cf-accent)]/20"
          />
        </div>
        <ul className="flex-1 overflow-y-auto">
          {filteredList.map((c) => {
            const selected = c.id === active?.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => selectConversation(c)}
                  className={`flex w-full items-start gap-3 border-b border-[var(--cf-border)] px-3 py-3 text-left transition hover:bg-[var(--cf-surface)] ${
                    selected ? "bg-[var(--cf-surface)]" : ""
                  }`}
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
                      {c.subtitle}
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-[var(--cf-muted)]">
                        {c.preview}
                      </span>
                      {c.unread > 0 ? (
                        <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--cf-accent)] px-1.5 text-[10px] font-bold text-white">
                          {c.unread}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="flex min-h-[22rem] flex-col">
        {active ? (
          <>
            <header className="flex items-center gap-3 border-b border-[var(--cf-border)] bg-[linear-gradient(180deg,var(--cf-surface)_0%,#fff_100%)] px-4 py-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--cf-navy)] text-sm font-semibold text-white">
                {initials(active.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--cf-ink)]">
                  {active.name}
                </p>
                <p className="text-xs text-[var(--cf-muted)]">{active.subtitle}</p>
              </div>
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
                  Private to this portal — {active.role === "accounting"
                    ? "accounting"
                    : active.role === "recruiter"
                      ? "recruiter"
                      : "support"}{" "}
                  only
                </p>
              )}
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-[var(--cf-muted)]">
            Select a conversation.
          </div>
        )}
      </section>
    </div>
  );
}
