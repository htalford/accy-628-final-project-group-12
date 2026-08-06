"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCandidateProfile } from "@/app/actions/candidate";
import type {
  AppUser,
  Employee,
  PreviousEmployment,
} from "@/lib/types/database";

const EMPTY_JOB: PreviousEmployment = {
  company: "",
  title: "",
  startDate: "",
  endDate: "",
  description: "",
};

function normalizeJobs(
  jobs: PreviousEmployment[] | null | undefined,
): PreviousEmployment[] {
  const list = Array.isArray(jobs) ? jobs.slice(0, 3) : [];
  while (list.length < 3) list.push({ ...EMPTY_JOB });
  return list.map((job) => ({
    company: job.company ?? "",
    title: job.title ?? "",
    startDate: job.startDate ?? "",
    endDate: job.endDate ?? "",
    description: job.description ?? "",
  }));
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-[var(--cf-muted)] uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm text-[var(--cf-ink)] whitespace-pre-wrap">
        {value.trim() ? value : "—"}
      </p>
    </div>
  );
}

function formatEmployment(job: PreviousEmployment) {
  if (!job.company.trim() && !job.title.trim()) return "";
  const role = [job.title, job.company].filter((s) => s.trim()).join(" · ");
  const dates = [job.startDate, job.endDate || "Present"]
    .filter((s) => s.trim())
    .join(" – ");
  return [role, dates, job.description].filter((s) => s.trim()).join("\n");
}

