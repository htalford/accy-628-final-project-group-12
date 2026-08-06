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
    skills: "",
    certifications: "",
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
      skills: form.skills,
      certifications: form.certifications,
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
            <Label htmlFor="skills">Required Skills</Label>
            <FieldInput
              id="skills"
              value={form.skills}
              onChange={(e) =>
                setForm((f) => ({ ...f, skills: e.target.value }))
              }
              placeholder="Comma-separated skills (e.g. Excel, Invoice processing)"
            />
            <p className="mt-1 text-xs text-[var(--cf-muted)]">
              Used for automated candidate skill matching.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="certifications">Required Certifications</Label>
            <FieldInput
              id="certifications"
              value={form.certifications}
              onChange={(e) =>
                setForm((f) => ({ ...f, certifications: e.target.value }))
              }
              placeholder="Comma-separated certs (e.g. CPA, OSHA Forklift, QuickBooks Certified)"
            />
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
