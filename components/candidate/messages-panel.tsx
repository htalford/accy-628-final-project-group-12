"use client";

import { useState, useTransition } from "react";
import {
  markMessageRead,
  sendCandidateMessage,
} from "@/app/actions/candidate";
import type { Message } from "@/lib/types/database";
import { formatDate } from "@/lib/candidate/format";

export function MessagesPanel({ messages }: { messages: Message[] }) {
  const [selectedId, setSelectedId] = useState(messages[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = messages.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="overflow-hidden rounded-xl border border-[var(--cf-border)] bg-white">
        <ul className="divide-y divide-[var(--cf-border)]">
          {messages.length === 0 ? (
            <li className="px-4 py-6 text-sm text-[var(--cf-muted)]">
              No messages yet.
            </li>
          ) : (
            messages.map((message) => (
              <li key={message.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(message.id);
                    if (!message.is_read) {
                      startTransition(async () => {
                        await markMessageRead(message.id);
                      });
                    }
                  }}
                  className={`flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-[var(--cf-surface)] ${
                    selectedId === message.id ? "bg-[var(--cf-surface)]" : ""
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {message.subject}
                    </span>
                    {!message.is_read ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--cf-accent)]" />
                    ) : null}
                  </span>
                  <span className="text-xs text-[var(--cf-muted)]">
                    {message.sender_name} · {formatDate(message.created_at)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--cf-border)] bg-white p-5 shadow-sm">
          {selected ? (
            <>
              <p className="text-xs text-[var(--cf-muted)] uppercase">
                {selected.sender_role}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{selected.subject}</h3>
              <p className="mt-1 text-xs text-[var(--cf-muted)]">
                From {selected.sender_name} · {formatDate(selected.created_at)}
              </p>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[var(--cf-ink)]">
                {selected.body}
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--cf-muted)]">
              Select a message to read it.
            </p>
          )}
        </div>

        <form
          className="rounded-xl border border-[var(--cf-border)] bg-white p-5 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            setNotice(null);
            startTransition(async () => {
              const result = await sendCandidateMessage({ subject, body });
              if (result.ok) {
                setSubject("");
                setBody("");
                setNotice("Message sent to your TalentQuest inbox.");
              } else {
                setNotice(result.error);
              }
            });
          }}
        >
          <h3 className="mb-3 text-sm font-semibold">Send a message</h3>
          <div className="grid gap-3">
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="rounded-md border border-[var(--cf-border)] px-3 py-2 text-sm"
            />
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message…"
              rows={4}
              className="rounded-md border border-[var(--cf-border)] px-3 py-2 text-sm"
            />
            {notice ? (
              <p className="text-sm text-[var(--cf-muted)]">{notice}</p>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className="w-fit rounded-md bg-[var(--cf-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--cf-navy-hover)] disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
