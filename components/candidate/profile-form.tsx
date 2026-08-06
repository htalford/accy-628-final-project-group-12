"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCandidateProfile } from "@/app/actions/candidate";
import type { AppUser, Employee } from "@/lib/types/database";
import { Select } from "@/components/ui/select";
import {
  EDUCATION_OPTIONS,
  INDUSTRY_PROFILE_OPTIONS,
  YEARS_OPTIONS,
  getIndustryProfileOptions,
  joinCommaList,
  parseCommaList,
} from "@/lib/candidate/industry-profile";

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

function CheckboxGrid({
  legend,
  hint,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  hint?: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <div>
        <legend className="text-base font-semibold text-[var(--cf-ink)]">
          {legend}
        </legend>
        {hint ? (
          <p className="mt-1 text-xs text-[var(--cf-muted)]">{hint}</p>
        ) : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = selected.includes(option);
          return (
            <label
              key={option}
              className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition ${
                checked
                  ? "border-[var(--cf-navy)] bg-[var(--cf-navy)]/5"
                  : "border-[var(--cf-border)] bg-white hover:bg-[var(--cf-surface)]"
              }`}
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[var(--cf-navy)]"
                checked={checked}
                onChange={() => onToggle(option)}
              />
              <span className="leading-snug text-[var(--cf-ink)]">{option}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function partitionTags(
  stored: string | null | undefined,
  skillOptions: readonly string[],
  otherOptions: readonly string[],
) {
  const all = parseCommaList(stored);
  const skillSet = new Set(skillOptions);
  const otherSet = new Set(otherOptions);
  const skills: string[] = [];
  const other: string[] = [];
  for (const tag of all) {
    if (skillSet.has(tag)) skills.push(tag);
    else if (otherSet.has(tag) || !skillSet.has(tag)) other.push(tag);
  }
  return { skills, other };
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function ProfileForm({
  user,
  employee,
}: {
  user: AppUser;
  employee: Employee;
}) {
  const router = useRouter();
  // Open edit mode when industry is not set so the dropdown is immediately visible.
  const [editing, setEditing] = useState(() => !employee.industry);
  const [firstName, setFirstName] = useState(employee.first_name);
  const [lastName, setLastName] = useState(employee.last_name);
  const [phone, setPhone] = useState(employee.phone ?? "");
  const [displayName, setDisplayName] = useState(user.name);
  const [industry, setIndustry] = useState(employee.industry ?? "");
  const [education, setEducation] = useState(() =>
    parseCommaList(employee.education_background),
  );
  const [yearsExperience, setYearsExperience] = useState(
    employee.years_experience ?? "",
  );
  const initialPartition = partitionTags(
    employee.skills,
    getIndustryProfileOptions(employee.industry)?.skills ?? [],
    getIndustryProfileOptions(employee.industry)?.other ?? [],
  );
  const [skills, setSkills] = useState(initialPartition.skills);
  const [certifications, setCertifications] = useState(() =>
    parseCommaList(employee.certifications),
  );
  const [otherTags, setOtherTags] = useState(initialPartition.other);
  const [resumeUrl, setResumeUrl] = useState(employee.resume_url ?? "");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [removeResume, setRemoveResume] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const industryOptions = useMemo(
    () => getIndustryProfileOptions(industry),
    [industry],
  );

  function hydrateFromEmployee() {
    setFirstName(employee.first_name);
    setLastName(employee.last_name);
    setPhone(employee.phone ?? "");
    setDisplayName(user.name);
    setIndustry(employee.industry ?? "");
    setEducation(parseCommaList(employee.education_background));
    setYearsExperience(employee.years_experience ?? "");
    const opts = getIndustryProfileOptions(employee.industry);
    const partitioned = partitionTags(
      employee.skills,
      opts?.skills ?? [],
      opts?.other ?? [],
    );
    setSkills(partitioned.skills);
    setOtherTags(partitioned.other);
    setCertifications(parseCommaList(employee.certifications));
    setResumeUrl(employee.resume_url ?? "");
    setResumeFile(null);
    setRemoveResume(false);
  }

  useEffect(() => {
    if (editing) return;
    hydrateFromEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync view mode from server props
  }, [employee, user, editing]);

  function onIndustryChange(nextSlug: string) {
    setIndustry(nextSlug);
    const opts = getIndustryProfileOptions(nextSlug);
    if (!opts) {
      setSkills([]);
      setCertifications([]);
      setOtherTags([]);
      return;
    }
    setSkills((prev) => prev.filter((s) => opts.skills.includes(s)));
    setCertifications((prev) =>
      prev.filter((c) => opts.certifications.includes(c)),
    );
    setOtherTags((prev) => prev.filter((o) => opts.other.includes(o)));
  }

  const industryName =
    getIndustryProfileOptions(industry)?.name ??
    (industry ? industry : "");

  if (!editing) {
    return (
      <div className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Display name" value={displayName} />
          <Field label="Email" value={employee.email} />
          <Field label="First name" value={firstName} />
          <Field label="Last name" value={lastName} />
          <Field label="Phone" value={phone} />
          <Field label="Industry" value={industryName} />
          <Field label="Years of experience" value={yearsExperience} />
          <div className="sm:col-span-2">
            <Field label="Education" value={education.join(", ")} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Skills" value={skills.join(", ")} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Certifications" value={certifications.join(", ")} />
          </div>
          {otherTags.length > 0 ? (
            <div className="sm:col-span-2">
              <Field label="Also noted" value={otherTags.join(", ")} />
            </div>
          ) : null}
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
        if (!industry) {
          setMessage("Please choose an industry to continue.");
          return;
        }
        startTransition(async () => {
          const data = new FormData();
          data.set("firstName", firstName);
          data.set("lastName", lastName);
          data.set("phone", phone);
          data.set("displayName", displayName);
          data.set("industry", industry);
          data.set("educationBackground", joinCommaList(education));
          data.set("yearsExperience", yearsExperience);
          data.set("skills", joinCommaList(skills));
          data.set("certifications", joinCommaList(certifications));
          data.set("otherTags", joinCommaList(otherTags));
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
      <div className="grid max-w-3xl gap-6">
        <div className="rounded-xl border-2 border-[var(--cf-navy)]/25 bg-[var(--cf-navy)]/5 p-4 sm:p-5">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-base font-semibold text-[var(--cf-ink)]">
              1. Choose your industry
            </span>
            <span className="text-xs text-[var(--cf-muted)]">
              Skills and certification checkboxes update based on this
              selection.
            </span>
            <Select
              required
              value={industry}
              onChange={(e) => onIndustryChange(e.target.value)}
              className="w-full bg-white text-base"
              aria-label="Industry"
            >
              <option value="">Select an industry…</option>
              {INDUSTRY_PROFILE_OPTIONS.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </Select>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <p className="text-base font-semibold text-[var(--cf-ink)] sm:col-span-2">
            2. Contact details
          </p>
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            <span className="font-medium">Display name</span>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded-md border border-[var(--cf-border)] px-3 py-2"
            />
          </label>
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
        </div>

        {industryOptions ? (
          <div className="space-y-8 rounded-xl border border-[var(--cf-border)] bg-white p-4 shadow-sm sm:p-5">
            <p className="text-base font-semibold text-[var(--cf-ink)]">
              3. {industryOptions.name} checklist
            </p>

            <CheckboxGrid
              legend="Level of education"
              hint="Select all that apply."
              options={EDUCATION_OPTIONS}
              selected={education}
              onToggle={(value) =>
                setEducation((prev) => toggleValue(prev, value))
              }
            />

            <fieldset className="space-y-3">
              <legend className="text-base font-semibold text-[var(--cf-ink)]">
                Years of experience
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {YEARS_OPTIONS.map((option) => (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${
                      yearsExperience === option
                        ? "border-[var(--cf-navy)] bg-[var(--cf-navy)]/5"
                        : "border-[var(--cf-border)] bg-white hover:bg-[var(--cf-surface)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="yearsExperience"
                      className="mt-0.5 h-4 w-4 accent-[var(--cf-navy)]"
                      checked={yearsExperience === option}
                      onChange={() => setYearsExperience(option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <CheckboxGrid
              legend="Skills"
              hint={`Check the skills you have for ${industryOptions.name}.`}
              options={industryOptions.skills}
              selected={skills}
              onToggle={(value) =>
                setSkills((prev) => toggleValue(prev, value))
              }
            />

            <CheckboxGrid
              legend="Certifications & licenses"
              hint={`Check certifications relevant to ${industryOptions.name}.`}
              options={industryOptions.certifications}
              selected={certifications}
              onToggle={(value) =>
                setCertifications((prev) => toggleValue(prev, value))
              }
            />

            <CheckboxGrid
              legend="Also relevant"
              hint="Optional extras for this industry."
              options={industryOptions.other}
              selected={otherTags}
              onToggle={(value) =>
                setOtherTags((prev) => toggleValue(prev, value))
              }
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--cf-border)] bg-[var(--cf-surface)] px-4 py-6 text-center text-sm text-[var(--cf-muted)]">
            Select an industry above to unlock education, experience,{" "}
            <strong className="font-semibold text-[var(--cf-ink)]">skills</strong>
            , and{" "}
            <strong className="font-semibold text-[var(--cf-ink)]">
              certification
            </strong>{" "}
            checkboxes.
          </div>
        )}

        <div className="space-y-2">
          <p className="text-base font-semibold text-[var(--cf-ink)]">
            4. Upload resume
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
              hydrateFromEmployee();
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
