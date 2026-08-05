"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  MessageSquare,
  UserX,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { RecruiterCandidate } from "@/lib/recruiter/types";
import type { ApplicationStatus } from "@/lib/types/database";
import {
  approveApplication,
  rejectApplication,
  scheduleInterview,
  sendRecruiterMessage,
  updateApplicationStatus,
} from "@/app/actions/recruiter";

export function CandidateDetail({
  candidate,
}: {
  candidate: RecruiterCandidate;
}) {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showSchedule, setShowSchedule] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  const approved =
    candidate.applicationStatus === "reviewing" ||
    candidate.status === "Approved" ||
    candidate.status === "Client Review" ||
    candidate.status === "Interview Scheduled" ||
    candidate.status === "Offer Sent" ||
    candidate.status === "Hired";
  const applicationId = candidate.applicationId ?? candidate.id;

  function run(
    action: () => Promise<{ ok: boolean; error?: string; message?: string }>,
  ) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Something went wrong");
      else {
        setNotice(result.message ?? "Saved");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {notice ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {notice}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 rounded-xl border border-[var(--cf-border)] bg-white p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--cf-navy)]/10 text-lg font-semibold text-[var(--cf-navy)]">
            {candidate.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[var(--cf-ink)]">
              {candidate.name}
            </h2>
            <p className="text-sm text-[var(--cf-muted)]">
              {candidate.positionApplied} · {candidate.location}
            </p>
            <div className="mt-2">
              <StatusBadge status={candidate.status} />
            </div>
            <p className="mt-2 text-sm text-[var(--cf-muted)]">
              {candidate.email} · {candidate.phone}
              {candidate.source === "employer_submittal" ? (
                <span className="ml-2 rounded-full bg-[var(--cf-accent)]/15 px-2 py-0.5 text-xs font-medium text-[var(--cf-navy)]">
                  Employer submittal
                </span>
              ) : null}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton
            icon={<CalendarPlus className="h-4 w-4" />}
            label="Schedule Interview"
            disabled={pending}
            onClick={() => setShowSchedule(true)}
          />
          <ActionButton
            icon={<FileText className="h-4 w-4" />}
            label="Update Status"
            disabled={pending}
            onClick={() => setShowStatus(true)}
          />
          <ActionButton
            icon={<MessageSquare className="h-4 w-4" />}
            label="Send Message"
            disabled={pending}
            onClick={() => setShowMessage(true)}
          />
          <ActionButton
            icon={<UserX className="h-4 w-4" />}
            label="Reject Candidate"
            danger
            disabled={
              pending ||
              candidate.applicationStatus === "rejected" ||
              candidate.status === "Rejected"
            }
            onClick={() => run(() => rejectApplication(applicationId))}
          />
          {!approved ? (
            <ActionButton
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Approve Application"
              primary
              disabled={pending}
              onClick={() => run(() => approveApplication(applicationId))}
            />
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              Approved
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Resume">
          {candidate.resumeUrl ? (
            <div className="space-y-3">
              <div className="flex h-32 items-center justify-center rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] text-sm text-[var(--cf-muted)]">
                Candidate resume attached
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={candidate.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--cf-navy)] px-3 py-2 text-xs font-medium text-white hover:bg-[var(--cf-navy-hover)]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View
                </a>
                <a
                  href={candidate.resumeUrl}
                  download
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cf-border)] px-3 py-2 text-xs font-medium text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              </div>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-[var(--cf-border)] bg-[var(--cf-surface)] text-sm text-[var(--cf-muted)]">
              No resume uploaded yet
            </div>
          )}
        </Card>
        <Card title="Skills">
          <div className="flex flex-wrap gap-2">
            {candidate.skills.length ? (
              candidate.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-[var(--cf-accent)]/10 px-2.5 py-1 text-xs font-medium text-[var(--cf-accent)]"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-sm text-[var(--cf-muted)]">No skills listed.</p>
            )}
          </div>
        </Card>
        <Card title="Experience & Education">
          <p className="text-sm text-[var(--cf-ink)]">
            {candidate.experienceYears} years experience
          </p>
          <p className="mt-2 text-sm text-[var(--cf-muted)]">
            {candidate.education}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Notes">
          <p className="text-sm text-[var(--cf-ink)] whitespace-pre-wrap">
            {candidate.notes}
          </p>
          <p className="mt-3 text-xs text-[var(--cf-muted)]">
            Recruiter: {candidate.recruiter} · Updated {candidate.lastUpdated}
          </p>
          {candidate.jobId ? (
            <Link
              href={`/recruiter/job-orders/${candidate.jobId}`}
              className="mt-3 inline-block text-xs font-medium text-[var(--cf-accent)] hover:underline"
            >
              View related job order
            </Link>
          ) : null}
        </Card>
        <Card title="Interview History">
          {candidate.interviewHistory.length === 0 ? (
            <p className="text-sm text-[var(--cf-muted)]">No interviews yet.</p>
          ) : (
            <ul className="space-y-3">
              {candidate.interviewHistory.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-[var(--cf-border)] px-3 py-2"
                >
                  <p className="text-sm font-medium text-[var(--cf-ink)]">
                    {item.date} · {item.type}
                  </p>
                  <p className="text-xs text-[var(--cf-muted)]">{item.outcome}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {showSchedule ? (
        <ScheduleModal
          disabled={pending}
          onClose={() => setShowSchedule(false)}
          onSubmit={(values) => {
            setShowSchedule(false);
            run(() =>
              scheduleInterview({
                applicationId,
                datetime: values.datetime,
                interviewType: values.type,
                notes: values.notes,
              }),
            );
          }}
        />
      ) : null}

      {showStatus ? (
        <StatusModal
          disabled={pending}
          current={candidate.applicationStatus ?? "submitted"}
          onClose={() => setShowStatus(false)}
          onSubmit={(status) => {
            setShowStatus(false);
            run(() => updateApplicationStatus(applicationId, status));
          }}
        />
      ) : null}

      {showMessage ? (
        <MessageModal
          disabled={pending}
          candidateName={candidate.name}
          onClose={() => setShowMessage(false)}
          onSubmit={(values) => {
            setShowMessage(false);
            run(() =>
              sendRecruiterMessage({
                employeeId: candidate.employeeId,
                subject: values.subject,
                body: values.body,
              }),
            );
          }}
        />
      ) : null}
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-[var(--cf-ink)]">{title}</h3>
      {children}
    </section>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  danger,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition disabled:opacity-50 ${
        primary
          ? "border-[var(--cf-accent)] bg-[var(--cf-accent)] text-white hover:opacity-90"
          : danger
            ? "border-rose-200 text-rose-700 hover:bg-rose-50"
            : "border-[var(--cf-border)] text-[var(--cf-ink)] hover:bg-[var(--cf-surface)]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ScheduleModal({
  onClose,
  onSubmit,
  disabled,
}: {
  onClose: () => void;
  onSubmit: (v: { datetime: string; type: string; notes: string }) => void;
  disabled?: boolean;
}) {
  const [datetime, setDatetime] = useState("");
  const [type, setType] = useState("Virtual");
  const [notes, setNotes] = useState("");

  return (
    <Modal title="Schedule Interview" onClose={onClose}>
      <label className="block text-xs font-medium text-[var(--cf-muted)]">
        Date & time
        <input
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm"
        />
      </label>
      <label className="mt-3 block text-xs font-medium text-[var(--cf-muted)]">
        Interview type
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm"
        >
          <option>Virtual</option>
          <option>Phone</option>
          <option>In Person</option>
        </select>
      </label>
      <label className="mt-3 block text-xs font-medium text-[var(--cf-muted)]">
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm"
        />
      </label>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm">
          Cancel
        </button>
        <button
          type="button"
          disabled={disabled || !datetime}
          onClick={() =>
            onSubmit({
              datetime: new Date(datetime).toISOString(),
              type,
              notes,
            })
          }
          className="rounded-lg bg-[var(--cf-navy)] px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          Schedule
        </button>
      </div>
    </Modal>
  );
}

function formatApplicationStatusLabel(status: ApplicationStatus): string {
  if (status === "reviewing") return "Approved";
  return status
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function StatusModal({
  current,
  onClose,
  onSubmit,
  disabled,
}: {
  current: ApplicationStatus;
  onClose: () => void;
  onSubmit: (status: ApplicationStatus) => void;
  disabled?: boolean;
}) {
  const [status, setStatus] = useState<ApplicationStatus>(current);
  const options: ApplicationStatus[] = useMemo(
    () => ["submitted", "reviewing", "interview", "offered", "rejected", "withdrawn"],
    [],
  );

  return (
    <Modal title="Update Status" onClose={onClose}>
      <label className="block text-xs font-medium text-[var(--cf-muted)]">
        Application status
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
          className="mt-1 w-full rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {formatApplicationStatusLabel(o)}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm">
          Cancel
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSubmit(status)}
          className="rounded-lg bg-[var(--cf-navy)] px-3 py-2 text-sm text-white"
        >
          Save
        </button>
      </div>
    </Modal>
  );
}

function MessageModal({
  candidateName,
  onClose,
  onSubmit,
  disabled,
}: {
  candidateName: string;
  onClose: () => void;
  onSubmit: (v: { subject: string; body: string }) => void;
  disabled?: boolean;
}) {
  const [subject, setSubject] = useState(`Message for ${candidateName}`);
  const [body, setBody] = useState("");

  return (
    <Modal title="Send Message" onClose={onClose}>
      <label className="block text-xs font-medium text-[var(--cf-muted)]">
        Subject
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm"
        />
      </label>
      <label className="mt-3 block text-xs font-medium text-[var(--cf-muted)]">
        Message
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-[var(--cf-border)] px-3 py-2 text-sm"
        />
      </label>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm">
          Cancel
        </button>
        <button
          type="button"
          disabled={disabled || !body.trim()}
          onClick={() => onSubmit({ subject, body })}
          className="rounded-lg bg-[var(--cf-navy)] px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--cf-border)] bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--cf-ink)]">{title}</h3>
          <button type="button" onClick={onClose} className="text-sm text-[var(--cf-muted)]">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
