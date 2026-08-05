export type ClientNotification = {
  id: string;
  title: string;
  detail: string;
  time: string;
  href: string;
};

export type ClientSearchHit = {
  id: string;
  category:
    | "Employees"
    | "Candidates"
    | "Jobs"
    | "Timesheets"
    | "Invoices"
    | "Contracts";
  label: string;
  sublabel: string;
  href: string;
};

export type ClientPortalChrome = {
  notifications: ClientNotification[];
  searchIndex: ClientSearchHit[];
};

export function filterSearchIndex(
  index: ClientSearchHit[],
  query: string,
): ClientSearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return index
    .filter(
      (hit) =>
        hit.label.toLowerCase().includes(q) ||
        hit.sublabel.toLowerCase().includes(q) ||
        hit.category.toLowerCase().includes(q),
    )
    .slice(0, 24);
}
