"use client";

import { useMemo, useState, useTransition } from "react";
import { sendRecruiterMessage } from "@/app/actions/recruiter";
import type { RecruiterMessageThread } from "@/lib/recruiter/types";

export function MessagesCenter({
  threads,
}: {
  threads: RecruiterMessageThread[];
}) {
  const [filter, setFilter] = useState<"all" | "employer" | "candidate">("all");
  const [activeId, setActiveId] = useState(threads[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [subject, setSubject] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () =>
      threads.filter(
        (t) => filter === "all" || t.participantType === filter,
      ),
    [threads, filter],
  );

  const active =
    filtered.find((t) => t.id === activeId) ?? filtered[0] ?? null;

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--cf-border)] bg-white shadow-sm">
      {notice ? (
        <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
          {notice}
        </div>
      ) : null}
      <div className="grid min-h-[28rem] lg:grid-cols-[18rem_1fr]">
        <aside className="border-b border-[var(--cf-border)] lg:border-r lg:border-b-0">
          <div className="flex gap-1 border-b border-[var(--cf-border)] p-3">
            {(["all", "employer", "candidate"] as const).map((f) => (
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
            ))}
          </div>
          <ul className="max-h-[24rem] overflow-y-auto">
            {filtered.map((t) => (
              <li key={t.id}>
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
                    {t.unread ? ` · ${t.unread} unread` : ""}
                  </p>
                </button>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="px-3 py-8 text-center text-sm text-[var(--cf-muted)]">
                No conversations
              </li>
            ) : null}
          </ul>
        </aside>

        <div className="flex flex-col">
          {active ? (
            <>
              <div className="border-b border-[var(--cf-border)] px-4 py-3">
                <p className="font-semibold text-[var(--cf-ink)]">
                  {active.participantName}
                </p>
                <p className="text-xs text-[var(--cf-muted)]">{active.subject}</p>
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
              <div className="space-y-2 border-t border-[var(--cf-border)] p-4">
                {active.participantType === "candidate" ? (
                  <>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Subject"
                      className="w-full rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={2}
                        placeholder="Write a message…"
                        className="min-h-[2.5rem] flex-1 rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        disabled={pending || !draft.trim()}
                        className="self-end rounded-lg bg-[var(--cf-navy)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        onClick={() => {
                          const body = draft.trim();
                          const subj = subject.trim() || active.subject;
                          setDraft("");
                          startTransition(async () => {
                            const result = await sendRecruiterMessage({
                              employeeId: active.participantId,
                              subject: subj,
                              body,
                            });
                            setNotice(
                              result.ok
                                ? result.message ?? "Sent"
                                : result.error ?? "Failed",
                            );
                          });
                        }}
                      >
                        Send
                      </button>
                    </div>
                    <p className="text-[11px] text-[var(--cf-muted)]">
                      Attachment support will connect to storage in a later release.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-[var(--cf-muted)]">
                    Employer messaging is structured for future DB integration.
                    Candidate threads send through Supabase `messages`.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-[var(--cf-muted)]">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
