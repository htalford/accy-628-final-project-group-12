/**
 * When automated skill match is below this score, the application is
 * treated as needing recruiter review (auto-routed).
 */
export const MATCH_RECRUITER_THRESHOLD = 60;

export function shouldRouteToRecruiter(matchScore: number | null | undefined): boolean {
  if (matchScore == null || Number.isNaN(matchScore)) return false;
  return matchScore < MATCH_RECRUITER_THRESHOLD;
}

export function routeToRecruiterNote(matchScore: number): string {
  return `Auto-routed to recruiter for review (match score ${Math.round(matchScore)}% is below ${MATCH_RECRUITER_THRESHOLD}%).`;
}