export function ProfileForm({
  user,
  employee,
}: {
  user: AppUser;
  employee: Employee;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(employee.first_name);
  const [lastName, setLastName] = useState(employee.last_name);
  const [phone, setPhone] = useState(employee.phone ?? "");
  const [displayName, setDisplayName] = useState(user.name);
  const [certifications, setCertifications] = useState(
    employee.certifications ?? "",
  );
  const [educationBackground, setEducationBackground] = useState(
    employee.education_background ?? "",
  );
  const [employments, setEmployments] = useState(() =>
    normalizeJobs(employee.previous_employments),
  );
  const [resumeUrl, setResumeUrl] = useState(employee.resume_url ?? "");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [removeResume, setRemoveResume] = useState(false);
  const [emergencyContactName, setEmergencyContactName] = useState(
    employee.emergency_contact_name ?? "",
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    employee.emergency_contact_phone ?? "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (editing) return;
    setFirstName(employee.first_name);
    setLastName(employee.last_name);
    setPhone(employee.phone ?? "");
    setDisplayName(user.name);
    setCertifications(employee.certifications ?? "");
    setEducationBackground(employee.education_background ?? "");
    setEmployments(normalizeJobs(employee.previous_employments));
    setResumeUrl(employee.resume_url ?? "");
    setResumeFile(null);
    setRemoveResume(false);
    setEmergencyContactName(employee.emergency_contact_name ?? "");
    setEmergencyContactPhone(employee.emergency_contact_phone ?? "");
  }, [employee, user, editing]);

  function resetFromProps() {
    setFirstName(employee.first_name);
    setLastName(employee.last_name);
    setPhone(employee.phone ?? "");
    setDisplayName(user.name);
    setCertifications(employee.certifications ?? "");
    setEducationBackground(employee.education_background ?? "");
    setEmployments(normalizeJobs(employee.previous_employments));
    setResumeUrl(employee.resume_url ?? "");
    setResumeFile(null);
    setRemoveResume(false);
    setEmergencyContactName(employee.emergency_contact_name ?? "");
    setEmergencyContactPhone(employee.emergency_contact_phone ?? "");
  }

  function updateJob(
    index: number,
    key: keyof PreviousEmployment,
    value: string,
  ) {
    setEmployments((prev) =>
      prev.map((job, i) => (i === index ? { ...job, [key]: value } : job)),
    );
  }

  if (!editing) {
    return (
      <div className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Display name" value={displayName} />
          <Field label="Email" value={employee.email} />
          <Field label="First name" value={firstName} />
          <Field label="Last name" value={lastName} />
          <Field label="Phone" value={phone} />
          <Field
            label="Employment"
            value={`${employee.employment_type} · ${employee.status}`}
          />
          <div className="sm:col-span-2">
            <Field label="Certifications" value={certifications} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Education background" value={educationBackground} />
          </div>
          <div className="sm:col-span-2 space-y-3">
            <p className="text-xs font-medium tracking-wide text-[var(--cf-muted)] uppercase">
              Previous employment
            </p>
            {employments.every(
              (job) => !job.company.trim() && !job.title.trim(),
            ) ? (
              <p className="text-sm text-[var(--cf-ink)]">—</p>
            ) : (
              employments.map((job, index) => {
                const text = formatEmployment(job);
                if (!text) return null;
                return (
                  <div
                    key={index}
                    className="rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] px-3 py-2"
                  >
                    <p className="text-[10px] font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
                      Role {index + 1}
                    </p>
                    <p className="mt-1 text-sm whitespace-pre-wrap text-[var(--cf-ink)]">
                      {text}
                    </p>
                  </div>
                );
              })
            )}
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium tracking-wide text-[var(--cf-muted)] uppercase">
              Resume
            </p>
            {resumeUrl.trim() ? (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex text-sm font-semibold text-[var(--cf-accent)] hover:underline"
              >
                View uploaded resume
              </a>
            ) : (
              <p className="mt-1 text-sm text-[var(--cf-ink)]">—</p>
            )}
          </div>
          <Field label="Emergency contact name" value={emergencyContactName} />
          <Field
            label="Emergency contact phone"
            value={emergencyContactPhone}
          />
        </div>

        <div className="border-t border-[var(--cf-border)] pt-4">
          <button
            type="button"
            onClick={() => {
              setMessage(null);
              setEditing(true);
            }}
            className="rounded-md bg-[var(--cf-navy)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--cf-navy-hover)]"
          >
            Edit profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const data = new FormData();
          data.set("firstName", firstName);
          data.set("lastName", lastName);
          data.set("phone", phone);
          data.set("displayName", displayName);
          data.set("certifications", certifications);
          data.set("educationBackground", educationBackground);
          data.set("previousEmployments", JSON.stringify(employments));
          data.set("emergencyContactName", emergencyContactName);
          data.set("emergencyContactPhone", emergencyContactPhone);
          if (resumeUrl.trim() && !removeResume && !resumeFile) {
            data.set("keepExistingResume", "on");
          }
          if (resumeFile) {
            data.set("resumeFile", resumeFile);
          }
          const result = await updateCandidateProfile(data);
          if (result.ok) {
            setMessage("Profile saved.");
            setResumeFile(null);
            setRemoveResume(false);
            setEditing(false);
            router.refresh();
          } else {
            setMessage(result.error);
          }
        });
      }}
    >
      <div className="grid max-w-xl gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Display name</span>
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-md border border-[var(--cf-border)] px-3 py-2"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">First name</span>
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="rounded-md border border-[var(--cf-border)] px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Last name</span>
            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="rounded-md border border-[var(--cf-border)] px-3 py-2"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Email</span>
          <input
            value={employee.email}
            disabled
            className="rounded-md border border-[var(--cf-border)] bg-[var(--cf-surface)] px-3 py-2 text-[var(--cf-muted)]"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Phone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-md border border-[var(--cf-border)] px-3 py-2"
          />
        </label>

        <div className="border-t border-[var(--cf-border)] pt-4">
          <p className="mb-3 text-sm font-semibold text-[var(--cf-ink)]">
            Profile completion
          </p>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Certifications</span>
            <textarea
              value={certifications}
              onChange={(e) => setCertifications(e.target.value)}
              rows={3}
              placeholder="CPA candidate, QuickBooks, SHRM-CP…"
              className="rounded-md border border-[var(--cf-border)] px-3 py-2"
            />
          </label>

          <label className="mt-4 flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Education background</span>
            <textarea
              value={educationBackground}
              onChange={(e) => setEducationBackground(e.target.value)}
              rows={4}
              placeholder="School, degree, graduation year, relevant coursework…"
              className="rounded-md border border-[var(--cf-border)] px-3 py-2"
            />
          </label>

          <div className="mt-4 space-y-4">
            <p className="text-sm font-medium text-[var(--cf-ink)]">
              Previous employment (up to 3)
            </p>
            {employments.map((job, index) => (
              <fieldset
                key={index}
                className="space-y-3 rounded-lg border border-[var(--cf-border)] p-3"
              >
                <legend className="px-1 text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
                  Role {index + 1}
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium">Company</span>
                    <input
                      value={job.company}
                      onChange={(e) =>
                        updateJob(index, "company", e.target.value)
                      }
                      className="rounded-md border border-[var(--cf-border)] px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium">Job title</span>
                    <input
                      value={job.title}
                      onChange={(e) =>
                        updateJob(index, "title", e.target.value)
                      }
                      className="rounded-md border border-[var(--cf-border)] px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium">Start date</span>
                    <input
                      value={job.startDate}
                      onChange={(e) =>
                        updateJob(index, "startDate", e.target.value)
                      }
                      placeholder="e.g. Jun 2022"
                      className="rounded-md border border-[var(--cf-border)] px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium">End date</span>
                    <input
                      value={job.endDate}
                      onChange={(e) =>
                        updateJob(index, "endDate", e.target.value)
                      }
                      placeholder="e.g. Present"
                      className="rounded-md border border-[var(--cf-border)] px-3 py-2"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Description</span>
                  <textarea
                    value={job.description}
                    onChange={(e) =>
                      updateJob(index, "description", e.target.value)
                    }
                    rows={2}
                    placeholder="Key responsibilities or achievements…"
                    className="rounded-md border border-[var(--cf-border)] px-3 py-2"
                  />
                </label>
              </fieldset>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-[var(--cf-ink)]">
              Upload resume
            </p>
            {resumeUrl.trim() && !removeResume ? (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[var(--cf-accent)] hover:underline"
                >
                  Current resume on file
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setRemoveResume(true);
                    setResumeFile(null);
                  }}
                  className="text-xs font-semibold text-red-700 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : null}
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setResumeFile(file);
                if (file) setRemoveResume(false);
              }}
              className="block w-full text-sm text-[var(--cf-muted)]"
            />
            <p className="text-xs text-[var(--cf-muted)]">
              PDF or Word preferred. Uploading a new file replaces the current
              resume.
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Emergency contact name</span>
              <input
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                className="rounded-md border border-[var(--cf-border)] px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Emergency contact phone</span>
              <input
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                className="rounded-md border border-[var(--cf-border)] px-3 py-2"
              />
            </label>
          </div>
        </div>

        <p className="text-xs text-[var(--cf-muted)]">
          Employment type: {employee.employment_type} · Status:{" "}
          {employee.status}
        </p>
      </div>

      <div className="border-t border-[var(--cf-border)] pt-4">
        {message ? (
          <p className="mb-3 text-sm text-[var(--cf-muted)]">{message}</p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-[var(--cf-navy)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--cf-navy-hover)] disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save profile"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              resetFromProps();
              setMessage(null);
              setEditing(false);
            }}
            className="rounded-md border border-[var(--cf-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--cf-ink)] hover:bg-[var(--cf-surface)] disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
