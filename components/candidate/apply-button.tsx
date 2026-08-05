"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { applyToJob } from "@/app/actions/candidate";

type Props = {
  jobId: string;
  jobTitle?: string;
  profileResumeUrl?: string | null;
};

export function ApplyButton({
  jobId,
  jobTitle,
  profileResumeUrl,
}: Props) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [includeProfile, setIncludeProfile] = useState(true);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeMode, setResumeMode] = useState<"none" | "profile" | "url" | "file">(
    profileResumeUrl ? "profile" : "none",
  );
  const [resumeUrl, setResumeUrl] = useState(profileResumeUrl ?? "");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function resetForm() {
    setIncludeProfile(true);
    setCoverLetter("");
    setResumeMode(profileResumeUrl ? "profile" : "none");
    setResumeUrl(profileResumeUrl ?? "");
    setResumeFile(null);
    setMessage(null);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => {
          resetForm();
          setOpen(true);
        }}
        className="rounded-md bg-[var(--cf-navy)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--cf-navy-hover)]"
      >
        Apply
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close apply dialog"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--cf-border)] bg-white p-5 shadow-xl sm:p-6"
          >
            <h2
              id={titleId}
              className="text-lg font-semibold text-[var(--cf-ink)]"
            >
              Apply{jobTitle ? ` · ${jobTitle}` : ""}
            </h2>
            <p className="mt-1 text-sm text-[var(--cf-muted)]">
              Send your profile, a cover letter, a resume, or any combination.
            </p>

            <form
              className="mt-5 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                setMessage(null);
                const data = new FormData(e.currentTarget);
                data.set("jobId", jobId);
                if (resumeMode === "profile" && profileResumeUrl) {
                  data.set("resumeUrl", profileResumeUrl);
                } else if (resumeMode === "url") {
                  data.set("resumeUrl", resumeUrl.trim());
                } else if (resumeMode === "none") {
                  data.delete("resumeUrl");
                }
                if (resumeMode === "file" && resumeFile) {
                  data.set("resumeFile", resumeFile);
                } else {
                  data.delete("resumeFile");
                }
                if (!includeProfile) data.delete("includeProfile");

                startTransition(async () => {
                  const result = await applyToJob(data);
                  if (result.ok) {
                    setMessage("Application submitted.");
                    setTimeout(() => setOpen(false), 700);
                  } else {
                    setMessage(result.error);
                  }
                });
              }}
            >
              <label className="flex items-start gap-3 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)] p-3 text-sm">
                <input
                  type="checkbox"
                  name="includeProfile"
                  checked={includeProfile}
                  onChange={(e) => setIncludeProfile(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium text-[var(--cf-ink)]">
                    Send my profile information
                  </span>
                  <span className="mt-0.5 block text-[var(--cf-muted)]">
                    Name, contact, certifications, and emergency contacts from
                    your Candidate profile.
                  </span>
                </span>
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Cover letter (optional)</span>
                <textarea
                  name="coverLetter"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={5}
                  placeholder="Introduce yourself and why you’re a fit for this role…"
                  className="rounded-md border border-[var(--cf-border)] px-3 py-2"
                />
              </label>

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-[var(--cf-ink)]">
                  Resume (optional)
                </legend>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="resumeMode"
                    checked={resumeMode === "none"}
                    onChange={() => setResumeMode("none")}
                  />
                  No resume for this application
                </label>
                {profileResumeUrl ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="resumeMode"
                      checked={resumeMode === "profile"}
                      onChange={() => setResumeMode("profile")}
                    />
                    Use resume already on my profile
                  </label>
                ) : null}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="resumeMode"
                    checked={resumeMode === "url"}
                    onChange={() => setResumeMode("url")}
                  />
                  Paste an updated resume link
                </label>
                {resumeMode === "url" ? (
                  <input
                    type="url"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="https://…"
                    className="w-full rounded-md border border-[var(--cf-border)] px-3 py-2 text-sm"
                  />
                ) : null}
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="resumeMode"
                    checked={resumeMode === "file"}
                    onChange={() => setResumeMode("file")}
                  />
                  Upload an updated resume file
                </label>
                {resumeMode === "file" ? (
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    onChange={(e) =>
                      setResumeFile(e.target.files?.[0] ?? null)
                    }
                    className="block w-full text-sm text-[var(--cf-muted)]"
                  />
                ) : null}
              </fieldset>

              {message ? (
                <p className="text-sm text-[var(--cf-muted)]">{message}</p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 border-t border-[var(--cf-border)] pt-4">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-[var(--cf-border)] px-4 py-2 text-sm font-semibold text-[var(--cf-ink)] hover:bg-[var(--cf-surface)] disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-md bg-[var(--cf-navy)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--cf-navy-hover)] disabled:opacity-60"
                >
                  {pending ? "Submitting…" : "Submit application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
