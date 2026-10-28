import { z } from 'zod';

import { isValidDate } from '../rules/clinic-time.rules';
import { Page } from '../types/pagination.types';

const MAX_INT = 2_147_483_647;
const MAX_PAGE_SIZE = 100;

// id vindo da url ou da query ("10" -> 10)
export const idStringSchema = z
  .string()
  .regex(/^\d+$/, 'deve ser um inteiro positivo')
  .transform(Number)
  .refine((value) => value > 0 && value <= MAX_INT, 'deve ser um inteiro positivo');

// id vindo do corpo json
export const idNumberSchema = z.number().int().positive().max(MAX_INT);

export const idParamSchema = z.object({ id: idStringSchema });
export const patientIdParamSchema = z.object({ patientId: idStringSchema });
export const doctorIdParamSchema = z.object({ doctorId: idStringSchema });

export const dateSchema = z.string().refine(isValidDate, 'deve estar no formato YYYY-MM-DD');

export const nameSchema = z.string().trim().min(1, 'não pode ser vazio').max(120);

function boundedIntString(max: number) {
  return z
    .string()
    .regex(/^\d+$/, 'deve ser um inteiro positivo')
    .transform(Number)
    .refine((value) => value >= 1 && value <= max, `deve estar entre 1 e ${max}`);
}

// RF10: ?page= (padrao 1) e ?pageSize= (padrao 20, maximo 100)
export const paginationQuerySchema = z.object({
  page: boundedIntString(MAX_INT).default('1'),
  pageSize: boundedIntString(MAX_PAGE_SIZE).default('20'),
});

export type PaginationQueryDTO = z.infer<typeof paginationQuerySchema>;

export interface PageResponseDTO<T> {
  readonly data: T[];
  readonly meta: {
    readonly total: number;
    readonly page: number;
    readonly pageSize: number;
    readonly totalPages: number;
  };
}

export function toPageResponseDTO<E, R>(page: Page<E>, mapper: (item: E) => R): PageResponseDTO<R> {
  return {
    data: page.items.map(mapper),
    meta: {
      total: page.total,
      page: page.page,
      pageSize: page.pageSize,
      totalPages: Math.ceil(page.total / page.pageSize),
    },
  };
}
