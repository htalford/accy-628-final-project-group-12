"use client";

import { useState, useTransition, useEffect, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label, FieldInput } from "@/components/ui/form";
import { useToast } from "@/components/client-portal/toast";
import { updateClientProfileAction } from "@/app/actions/client-portal";
import type { CompanyProfile } from "@/lib/client-portal/mock-data";

export function ProfileClient({ initial }: { initial: CompanyProfile }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  async function handleEditToggle() {
    if (!editing) {
      setForm(initial);
      setEditing(true);
      return;
    }

    const result = await updateClientProfileAction({
      companyName: form.companyName,
      industry: form.industry,
      billingEmail: form.email,
    });

    if (!result.ok) {
      toast.push(result.message, "error");
      return;
    }

    toast.push(result.message, "success");
    setEditing(false);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader title="Profile" />
        <Button
          type="button"
          variant={editing ? "secondary" : "primary"}
          disabled={pending}
          onClick={() => void handleEditToggle()}
        >
          {editing ? (pending ? "Saving…" : "Save") : "Edit Profile"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-4">Company Information</CardTitle>
          <div className="grid gap-3">
            {(
              [
                ["companyName", "Company Name", true],
                ["industry", "Industry", true],
                ["primaryContact", "Primary Contact", false],
                ["phone", "Phone Number", false],
                ["email", "Billing Email", true],
                ["address", "Address", false],
              ] as const
            ).map(([key, label, canEdit]) => (
              <div key={key}>
                <Label htmlFor={key}>{label}</Label>
                {editing && canEdit ? (
                  <FieldInput
                    id={key}
                    value={form[key]}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                  />
                ) : (
                  <p className="text-sm text-[var(--cf-ink)]">
                    {form[key]}
                    {editing && !canEdit ? (
                      <span className="ml-2 text-xs text-[var(--cf-muted)]">
                        (contact recruiter to change)
                      </span>
                    ) : null}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle className="mb-4">Account Information</CardTitle>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
                Username
              </dt>
              <dd className="mt-1">{form.username}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
                Company ID
              </dt>
              <dd className="mt-1 break-all">{form.companyId}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
                Member Since
              </dt>
              <dd className="mt-1">{form.memberSince}</dd>
            </div>
          </dl>
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle className="mb-4">Staffing Preferences</CardTitle>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
                Preferred Positions
              </p>
              <div className="flex flex-wrap gap-2">
                {form.preferredPositions.map((p) => (
                  <Badge key={p} tone="navy">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
                Preferred Recruiter
              </p>
              <p className="text-sm font-medium text-[var(--cf-ink)]">
                {form.preferredRecruiter}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-[var(--cf-muted)] uppercase">
                Hiring Locations
              </p>
              <div className="flex flex-wrap gap-2">
                {form.hiringLocations.map((loc) => (
                  <Badge key={loc} tone="accent">
                    {loc}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
