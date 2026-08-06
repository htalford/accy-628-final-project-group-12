import type { Employee } from "@/lib/types/database";
import { parseCommaList } from "@/lib/candidate/industry-profile";

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
      id: "industry",
      label: "Industry",
      complete: Boolean(employee?.industry?.trim()),
    },
    {
      id: "education",
      label: "Education",
      complete: Boolean(employee?.education_background?.trim()),
    },
    {
      id: "experience",
      label: "Years of experience",
      complete: Boolean(employee?.years_experience?.trim()),
    },
    {
      id: "skills",
      label: "Skills",
      complete: parseCommaList(employee?.skills).length > 0,
    },
    {
      id: "certifications",
      label: "Certifications",
      complete: Boolean(employee?.certifications?.trim()),
    },
    {
      id: "resume",
      label: "Resume",
      complete: Boolean(employee?.resume_url?.trim()),
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
