export type CandidateNotification = {
  id: string;
  title: string;
  body: string;
  href: string;
  time: string;
  tone: "warning" | "info" | "success";
};

/** Candidate sidebar roots that can show an attention dot. */
export const CANDIDATE_NAV_ROOTS = [
  "/candidate/dashboard",
  "/candidate/applications",
  "/candidate/jobs",
  "/candidate/contracts",
  "/candidate/interviews",
  "/candidate/messages",
  "/candidate/pay",
  "/candidate/profile",
  "/candidate/timesheets",
] as const;

export type CandidateNavRoot = (typeof CANDIDATE_NAV_ROOTS)[number];

/** Map a notification href to its sidebar nav root. */
export function candidateNavRootFromHref(href: string): CandidateNavRoot | null {
  const path = (href.split("?")[0] ?? href).replace(/\/$/, "") || href;
  const match = CANDIDATE_NAV_ROOTS.find(
    (root) => path === root || path.startsWith(`${root}/`),
  );
  return match ?? null;
}
