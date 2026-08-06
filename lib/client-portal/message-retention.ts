/** Soft-deleted client threads remain in Deleted for 30 days. */
export const CLIENT_DELETED_THREAD_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export function isClientDeletedThreadVisible(
  deletedAt: string,
  now = Date.now(),
): boolean {
  const t = new Date(deletedAt).getTime();
  if (Number.isNaN(t)) return false;
  return now - t <= CLIENT_DELETED_THREAD_RETENTION_MS;
}

export function daysLeftInDeletedFolder(
  deletedAt: string,
  now = Date.now(),
): number {
  const t = new Date(deletedAt).getTime();
  if (Number.isNaN(t)) return 0;
  const remaining = CLIENT_DELETED_THREAD_RETENTION_MS - (now - t);
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}
