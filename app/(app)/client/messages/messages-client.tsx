"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore, FolderOpen, Inbox, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Label, FieldInput } from "@/components/ui/form";
import { ConfirmActionDialog } from "@/components/client-portal/confirm-action-dialog";
import { useToast } from "@/components/client-portal/toast";
import {
  createClientMessageThreadAction,
  deleteClientMessageThreadAction,
  permanentlyDeleteClientMessageThreadAction,
  restoreClientMessageThreadAction,
  sendClientMessageAction,
} from "@/app/actions/client-portal";
import { daysLeftInDeletedFolder } from "@/lib/client-portal/message-retention";
import type { ClientMessageThread } from "@/lib/types/database";

type Folder = "inbox" | "deleted";

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
  initialInbox,
  initialDeleted,
}: {
  initialInbox: ClientMessageThread[];
  initialDeleted: ClientMessageThread[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [folder, setFolder] = useState<Folder>("inbox");
  const [inbox, setInbox] = useState(initialInbox);
  const [deleted, setDeleted] = useState(initialDeleted);
  const [activeId, setActiveId] = useState(initialInbox[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [confirmKind, setConfirmKind] = useState<"soft" | "permanent" | null>(
    null,
  );

  useEffect(() => {
    setInbox(initialInbox);
    setDeleted(initialDeleted);
  }, [initialInbox, initialDeleted]);

  const threads = folder === "inbox" ? inbox : deleted;

  useEffect(() => {
    if (threads.length === 0) {
      setActiveId("");
      return;
    }
    if (!threads.some((t) => t.id === activeId)) {
      setActiveId(threads[0].id);
    }
  }, [folder, threads, activeId]);

  const active = useMemo(
    () => threads.find((t) => t.id === activeId) ?? threads[0],
    [threads, activeId],
  );

  function switchFolder(next: Folder) {
    setFolder(next);
    setShowNew(false);
    setDraft("");
    setConfirmKind(null);
    const list = next === "inbox" ? inbox : deleted;
    setActiveId(list[0]?.id ?? "");
  }

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
    const sentMsg = {
      id: `local-${Date.now()}`,
      thread_id: active.id,
      sender_role: "client" as const,
      body,
      created_at: now,
    };
    if (folder === "deleted") {
      // Reply restores to inbox
      setDeleted((prev) => prev.filter((t) => t.id !== active.id));
      setInbox((prev) => {
        const rest = prev.filter((t) => t.id !== active.id);
        const updated: ClientMessageThread = {
          ...active,
          deleted_at: null,
          preview: body.slice(0, 64),
          updated_at: now,
          messages: [...(active.messages ?? []), sentMsg],
        };
        return [updated, ...rest];
      });
      setFolder("inbox");
      setActiveId(active.id);
    } else {
      setInbox((prev) =>
        prev.map((t) =>
          t.id === active.id
            ? {
                ...t,
                preview: body.slice(0, 64),
                updated_at: now,
                messages: [...(t.messages ?? []), sentMsg],
              }
            : t,
        ),
      );
    }
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
      deleted_at: null,
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
    setInbox((prev) => [thread, ...prev]);
    setFolder("inbox");
    setActiveId(id);
    setNewSubject("");
    setNewBody("");
    setShowNew(false);
    startTransition(() => router.refresh());
  }

  async function confirmSoftDelete() {
    if (!active) return;
    const deletedId = active.id;
    startTransition(async () => {
      const result = await deleteClientMessageThreadAction(deletedId);
      if (!result.ok) {
        toast.push(result.message, "error");
        return;
      }
      toast.push(result.message, "success");
      setConfirmKind(null);
      setDraft("");
      const now = new Date().toISOString();
      const thread = inbox.find((t) => t.id === deletedId);
      setInbox((prev) => {
        const next = prev.filter((t) => t.id !== deletedId);
        return next;
      });
      if (thread) {
        setDeleted((prev) => [
          { ...thread, deleted_at: now, updated_at: now },
          ...prev.filter((t) => t.id !== deletedId),
        ]);
      }
      setActiveId((id) => {
        if (id !== deletedId) return id;
        const rest = inbox.filter((t) => t.id !== deletedId);
        return rest[0]?.id ?? "";
      });
      router.refresh();
    });
  }

  async function confirmRestore() {
    if (!active) return;
    const id = active.id;
    startTransition(async () => {
      const result = await restoreClientMessageThreadAction(id);
      if (!result.ok) {
        toast.push(result.message, "error");
        return;
      }
      toast.push(result.message, "success");
      setConfirmKind(null);
      const thread = deleted.find((t) => t.id === id);
      setDeleted((prev) => prev.filter((t) => t.id !== id));
      if (thread) {
        setInbox((prev) => [
          { ...thread, deleted_at: null },
          ...prev.filter((t) => t.id !== id),
        ]);
      }
      setFolder("inbox");
      setActiveId(id);
      router.refresh();
    });
  }

  async function confirmPermanentDelete() {
    if (!active) return;
    const deletedId = active.id;
    startTransition(async () => {
      const result =
        await permanentlyDeleteClientMessageThreadAction(deletedId);
      if (!result.ok) {
        toast.push(result.message, "error");
        return;
      }
      toast.push(result.message, "success");
      setConfirmKind(null);
      setDeleted((prev) => {
        const next = prev.filter((t) => t.id !== deletedId);
        setActiveId(next[0]?.id ?? "");
        return next;
      });
      router.refresh();
    });
  }

  const emptyInbox = folder === "inbox" && inbox.length === 0 && !showNew;
  const emptyDeleted = folder === "deleted" && deleted.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Messages"
          description="Conversations with your TalentQuest recruiters. Deleted items stay in Deleted for 30 days."
        />
        {folder === "inbox" ? (
          <Button type="button" onClick={() => setShowNew((v) => !v)}>
            {showNew ? "Cancel" : "New conversation"}
          </Button>
        ) : null}
      </div>

      {showNew && folder === "inbox" ? (
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

      {emptyInbox || emptyDeleted ? (
        <div className="space-y-4">
          <div className="max-w-sm">
            <FolderToggle
              folder={folder}
              deletedCount={deleted.length}
              onChange={switchFolder}
            />
          </div>
          {emptyInbox ? (
            <EmptyState
              title="No conversations yet"
              description="Start a conversation with your recruiter, or open the Deleted folder to find conversations you removed in the last 30 days."
            />
          ) : (
            <EmptyState
              title="Deleted is empty"
              description="Conversations you remove are kept here for 30 days so you can restore them."
            />
          )}
        </div>
      ) : null}

      {!emptyInbox && !emptyDeleted && threads.length > 0 ? (
        <div className="grid min-h-[28rem] overflow-hidden rounded-xl border border-[var(--cf-border)] bg-white shadow-sm lg:grid-cols-[280px_1fr]">
          <aside className="flex flex-col border-b border-[var(--cf-border)] lg:border-r lg:border-b-0">
            <div className="border-b border-[var(--cf-border)] px-3 py-3">
              <FolderToggle
                folder={folder}
                deletedCount={deleted.length}
                onChange={switchFolder}
              />
              <p className="mt-3 text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
                {folder === "deleted" ? "Deleted (30 days)" : "Conversations"}
              </p>
            </div>
            <ul className="flex-1 overflow-y-auto">
              {threads.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(t.id)}
                    className={`flex w-full flex-col gap-0.5 border-b border-[var(--cf-border)] px-4 py-3 text-left transition hover:bg-[var(--cf-surface)] ${
                      t.id === active?.id ? "bg-[var(--cf-surface)]" : ""
                    }`}
                  >
                    <span className="text-sm font-medium text-[var(--cf-ink)]">
                      {t.recruiter_name}
                    </span>
                    <span className="truncate text-xs text-[var(--cf-muted)]">
                      {t.subject || t.preview}
                    </span>
                    {folder === "deleted" && t.deleted_at ? (
                      <span className="text-[10px] text-[var(--cf-muted)]">
                        {daysLeftInDeletedFolder(t.deleted_at)} day
                        {daysLeftInDeletedFolder(t.deleted_at) === 1 ? "" : "s"}{" "}
                        left
                      </span>
                    ) : null}
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
                    {folder === "deleted" && active.deleted_at ? (
                      <p className="mt-0.5 text-[11px] text-amber-800">
                        Deleted · {daysLeftInDeletedFolder(active.deleted_at)}{" "}
                        day
                        {daysLeftInDeletedFolder(active.deleted_at) === 1
                          ? ""
                          : "s"}{" "}
                        remaining
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {folder === "inbox" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        disabled={pending}
                        onClick={() => setConfirmKind("soft")}
                        title="Move to Deleted"
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                        Delete
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={pending}
                          onClick={() => void confirmRestore()}
                          title="Restore to Inbox"
                        >
                          <ArchiveRestore
                            className="mr-1.5 h-3.5 w-3.5"
                            aria-hidden
                          />
                          Restore
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          disabled={pending}
                          onClick={() => setConfirmKind("permanent")}
                          title="Delete permanently"
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                          Delete forever
                        </Button>
                      </>
                    )}
                  </div>
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
                {folder === "inbox" ? (
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
                ) : (
                  <div className="border-t border-[var(--cf-border)] px-4 py-3 text-xs text-[var(--cf-muted)]">
                    Restore this conversation to reply, or delete it forever.
                    After 30 days it leaves Deleted automatically.
                  </div>
                )}
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
        open={confirmKind === "soft" && active != null}
        onClose={() => setConfirmKind(null)}
        title="Move to Deleted?"
        description={
          active
            ? `“${active.subject || "This conversation"}” with ${active.recruiter_name} will move to the Deleted folder for 30 days. You can restore it anytime during that window.`
            : ""
        }
        confirmLabel="Move to Deleted"
        confirmVariant="danger"
        requireReason={false}
        showReason={false}
        busy={pending}
        onConfirm={() => void confirmSoftDelete()}
      />

      <ConfirmActionDialog
        open={confirmKind === "permanent" && active != null}
        onClose={() => setConfirmKind(null)}
        title="Delete permanently?"
        description={
          active
            ? `Permanently remove “${active.subject || "this conversation"}” and all messages. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete forever"
        confirmVariant="danger"
        requireReason={false}
        showReason={false}
        busy={pending}
        onConfirm={() => void confirmPermanentDelete()}
      />
    </div>
  );
}

function FolderToggle({
  folder,
  deletedCount,
  onChange,
}: {
  folder: Folder;
  deletedCount: number;
  onChange: (folder: Folder) => void;
}) {
  return (
    <div className="flex rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] p-0.5">
      <button
        type="button"
        onClick={() => onChange("inbox")}
        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition ${
          folder === "inbox"
            ? "bg-white text-[var(--cf-ink)] shadow-sm"
            : "text-[var(--cf-muted)] hover:text-[var(--cf-ink)]"
        }`}
      >
        <Inbox className="h-3.5 w-3.5" aria-hidden />
        Inbox
      </button>
      <button
        type="button"
        onClick={() => onChange("deleted")}
        className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition ${
          folder === "deleted"
            ? "bg-white text-[var(--cf-ink)] shadow-sm"
            : "text-[var(--cf-muted)] hover:text-[var(--cf-ink)]"
        }`}
      >
        <FolderOpen className="h-3.5 w-3.5" aria-hidden />
        Deleted
        {deletedCount > 0 ? (
          <span className="text-[10px] font-medium text-[var(--cf-muted)]">
            ({deletedCount})
          </span>
        ) : null}
      </button>
    </div>
  );
}
