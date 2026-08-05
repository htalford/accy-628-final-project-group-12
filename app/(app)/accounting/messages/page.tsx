"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

type Thread = {
  id: string;
  name: string;
  role: string;
  preview: string;
  messages: { id: string; from: "them" | "me"; text: string; at: string }[];
};

const THREADS: Thread[] = [
  {
    id: "t1",
    name: "Morgan Recruiter",
    role: "Recruiter",
    preview: "Can we invoice Acme for last week?",
    messages: [
      {
        id: "m1",
        from: "them",
        text: "Can we invoice Acme for last week? Timesheets are approved.",
        at: "9:12 AM",
      },
      {
        id: "m2",
        from: "me",
        text: "Yes — I'll generate the invoice after AR review.",
        at: "9:18 AM",
      },
    ],
  },
  {
    id: "t2",
    name: "Casey Employer",
    role: "Employer",
    preview: "Payment scheduled for Friday",
    messages: [
      {
        id: "m3",
        from: "them",
        text: "Payment for invoice is scheduled for Friday.",
        at: "Yesterday",
      },
      {
        id: "m4",
        from: "me",
        text: "Thanks — we'll mark it when the payment posts.",
        at: "Yesterday",
      },
    ],
  },
  {
    id: "t3",
    name: "Jordan Lee",
    role: "Candidate",
    preview: "Question about overtime pay",
    messages: [
      {
        id: "m5",
        from: "them",
        text: "Will OT show on this week's payroll?",
        at: "Mon",
      },
      {
        id: "m6",
        from: "me",
        text: "Yes if the timesheet is approved before the cutoff.",
        at: "Mon",
      },
    ],
  },
];

export default function MessagesPage() {
  const [activeId, setActiveId] = useState(THREADS[0].id);
  const [draft, setDraft] = useState("");
  const [threads, setThreads] = useState(THREADS);

  const active = useMemo(
    () => threads.find((t) => t.id === activeId) ?? threads[0],
    [threads, activeId],
  );

  function send() {
    if (!draft.trim()) return;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === active.id
          ? {
              ...t,
              preview: draft.trim(),
              messages: [
                ...t.messages,
                {
                  id: `local-${Date.now()}`,
                  from: "me" as const,
                  text: draft.trim(),
                  at: "Just now",
                },
              ],
            }
          : t,
      ),
    );
    setDraft("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Sample conversations with recruiters and clients (local UI until a messages table exists)."
      />

      <div className="grid min-h-[28rem] overflow-hidden rounded-xl border border-[var(--cf-border)] bg-white shadow-sm lg:grid-cols-[16rem_1fr]">
        <aside className="border-b border-[var(--cf-border)] lg:border-r lg:border-b-0">
          <ul>
            {threads.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  className={`w-full border-b border-[var(--cf-border)] px-4 py-3 text-left hover:bg-[var(--cf-surface)] ${
                    t.id === active.id ? "bg-[var(--cf-surface)]" : ""
                  }`}
                >
                  <p className="text-sm font-semibold text-[var(--cf-ink)]">
                    {t.name}
                  </p>
                  <p className="text-xs text-[var(--cf-muted)]">{t.role}</p>
                  <p className="mt-1 truncate text-xs text-[var(--cf-muted)]">
                    {t.preview}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex flex-col">
          <div className="border-b border-[var(--cf-border)] px-4 py-3">
            <p className="text-sm font-semibold">{active.name}</p>
            <p className="text-xs text-[var(--cf-muted)]">{active.role}</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {active.messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.from === "me"
                    ? "ml-auto bg-[var(--cf-navy)] text-white"
                    : "bg-[var(--cf-surface)] text-[var(--cf-ink)]"
                }`}
              >
                <p>{m.text}</p>
                <p
                  className={`mt-1 text-[10px] ${
                    m.from === "me" ? "text-white/70" : "text-[var(--cf-muted)]"
                  }`}
                >
                  {m.at}
                </p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-[var(--cf-border)] p-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Write a message…"
              className="flex-1 rounded-md border border-[var(--cf-border)] px-3 py-2 text-sm outline-none ring-[var(--cf-accent)] focus:ring-2"
            />
            <Button type="button" onClick={send}>
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
