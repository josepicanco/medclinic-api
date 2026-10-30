import { Page, PageRequest } from '../../src/types/pagination.type';

export function paginate<T>(items: T[], request: PageRequest): Page<T> {
  const start = (request.page - 1) * request.pageSize;
  return { items: items.slice(start, start + request.pageSize), total: items.length, ...request };
}
