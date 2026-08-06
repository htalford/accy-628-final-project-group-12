"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, FieldInput, FieldTextarea } from "@/components/ui/form";
import { Select } from "@/components/ui/select";
import { Breadcrumbs } from "@/components/client-portal/breadcrumbs";
import { ConfirmActionDialog } from "@/components/client-portal/confirm-action-dialog";
import { useToast } from "@/components/client-portal/toast";
import { createJobRequestAction } from "@/app/actions/client-portal";
import {
  INDUSTRY_PROFILE_OPTIONS,
  YEARS_OPTIONS,
  getIndustryProfileOptions,
  joinCommaList,
} from "@/lib/candidate/industry-profile";

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function CheckboxGrid({
  legend,
  hint,
  options,
  selected,
  onToggle,
  onSelectAll,
}: {
  legend: string;
  hint?: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  onSelectAll: () => void;
}) {
  const allOn =
    options.length > 0 && options.every((option) => selected.includes(option));

  return (
    <fieldset className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <legend className="text-base font-semibold text-[var(--cf-ink)]">
            {legend}
          </legend>
          {hint ? (
            <p className="mt-1 text-xs text-[var(--cf-muted)]">{hint}</p>
          ) : null}
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="shrink-0"
          onClick={onSelectAll}
        >
          {allOn ? "Clear all" : "Select all"}
        </Button>
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

export default function NewJobRequestPage() {
  const router = useRouter();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    department: "Logistics",
    employmentType: "Temporary",
    openings: "1",
    location: "Des Moines, IA",
    payRate: "",
    startDate: "",
    industry: "",
    yearsExperience: "",
    description: "",
    notes: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);

  const industryOptions = useMemo(
    () => getIndustryProfileOptions(form.industry),
    [form.industry],
  );

  function onIndustryChange(nextSlug: string) {
    setForm((f) => ({ ...f, industry: nextSlug }));
    const opts = getIndustryProfileOptions(nextSlug);
    if (!opts) {
      setSkills([]);
      setCertifications([]);
      return;
    }
    setSkills((prev) => prev.filter((s) => opts.skills.includes(s)));
    setCertifications((prev) =>
      prev.filter((c) => opts.certifications.includes(c)),
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.industry) {
      toast.push("Please choose an industry.", "error");
      return;
    }
    setConfirmOpen(true);
  }

  async function confirmSubmit() {
    setBusy(true);
    const result = await createJobRequestAction({
      title: form.title,
      department: form.department,
      employmentType: form.employmentType,
      openings: Number(form.openings),
      location: form.location,
      payRate: form.payRate,
      startDate: form.startDate,
      industry: form.industry,
      yearsExperience: form.yearsExperience,
      skills: joinCommaList(skills),
      certifications: joinCommaList(certifications),
      description: form.description,
      notes: form.notes,
    });
    setBusy(false);
    if (result.ok) {
      toast.push(result.message, "success");
      setConfirmOpen(false);
      router.push(
        result.id
          ? `/client/job-requests/${result.id}`
          : "/client/job-requests",
      );
      router.refresh();
    } else {
      toast.push(result.message, "error");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Job Requests", href: "/client/job-requests" },
          { label: "New" },
        ]}
      />
      <PageHeader
        title="New Job Request"
        description="Choose an industry to load matching skills, certifications, and experience requirements."
      />
      <Card>
        <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2 rounded-xl border-2 border-[var(--cf-navy)]/25 bg-[var(--cf-navy)]/5 p-4">
            <Label htmlFor="industry">Industry</Label>
            <Select
              id="industry"
              required
              className="mt-1.5 w-full bg-white text-base"
              value={form.industry}
              onChange={(e) => onIndustryChange(e.target.value)}
            >
              <option value="">Select an industryΓÇª</option>
              {INDUSTRY_PROFILE_OPTIONS.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </Select>
            <p className="mt-2 text-xs text-[var(--cf-muted)]">
              Skills and certification checkboxes update based on this
              selection (same list candidates use on their profile).
            </p>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="title">Position Title</Label>
            <FieldInput
              id="title"
              name="title"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Warehouse Associate"
            />
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Select
              id="department"
              className="w-full"
              value={form.department}
              onChange={(e) =>
                setForm((f) => ({ ...f, department: e.target.value }))
              }
            >
              <option>Production</option>
              <option>Quality</option>
              <option>Logistics</option>
              <option>Facilities</option>
              <option>Office</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="employmentType">Employment Type</Label>
            <Select
              id="employmentType"
              className="w-full"
              value={form.employmentType}
              onChange={(e) =>
                setForm((f) => ({ ...f, employmentType: e.target.value }))
              }
            >
              <option>Temporary</option>
              <option>Contract-to-hire</option>
              <option>Permanent</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="openings">Number of Openings</Label>
            <FieldInput
              id="openings"
              type="number"
              min={1}
              value={form.openings}
              onChange={(e) =>
                setForm((f) => ({ ...f, openings: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="location">Work Location</Label>
            <FieldInput
              id="location"
              value={form.location}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
            />
          </div>
          <div>
            <Label htmlFor="pay">Pay Rate</Label>
            <FieldInput
              id="pay"
              value={form.payRate}
              onChange={(e) =>
                setForm((f) => ({ ...f, payRate: e.target.value }))
              }
              placeholder="$20ΓÇô$25 / hr"
            />
          </div>
          <div>
            <Label htmlFor="start">Start Date</Label>
            <FieldInput
              id="start"
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, startDate: e.target.value }))
              }
            />
          </div>

          {industryOptions ? (
            <div className="sm:col-span-2 space-y-8 rounded-xl border border-[var(--cf-border)] bg-[var(--cf-surface)]/40 p-4 sm:p-5">
              <p className="text-base font-semibold text-[var(--cf-ink)]">
                {industryOptions.name} requirements
              </p>

              <fieldset className="space-y-3">
                <legend className="text-base font-semibold text-[var(--cf-ink)]">
                  Years of experience
                </legend>
                <p className="text-xs text-[var(--cf-muted)]">
                  Preferred experience level for this role.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {YEARS_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${
                        form.yearsExperience === option
                          ? "border-[var(--cf-navy)] bg-[var(--cf-navy)]/5"
                          : "border-[var(--cf-border)] bg-white hover:bg-[var(--cf-surface)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="yearsExperience"
                        className="mt-0.5 h-4 w-4 accent-[var(--cf-navy)]"
                        checked={form.yearsExperience === option}
                        onChange={() =>
                          setForm((f) => ({ ...f, yearsExperience: option }))
                        }
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <CheckboxGrid
                legend="Required skills"
                hint={`Select skills needed for ${industryOptions.name}. Used for automated matching.`}
                options={industryOptions.skills}
                selected={skills}
                onToggle={(value) =>
                  setSkills((prev) => toggleValue(prev, value))
                }
                onSelectAll={() => {
                  const all =
                    industryOptions.skills.length > 0 &&
                    industryOptions.skills.every((s) => skills.includes(s));
                  setSkills(all ? [] : [...industryOptions.skills]);
                }}
              />

              <CheckboxGrid
                legend="Required certifications"
                hint={`Select certifications for ${industryOptions.name}. Matched against candidate profiles.`}
                options={industryOptions.certifications}
                selected={certifications}
                onToggle={(value) =>
                  setCertifications((prev) => toggleValue(prev, value))
                }
                onSelectAll={() => {
                  const all =
                    industryOptions.certifications.length > 0 &&
                    industryOptions.certifications.every((c) =>
                      certifications.includes(c),
                    );
                  setCertifications(
                    all ? [] : [...industryOptions.certifications],
                  );
                }}
              />
            </div>
          ) : (
            <div className="sm:col-span-2 rounded-xl border border-dashed border-[var(--cf-border)] bg-[var(--cf-surface)] px-4 py-6 text-center text-sm text-[var(--cf-muted)]">
              Select an industry above to unlock years of experience, skills,
              and certification checkboxes.
            </div>
          )}

          <div className="sm:col-span-2">
            <Label htmlFor="description">Job Description</Label>
            <FieldTextarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <FieldTextarea
              id="notes"
              rows={3}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit">Submit</Button>
            <Link href="/client/job-requests">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>

      <ConfirmActionDialog
        open={confirmOpen}
        onClose={() => !busy && setConfirmOpen(false)}
        title="Submit job request?"
        description="This saves a job request for your company and also posts it to the candidate Available jobs board."
        confirmLabel="Submit request"
        confirmVariant="primary"
        showReason={false}
        busy={busy}
        onConfirm={() => void confirmSubmit()}
      />
    </div>
  );
}
