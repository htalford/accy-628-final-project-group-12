import type {
  CandidateFilters,
  JobOrderFilters,
  RecruiterCandidate,
  RecruiterJobOrder,
} from "@/lib/recruiter/types";

/** Pure filters — safe to import from Client Components. */
export function filterCandidates(
  rows: RecruiterCandidate[],
  filters: CandidateFilters = {},
): RecruiterCandidate[] {
  const search = filters.search?.trim().toLowerCase() ?? "";
  return rows.filter((c) => {
    if (
      search &&
      !`${c.name} ${c.positionApplied} ${c.skills.join(" ")}`
        .toLowerCase()
        .includes(search)
    ) {
      return false;
    }
    if (filters.status && filters.status !== "all" && c.status !== filters.status) {
      return false;
    }
    if (filters.location && filters.location !== "all" && c.location !== filters.location) {
      return false;
    }
    if (filters.recruiter && filters.recruiter !== "all" && c.recruiter !== filters.recruiter) {
      return false;
    }
    if (filters.skills && filters.skills !== "all") {
      const skill = filters.skills.toLowerCase();
      if (!c.skills.some((s) => s.toLowerCase() === skill)) return false;
    }
    if (filters.experience && filters.experience !== "all") {
      const years = c.experienceYears;
      if (filters.experience === "0-2" && !(years <= 2)) return false;
      if (filters.experience === "3-5" && !(years >= 3 && years <= 5)) return false;
      if (filters.experience === "6+" && !(years >= 6)) return false;
    }
    if (filters.match && filters.match !== "all") {
      const pct = c.matchPercent;
      if (pct == null) return false;
      if (filters.match === "under60" && !(pct < 60)) return false;
      if (filters.match === "60plus" && !(pct >= 60)) return false;
    }
    return true;
  });
}

export function filterJobOrders(
  rows: RecruiterJobOrder[],
  filters: JobOrderFilters = {},
): RecruiterJobOrder[] {
  const search = filters.search?.trim().toLowerCase() ?? "";
  return rows.filter((j) => {
    if (
      search &&
      !`${j.title} ${j.client} ${j.location}`.toLowerCase().includes(search)
    ) {
      return false;
    }
    if (filters.client && filters.client !== "all" && j.client !== filters.client) {
      return false;
    }
    if (filters.status && filters.status !== "all" && j.status !== filters.status) {
      return false;
    }
    if (filters.location && filters.location !== "all" && j.location !== filters.location) {
      return false;
    }
    if (filters.priority && filters.priority !== "all" && j.priority !== filters.priority) {
      return false;
    }
    return true;
  });
}
