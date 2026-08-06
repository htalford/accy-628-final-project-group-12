import { daysAgoIso } from "@/lib/accounting/calculations";

export const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "week", label: "Last week" },
  { value: "month", label: "Last month" },
  { value: "3months", label: "Last 3 months" },
  { value: "6months", label: "Last 6 months" },
  { value: "year", label: "Last year" },
] as const;

export type DateRangeValue = (typeof DATE_RANGE_OPTIONS)[number]["value"];

export function rangeCutoff(range?: string): string | undefined {
  switch (range) {
    case "week":
      return daysAgoIso(7);
    case "month":
      return daysAgoIso(30);
    case "3months":
      return daysAgoIso(90);
    case "6months":
      return daysAgoIso(180);
    case "year":
      return daysAgoIso(365);
    default:
      return undefined;
  }
}
