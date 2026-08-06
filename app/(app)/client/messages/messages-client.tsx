"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Label, FieldInput } from "@/components/ui/form";
import { ConfirmActionDialog } from "@/components/client-portal/confirm-action-dialog";
import { useToast } from "@/components/client-portal/toast";
import {
  createClientMessageThreadAction,
  deleteClientMessageThreadAction,
  sendClientMessageAction,
} from "@/app/actions/client-portal";
import type { ClientMessageThread } from "@/lib/types/database";

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(0, 16);
  }
}

export function MessagesClient({
  initial,
}: {
  initial: ClientMessageThread[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [threads, setThreads] = useState(initial);
  const [activeId, setActiveId] = useState(initial[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    setThreads(initial);
    if (initial.length && !initial.some((t) => t.id === activeId)) {
      setActiveId(initial[0].id);
    }
    if (!initial.length) setActiveId("");
  }, [initial, activeId]);

  const active = threads.find((t) => t.id === activeId) ?? threads[0];

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !active) return;
    const body = draft.trim();
    const result = await sendClientMessageAction(active.id, body);
    if (!result.ok) {
      toast.push(result.message, "error");
      return;
    }
    toast.push(result.message, "success");
    setDraft("");
    const now = new Date().toISOString();
    setThreads((prev) =>
      prev.map((t) =>
        t.id === active.id
          ? {
              ...t,
              preview: body.slice(0, 64),
              updated_at: now,
              messages: [
                ...(t.messages ?? []),
                {
                  id: `local-${Date.now()}`,
                  thread_id: t.id,
                  sender_role: "client" as const,
                  body,
                  created_at: now,
                },
              ],
            }
          : t,
      ),
    );
    startTransition(() => router.refresh());
  }

  async function startConversation(e: FormEvent) {
    e.preventDefault();
    const result = await createClientMessageThreadAction({
      subject: newSubject,
      body: newBody,
    });
    if (!result.ok) {
      toast.push(result.message, "error");
      return;
    }
    toast.push(result.message, "success");
    const now = new Date().toISOString();
    const id = result.id ?? `local-${Date.now()}`;
    const thread: ClientMessageThread = {
      id,
      client_id: "",
      subject: newSubject.trim(),
      recruiter_name: "Morgan Recruiter",
      created_at: now,
      updated_at: now,
      preview: newBody.trim().slice(0, 64),
      messages: [
        {
          id: `local-msg-${Date.now()}`,
          thread_id: id,
          sender_role: "client",
          body: newBody.trim(),
          created_at: now,
        },
      ],
    };
    setThreads((prev) => [thread, ...prev]);
    setActiveId(id);
    setNewSubject("");
    setNewBody("");
    setShowNew(false);
    startTransition(() => router.refresh());
  }

  async function confirmDelete() {
    if (!active) return;
    const deletedId = active.id;
    startTransition(async () => {
      const result = await deleteClientMessageThreadAction(deletedId);
      if (!result.ok) {
        toast.push(result.message, "error");
        return;
      }
      toast.push(result.message, "success");
      setDeleteOpen(false);
      setDraft("");
      setThreads((prev) => {
        const next = prev.filter((t) => t.id !== deletedId);
        setActiveId(next[0]?.id ?? "");
        return next;
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Messages"
          description="Conversations with your TalentQuest recruiters (client_messages — separate from the candidate portal inbox)."
        />
        <Button type="button" onClick={() => setShowNew((v) => !v)}>
          {showNew ? "Cancel" : "New conversation"}
        </Button>
      </div>

      {showNew ? (
        <form
          onSubmit={(e) => void startConversation(e)}
          className="space-y-3 rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm"
        >
          <div>
            <Label htmlFor="new-subject">Subject</Label>
            <FieldInput
              id="new-subject"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="e.g. Warehouse Associate - interview times"
              required
            />
          </div>
          <div>
            <Label htmlFor="new-body">Message</Label>
            <textarea
              id="new-body"
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              required
              rows={3}
              placeholder="Write your first message…"
              className="mt-1 w-full rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm focus:border-[var(--cf-navy)] focus:ring-2 focus:ring-[var(--cf-navy)]/15 focus:outline-none"
            />
          </div>
          <Button type="submit" disabled={pending}>
            Start conversation
          </Button>
        </form>
      ) : null}

      {threads.length === 0 && !showNew ? (
        <EmptyState
          title="No conversations yet"
          description="Start a conversation with your recruiter, or wait for them to open a thread about placements or job requests."
        />
      ) : threads.length > 0 ? (
        <div className="grid min-h-[28rem] overflow-hidden rounded-xl border border-[var(--cf-border)] bg-white shadow-sm lg:grid-cols-[280px_1fr]">
          <aside className="border-b border-[var(--cf-border)] lg:border-r lg:border-b-0">
            <p className="border-b border-[var(--cf-border)] px-4 py-3 text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
              Conversations
            </p>
            <ul>
              {threads.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(t.id)}
                    className={`flex w-full flex-col gap-0.5 border-b border-[var(--cf-border)] px-4 py-3 text-left transition hover:bg-[var(--cf-surface)] ${
                      t.id === active?.id ? "bg-[var(--cf-surface)]" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[var(--cf-ink)]">
                        {t.recruiter_name}
                      </span>
                    </div>
                    <span className="truncate text-xs text-[var(--cf-muted)]">
                      {t.subject || t.preview}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <section className="flex min-h-[20rem] flex-col">
            {active ? (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-[var(--cf-border)] px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--cf-ink)]">
                      {active.recruiter_name}
                    </p>
                    {active.subject ? (
                      <p className="text-xs text-[var(--cf-muted)]">
                        {active.subject}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    disabled={pending}
                    onClick={() => setDeleteOpen(true)}
                    title="Delete conversation"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Delete
                  </Button>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {(active.messages ?? []).map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.sender_role === "client" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                          m.sender_role === "client"
                            ? "bg-[var(--cf-navy)] text-white"
                            : "bg-[var(--cf-surface)] text-[var(--cf-ink)]"
                        }`}
                      >
                        <p
                          className={`mb-1 text-[10px] font-medium ${
                            m.sender_role === "client"
                              ? "text-white/80"
                              : "text-[var(--cf-muted)]"
                          }`}
                        >
                          {m.sender_role === "staff"
                            ? "Accounting"
                            : m.sender_role === "recruiter"
                              ? "Recruiter"
                              : "You"}
                        </p>
                        <p>{m.body}</p>
                        <p
                          className={`mt-1 text-[10px] ${
                            m.sender_role === "client"
                              ? "text-white/70"
                              : "text-[var(--cf-muted)]"
                          }`}
                        >
                          {formatWhen(m.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={(e) => void send(e)}
                  className="flex gap-2 border-t border-[var(--cf-border)] p-3"
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a message…"
                    disabled={pending}
                    className="min-w-0 flex-1 rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm focus:border-[var(--cf-navy)] focus:ring-2 focus:ring-[var(--cf-navy)]/15 focus:outline-none"
                  />
                  <Button type="submit" disabled={pending || !draft.trim()}>
                    Send
                  </Button>
                </form>
              </>
            ) : (
              <p className="p-6 text-sm text-[var(--cf-muted)]">
                Select a conversation.
              </p>
            )}
          </section>
        </div>
      ) : null}

      <ConfirmActionDialog
        open={deleteOpen && active != null}
        onClose={() => setDeleteOpen(false)}
        title="Delete conversation?"
        description={
          active
            ? `Remove “${active.subject || "this conversation"}” with ${active.recruiter_name}? This permanently deletes the thread and all messages.`
            : ""
        }
        confirmLabel="Delete conversation"
        confirmVariant="danger"
        requireReason={false}
        showReason={false}
        busy={pending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
