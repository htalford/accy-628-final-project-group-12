import { DEMO_ACCOUNTS } from "@/lib/auth/roles";

/**
 * Temporary demo auth bypass.
 * - `AUTH_BYPASS=true` forces on
 * - `AUTH_BYPASS=false` forces off
 * - Otherwise on in development only
 */
export function isAuthBypassEnabled(): boolean {
  const flag = process.env.AUTH_BYPASS?.trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "off") return false;
  if (flag === "true" || flag === "1" || flag === "on") return true;
  return process.env.NODE_ENV === "development";
}

export function getAuthBypassEmail(): string {
  return (
    process.env.AUTH_BYPASS_EMAIL?.trim() || DEMO_ACCOUNTS.employer.email
  );
}
