import type { Employee, PreviousEmployment } from "@/lib/types/database";

export type ProfileChecklistItem = {
  id: string;
  label: string;
  complete: boolean;
};

export type ProfileCompletion = {
  percent: number;
  items: ProfileChecklistItem[];
  missing: ProfileChecklistItem[];
};

function hasEmploymentEntry(jobs: PreviousEmployment[] | null | undefined) {
  return Boolean(
    jobs?.some((job) => job.company?.trim() && job.title?.trim()),
  );
}

export function getProfileCompletion(
  employee: Employee | null | undefined,
): ProfileCompletion {
  const items: ProfileChecklistItem[] = [
    {
      id: "name",
      label: "Full name",
      complete: Boolean(
        employee?.first_name?.trim() && employee?.last_name?.trim(),
      ),
    },
    {
      id: "phone",
      label: "Phone number",
      complete: Boolean(employee?.phone?.trim()),
    },
    {
      id: "certifications",
      label: "Certifications",
      complete: Boolean(employee?.certifications?.trim()),
    },
    {
      id: "education",
      label: "Education background",
      complete: Boolean(employee?.education_background?.trim()),
    },
    {
      id: "employments",
      label: "Previous employment",
      complete: hasEmploymentEntry(employee?.previous_employments),
    },
    {
      id: "resume",
      label: "Resume",
      complete: Boolean(employee?.resume_url?.trim()),
    },
    {
      id: "emergency",
      label: "Emergency Contact",
      complete: Boolean(
        employee?.emergency_contact_name?.trim() &&
          employee?.emergency_contact_phone?.trim(),
      ),
    },
  ];

  const done = items.filter((i) => i.complete).length;
  const percent =
    items.length === 0 ? 0 : Math.round((done / items.length) * 100);

  return {
    percent,
    items,
    missing: items.filter((i) => !i.complete),
  };
}
