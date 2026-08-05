/**
 * Browser-local pinned tasks for portal sidebars.
 * Scopes keep employer and accounting pins separate.
 */

export type PinScope = "client" | "accounting";

export type PinnedTaskKind =
  | "contract"
  | "task"
  | "timesheet"
  | "invoice"
  | "other";

export type PinnedTask = {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  kind: PinnedTaskKind;
};

const STORAGE_KEYS: Record<PinScope, string> = {
  client: "cf-client-pinned-tasks",
  accounting: "cf-accounting-pinned-tasks",
};

export const PINS_CHANGED_EVENT = "cf-portal-pins-changed";

function isPinnedTask(value: unknown): value is PinnedTask {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.label === "string" &&
    typeof v.href === "string" &&
    typeof v.kind === "string"
  );
}

export function storageKeyFor(scope: PinScope): string {
  return STORAGE_KEYS[scope];
}

export function readPinnedTasks(scope: PinScope): PinnedTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS[scope]);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPinnedTask);
  } catch {
    return [];
  }
}

export function writePinnedTasks(scope: PinScope, tasks: PinnedTask[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS[scope], JSON.stringify(tasks));
  window.dispatchEvent(
    new CustomEvent(PINS_CHANGED_EVENT, { detail: { scope } }),
  );
}

export function contractPinId(scope: PinScope, contractId: string): string {
  return `${scope}-contract-${contractId}`;
}

export function makeContractPin(input: {
  scope: PinScope;
  contractId: string;
  label: string;
  sublabel?: string;
  href: string;
}): PinnedTask {
  return {
    id: contractPinId(input.scope, input.contractId),
    label: input.label,
    sublabel: input.sublabel,
    href: input.href,
    kind: "contract",
  };
}
