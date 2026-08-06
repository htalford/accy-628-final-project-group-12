/**
 * Map deep-link notification hrefs to sidebar nav roots for attention dots.
 */

export function stripHrefPath(href: string): string {
  const path = (href.split("?")[0] ?? href).replace(/\/$/, "");
  return path || href;
}

/**
 * Prefer longer nav roots so nested items (e.g. /client/candidates/interested)
 * win over shorter prefixes when both could match.
 */
export function navRootFromHref(
  href: string,
  roots: readonly string[],
  aliases: readonly { prefix: string; root: string }[] = [],
): string | null {
  const path = stripHrefPath(href);

  for (const alias of aliases) {
    if (path === alias.prefix || path.startsWith(`${alias.prefix}/`)) {
      return alias.root;
    }
  }

  const sorted = [...roots].sort((a, b) => b.length - a.length);
  const match = sorted.find(
    (root) => path === root || path.startsWith(`${root}/`),
  );
  return match ?? null;
}

export function attentionHrefsFromNotifications(
  notifications: { id: string; href: string }[],
  roots: readonly string[],
  aliases: readonly { prefix: string; root: string }[] = [],
): string[] {
  const source = notifications.filter((n) => n.id !== "all-clear");
  return Array.from(
    new Set(
      source
        .map((n) => navRootFromHref(n.href, roots, aliases))
        .filter((href): href is string => Boolean(href)),
    ),
  );
}
