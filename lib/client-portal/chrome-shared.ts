export type ClientNotification = {
  id: string;
  title: string;
  detail: string;
  time: string;
  href: string;
};

export type ClientSearchCategory =
  | "Employees"
  | "Candidates"
  | "Jobs"
  | "Timesheets"
  | "Invoices"
  | "Contracts";

export type ClientSearchHit = {
  id: string;
  category: ClientSearchCategory;
  label: string;
  sublabel: string;
  href: string;
};

export type ClientPortalChrome = {
  notifications: ClientNotification[];
  searchIndex: ClientSearchHit[];
};

export type ClientSearchScope = {
  /** Categories searchable on this route. Empty = search disabled. */
  categories: ClientSearchCategory[];
  placeholder: string;
  /** Short label for aria, e.g. "Search employees" */
  ariaLabel: string;
};

/**
 * Restrict top-bar search to records that belong on the current client page.
 */
export function searchScopeForPath(pathname: string): ClientSearchScope {
  if (pathname.startsWith("/client/employees")) {
    return {
      categories: ["Employees"],
      placeholder: "Search employees…",
      ariaLabel: "Search employees on this page",
    };
  }
  if (pathname.startsWith("/client/candidates")) {
    return {
      categories: ["Candidates"],
      placeholder: "Search candidates…",
      ariaLabel: "Search candidates on this page",
    };
  }
  if (pathname.startsWith("/client/job-requests")) {
    return {
      categories: ["Jobs"],
      placeholder: "Search job requests…",
      ariaLabel: "Search job requests on this page",
    };
  }
  if (pathname.startsWith("/client/contracts")) {
    return {
      categories: ["Contracts"],
      placeholder: "Search contracts…",
      ariaLabel: "Search contracts on this page",
    };
  }
  if (pathname.startsWith("/client/timesheets")) {
    return {
      categories: ["Timesheets"],
      placeholder: "Search timesheets…",
      ariaLabel: "Search timesheets on this page",
    };
  }
  if (pathname.startsWith("/client/invoices")) {
    return {
      categories: ["Invoices"],
      placeholder: "Search invoices…",
      ariaLabel: "Search invoices on this page",
    };
  }
  if (pathname.startsWith("/client/dashboard") || pathname === "/client") {
    return {
      categories: [
        "Employees",
        "Candidates",
        "Jobs",
        "Timesheets",
        "Invoices",
        "Contracts",
      ],
      placeholder: "Search dashboard items…",
      ariaLabel: "Search dashboard items",
    };
  }
  // Messages, profile, and other pages have no shared entity index.
  return {
    categories: [],
    placeholder: "No search on this page",
    ariaLabel: "Search unavailable on this page",
  };
}

export function filterSearchIndex(
  index: ClientSearchHit[],
  query: string,
  categories?: ClientSearchCategory[] | null,
): ClientSearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  if (categories && categories.length === 0) return [];

  const allowed =
    categories && categories.length > 0 ? new Set(categories) : null;

  return index
    .filter((hit) => {
      if (allowed && !allowed.has(hit.category)) return false;
      return (
        hit.label.toLowerCase().includes(q) ||
        hit.sublabel.toLowerCase().includes(q) ||
        hit.category.toLowerCase().includes(q)
      );
    })
    .slice(0, 24);
}
