export interface PageRequest {
  readonly page: number;
  readonly pageSize: number;
}

export interface Page<T> {
  readonly items: T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export function emptyPage<T>(request: PageRequest): Page<T> {
  return { items: [], total: 0, page: request.page, pageSize: request.pageSize };
}
