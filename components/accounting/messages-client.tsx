"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markAccountingCandidateThreadRead,
  sendAccountingMessage,
} from "@/app/actions/accounting-messages";
import type { StaffCandidateThread } from "@/lib/staff/message-types";

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

export function AccountingMessagesClient({
  threads: initial,
}: {
  threads: StaffCandidateThread[];
}) {
  const router = useRouter();
  const [threads, setThreads] = useState(initial);
  const [activeId, setActiveId] = useState(initial[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setThreads(initial);
    if (initial.length && !initial.some((t) => t.id === activeId)) {
      setActiveId(initial[0]!.id);
    }
  }, [initial, activeId]);

  const active = useMemo(
    () => threads.find((t) => t.id === activeId) ?? threads[0] ?? null,
    [threads, activeId],
  );

  useEffect(() => {
    if (!active || active.unread === 0) return;
    startTransition(async () => {
      await markAccountingCandidateThreadRead(active.employeeId);
      router.refresh();
    });
  }, [active?.id, active?.unread, active?.employeeId, router]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!active || !draft.trim()) return;
    const body = draft.trim();
    startTransition(async () => {
      const result = await sendAccountingMessage({
        employeeId: active.employeeId,
        body,
      });
      if (!result.ok) {
        setNotice(result.error);
        return;
      }
      setDraft("");
      setNotice(null);
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--cf-border)] bg-white shadow-sm">
      {notice ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {notice}
        </div>
      ) : null}
      <div className="grid min-h-[28rem] lg:grid-cols-[16rem_1fr]">
        <aside className="border-b border-[var(--cf-border)] lg:border-r lg:border-b-0">
          <p className="border-b border-[var(--cf-border)] px-3 py-2 text-[11px] font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
            Candidates
          </p>
          <ul className="max-h-[24rem] overflow-y-auto">
            {threads.map((t) => (
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
                  {t.unread ? (
                    <p className="mt-1 text-[10px] font-semibold text-[var(--cf-accent)]">
                      {t.unread} unread
                    </p>
                  ) : null}
                </button>
              </li>
            ))}
            {threads.length === 0 ? (
              <li className="px-3 py-8 text-center text-sm text-[var(--cf-muted)]">
                No candidate messages yet.
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
                <p className="text-xs text-[var(--cf-muted)]">
                  Candidate · accounting only
                </p>
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
                    {!m.mine ? (
                      <p className="mb-1 text-[11px] font-semibold opacity-80">
                        {m.sender}
                      </p>
                    ) : null}
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        m.mine ? "text-white/70" : "text-[var(--cf-muted)]"
                      }`}
                    >
                      {formatWhen(m.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
              <form
                onSubmit={send}
                className="border-t border-[var(--cf-border)] p-3"
              >
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Message ${active.participantName}…`}
                    className="flex-1 rounded-md border border-[var(--cf-border)] px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={pending || !draft.trim()}
                    className="rounded-md bg-[var(--cf-navy)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-sm text-[var(--cf-muted)]">
              Select a candidate conversation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
