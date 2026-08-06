"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, FieldInput, FieldTextarea } from "@/components/ui/form";
import { Select } from "@/components/ui/select";
import { Breadcrumbs } from "@/components/client-portal/breadcrumbs";
import { ConfirmActionDialog } from "@/components/client-portal/confirm-action-dialog";
import { useToast } from "@/components/client-portal/toast";
import { createJobRequestAction } from "@/app/actions/client-portal";

const SKILL_OPTIONS = [
  "Accounts Payable",
  "Accounts Receivable",
  "Invoice processing",
  "Excel",
  "Vendor management",
  "3-way match",
  "QuickBooks",
  "Bookkeeping",
  "Bank reconciliation",
  "Tax preparation",
  "Financial modeling",
  "External audit",
  "ASC 606",
  "Oracle NetSuite",
  "Forklift",
  "Pick/pack",
  "Safety",
  "RF scanner",
  "Inventory",
  "TMS",
  "Routing",
  "Freight",
  "Carrier scheduling",
  "Communication",
] as const;

const CERTIFICATION_OPTIONS = [
  "QuickBooks Certified",
  "Excel Specialist",
  "CPA",
  "CPA candidate",
  "Bookkeeping Certificate",
  "OSHA Forklift",
  "OSHA 10",
  "OSHA 30",
  "Hazmat Awareness",
  "TMS Certification",
] as const;

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

function allSelected(list: string[], options: readonly string[]): boolean {
  return options.length > 0 && options.every((o) => list.includes(o));
}

export default function NewJobRequestPage() {
  const router = useRouter();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    department: "Logistics",
    employmentType: "Temporary",
    openings: "1",
    location: "Des Moines, IA",
    payRate: "",
    startDate: "",
    description: "",
    notes: "",
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
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
      skills: selectedSkills.join(", "),
      certifications: selectedCerts.join(", "),
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

  const skillsAllOn = allSelected(selectedSkills, SKILL_OPTIONS);
  const certsAllOn = allSelected(selectedCerts, CERTIFICATION_OPTIONS);

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
        description="Submit a staffing need to your TalentQuest recruiters. Saves to your company’s job_requests only (not the public board)."
      />
      <Card>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
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
              placeholder="$20–$25 / hr"
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

          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Label id="skills-label">Required Skills</Label>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  setSelectedSkills(
                    skillsAllOn ? [] : [...SKILL_OPTIONS],
                  )
                }
              >
                {skillsAllOn ? "Clear all" : "Select all"}
              </Button>
            </div>
            <div
              role="group"
              aria-labelledby="skills-label"
              className="grid gap-2 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)]/40 p-3 sm:grid-cols-2"
            >
              {SKILL_OPTIONS.map((skill) => {
                const checked = selectedSkills.includes(skill);
                return (
                  <label
                    key={skill}
                    className="flex cursor-pointer items-center gap-2 text-sm text-[var(--cf-ink)]"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[var(--cf-border)] text-[var(--cf-navy)]"
                      checked={checked}
                      onChange={() =>
                        setSelectedSkills((prev) => toggleInList(prev, skill))
                      }
                    />
                    <span>{skill}</span>
                  </label>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-[var(--cf-muted)]">
              Used for automated candidate skill matching.
            </p>
          </div>

          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Label id="certs-label">Required Certifications</Label>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  setSelectedCerts(
                    certsAllOn ? [] : [...CERTIFICATION_OPTIONS],
                  )
                }
              >
                {certsAllOn ? "Clear all" : "Select all"}
              </Button>
            </div>
            <div
              role="group"
              aria-labelledby="certs-label"
              className="grid gap-2 rounded-lg border border-[var(--cf-border)] bg-[var(--cf-surface)]/40 p-3 sm:grid-cols-2"
            >
              {CERTIFICATION_OPTIONS.map((cert) => {
                const checked = selectedCerts.includes(cert);
                return (
                  <label
                    key={cert}
                    className="flex cursor-pointer items-center gap-2 text-sm text-[var(--cf-ink)]"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[var(--cf-border)] text-[var(--cf-navy)]"
                      checked={checked}
                      onChange={() =>
                        setSelectedCerts((prev) => toggleInList(prev, cert))
                      }
                    />
                    <span>{cert}</span>
                  </label>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-[var(--cf-muted)]">
              Matched against certifications on the candidate profile.
            </p>
          </div>

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
        description="This saves a new row in job_requests for your linked client only. Public job board posts are unchanged."
        confirmLabel="Submit request"
        confirmVariant="primary"
        showReason={false}
        busy={busy}
        onConfirm={() => void confirmSubmit()}
      />
    </div>
  );
}
