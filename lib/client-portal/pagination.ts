export const CLIENT_PAGE_SIZE = 5;

export function paginate<T>(items: T[], page: number, pageSize = CLIENT_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    totalPages,
    total: items.length,
    items: items.slice(start, start + pageSize),
  };
}
