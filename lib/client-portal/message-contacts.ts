/** Canonical contact names for employer DMs (never mix these). */
export const EMPLOYER_RECRUITER_CONTACT = "Morgan Recruiter";
export const EMPLOYER_ACCOUNTING_CONTACT = "Avery Manager";

function isAccountingContactName(name: string): boolean {
  return /account|avery|finance|billing|payroll|manager/i.test(name);
}

/** Normalize seed / free-text names onto one recruiter or one accounting person. */
export function normalizeEmployerContact(
  name: string | null | undefined,
): string {
  const raw = (name ?? "").trim();
  if (!raw) return EMPLOYER_RECRUITER_CONTACT;
  if (isAccountingContactName(raw)) return EMPLOYER_ACCOUNTING_CONTACT;
  if (/recruit|talent.?quest|morgan/i.test(raw)) return EMPLOYER_RECRUITER_CONTACT;
  return raw;
}

/**
 * Assign a message to exactly one person conversation.
 * Accounting (staff) never appears inside a recruiter DM and vice versa.
 */
export function contactForEmployerMessage(
  senderRole: string,
  threadContactName: string,
): string {
  if (senderRole === "staff") return EMPLOYER_ACCOUNTING_CONTACT;
  if (senderRole === "recruiter") return EMPLOYER_RECRUITER_CONTACT;
  return normalizeEmployerContact(threadContactName);
}
