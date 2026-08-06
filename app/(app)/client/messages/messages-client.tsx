"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/form";
import { useToast } from "@/components/client-portal/toast";
import {
  createClientMessageThreadAction,
  deleteClientMessageThreadAction,
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
  folder,
}: {
  initialInbox: ClientMessageThread[];
  initialDeleted: ClientMessageThread[];
  folder: Folder;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [inbox, setInbox] = useState(initialInbox);
  const [deleted, setDeleted] = useState(initialDeleted);
  const [activeId, setActiveId] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [listQuery, setListQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newContact, setNewContact] = useState("Morgan Recruiter");
  const [newBody, setNewBody] = useState("");

  useEffect(() => {
    setInbox(initialInbox);
    setDeleted(initialDeleted);
  }, [initialInbox, initialDeleted]);

  useEffect(() => {
    setSelectedIds(new Set());
    setDraft("");
    setShowNew(false);
    setListQuery("");
  }, [folder]);

  const threads = folder === "inbox" ? inbox : deleted;

  const filteredList = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => {
      const hay = [
        t.recruiter_name,
        t.preview,
        t.subject,
        ...(t.messages ?? []).map((m) => m.body),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [threads, listQuery]);

  useEffect(() => {
    if (filteredList.length === 0) {
      setActiveId("");
      return;
    }
    setActiveId((prev) =>
      filteredList.some((t) => t.id === prev) ? prev : filteredList[0]!.id,
    );
  }, [filteredList]);

  const active = useMemo(
    () => filteredList.find((t) => t.id === activeId) ?? filteredList[0],
    [filteredList, activeId],
  );

  function setFolder(next: Folder) {
    const params = new URLSearchParams();
    if (next === "deleted") params.set("folder", "deleted");
    router.replace(
      params.toString() ? `/client/messages?${params}` : "/client/messages",
      { scroll: false },
    );
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    const visible = filteredList.map((t) => t.id);
    const allSelected =
      visible.length > 0 && visible.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(visible));
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !active || folder === "deleted") return;
    const body = draft.trim();
    const result = await sendClientMessageAction(
      active.id,
      body,
      active.recruiter_name,
    );
    if (!result.ok) {
      toast.push(result.message, "error");
      return;
    }
    toast.push(result.message, "success");
    setDraft("");
    startTransition(() => router.refresh());
  }

  async function startConversation(e: FormEvent) {
    e.preventDefault();
    const contact = newContact.trim() || "Morgan Recruiter";
    const result = await createClientMessageThreadAction({
      body: newBody,
      recruiterName: contact,
    });
    if (!result.ok) {
      toast.push(result.message, "error");
      return;
    }
    toast.push(result.message, "success");
    setNewBody("");
    setShowNew(false);
    startTransition(() => router.refresh());
  }

  function onDeleteThread() {
    if (!active || folder !== "inbox") return;
    startTransition(async () => {
      const result = await deleteClientMessageThreadAction(active.id);
      if (!result.ok) {
        toast.push(result.message, "error");
        return;
      }
      toast.push(result.message, "success");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(active.id);
        return next;
      });
      router.refresh();
    });
  }

  function onDeleteSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    startTransition(async () => {
      for (const id of ids) {
        const result = await deleteClientMessageThreadAction(id);
        if (!result.ok) {
          toast.push(result.message, "error");
          return;
        }
      }
      toast.push(
        ids.length === 1
          ? "Moved conversation to Deleted."
          : `Moved ${ids.length} conversations to Deleted.`,
        "success",
      );
      setSelectedIds(new Set());
      router.refresh();
    });
  }

  function onRestoreThread() {
    if (!active || folder !== "deleted") return;
    startTransition(async () => {
      const result = await restoreClientMessageThreadAction(active.id);
      if (!result.ok) {
        toast.push(result.message, "error");
        return;
      }
      toast.push(result.message, "success");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(active.id);
        return next;
      });
      router.replace("/client/messages", { scroll: false });
      router.refresh();
    });
  }

  function onRestoreSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    startTransition(async () => {
      for (const id of ids) {
        const result = await restoreClientMessageThreadAction(id);
        if (!result.ok) {
          toast.push(result.message, "error");
          return;
        }
      }
      toast.push(
        ids.length === 1
          ? "Restored conversation to Inbox."
          : `Restored ${ids.length} conversations to Inbox.`,
        "success",
      );
      setSelectedIds(new Set());
      router.replace("/client/messages", { scroll: false });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Messages"
          description="Conversations with Recruiter and Manager. Deleted items stay in Deleted for 30 days."
        />
        {folder === "inbox" ? (
          <Button type="button" onClick={() => setShowNew((v) => !v)}>
            {showNew ? "Cancel" : "Message someone"}
          </Button>
        ) : null}
      </div>

      {showNew && folder === "inbox" ? (
        <form
          onSubmit={(e) => void startConversation(e)}
          className="space-y-3 rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm"
        >
          <div>
            <Label htmlFor="new-contact">Who</Label>
            <select
              id="new-contact"
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--cf-border)] bg-white px-3 py-2 text-sm focus:border-[var(--cf-navy)] focus:ring-2 focus:ring-[var(--cf-navy)]/15 focus:outline-none"
            >
              <option value="Morgan Recruiter">Morgan Recruiter</option>
              <option value="Avery Manager">Avery Manager</option>
            </select>
          </div>
          <div>
            <Label htmlFor="new-body">Message</Label>
            <textarea
              id="new-body"
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              required
              rows={3}
              placeholder="Write your message…"
              className="mt-1 w-full rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm focus:border-[var(--cf-navy)] focus:ring-2 focus:ring-[var(--cf-navy)]/15 focus:outline-none"
            />
          </div>
          <Button type="submit" disabled={pending}>
            Send
          </Button>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-[var(--cf-border)] bg-white shadow-sm">
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
                  {deleted.length > 0 ? (
                    <span className="ml-1 text-[10px] text-[var(--cf-muted)]">
                      ({deleted.length})
                    </span>
                  ) : null}
                </button>
              </div>
              <p className="text-[11px] font-semibold tracking-[0.08em] text-[var(--cf-muted)] uppercase">
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
                <div className="flex items-center justify-between gap-2 pt-1">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[var(--cf-muted)]">
                    <input
                      type="checkbox"
                      checked={
                        filteredList.length > 0 &&
                        filteredList.every((t) => selectedIds.has(t.id))
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
                        folder === "deleted"
                          ? onRestoreSelected
                          : onDeleteSelected
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
                      {selectedIds.size})
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
            <ul className="max-h-[24rem] overflow-y-auto">
              {filteredList.map((t) => {
                const isActive = active?.id === t.id;
                return (
                  <li key={t.id}>
                    <div
                      className={`flex w-full items-start gap-2 border-b border-[var(--cf-border)] px-2 py-2.5 hover:bg-[var(--cf-surface)] ${
                        isActive ? "bg-[var(--cf-accent)]/10" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(t.id)}
                        onChange={() => toggleSelected(t.id)}
                        aria-label={`Select ${t.recruiter_name}`}
                        className="mt-2.5 h-3.5 w-3.5 shrink-0 rounded border-[var(--cf-border)]"
                      />
                      <button
                        type="button"
                        onClick={() => setActiveId(t.id)}
                        className="min-w-0 flex-1 py-0.5 text-left"
                      >
                        <p className="text-sm font-medium text-[var(--cf-ink)]">
                          {t.recruiter_name}
                        </p>
                        <p className="truncate text-xs text-[var(--cf-muted)]">
                          {t.preview || "No messages yet"}
                        </p>
                        {folder === "deleted" && t.deleted_at ? (
                          <p className="mt-1 text-[10px] text-[var(--cf-muted)]">
                            {daysLeftInDeletedFolder(t.deleted_at)}d left
                          </p>
                        ) : null}
                      </button>
                    </div>
                  </li>
                );
              })}
              {filteredList.length === 0 ? (
                <li className="px-3 py-8 text-center text-sm text-[var(--cf-muted)]">
                  {folder === "deleted"
                    ? "No deleted conversations in the last 30 days."
                    : "No conversations yet."}
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
                      {active.recruiter_name}
                    </p>
                    <p className="text-xs text-[var(--cf-muted)]">
                      {folder === "deleted" && active.deleted_at
                        ? `Deleted · ${daysLeftInDeletedFolder(active.deleted_at)} day${daysLeftInDeletedFolder(active.deleted_at) === 1 ? "" : "s"} remaining`
                        : `Chat with ${active.recruiter_name}`}
                    </p>
                  </div>
                  {folder === "inbox" ? (
                    <button
                      type="button"
                      onClick={onDeleteThread}
                      disabled={pending}
                      title="Move to Deleted"
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
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cf-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--cf-ink)] transition hover:bg-[var(--cf-accent)]/10 disabled:opacity-50"
                    >
                      <ArchiveRestore className="h-3.5 w-3.5" aria-hidden />
                      Restore
                    </button>
                  )}
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {(active.messages ?? [])
                    .filter((m) => {
                      const person = active.recruiter_name.toLowerCase();
                      const isAccounting =
                        person.includes("account") ||
                        person.includes("manager") ||
                        person.includes("avery");
                      if (m.sender_role === "client") return true;
                      if (isAccounting) return m.sender_role === "staff";
                      return m.sender_role === "recruiter";
                    })
                    .map((m) => (
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
                            {m.sender_role === "client"
                              ? "You"
                              : m.sender_role === "staff"
                                ? "Avery Manager"
                                : "Morgan Recruiter"}
                          </p>
                          <p className="whitespace-pre-wrap">{m.body}</p>
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
                      placeholder={`Message ${active.recruiter_name}…`}
                      disabled={pending}
                      className="min-w-0 flex-1 rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm focus:border-[var(--cf-navy)] focus:ring-2 focus:ring-[var(--cf-navy)]/15 focus:outline-none"
                    />
                    <Button type="submit" disabled={pending || !draft.trim()}>
                      Send
                    </Button>
                  </form>
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
    </div>
  );
}
