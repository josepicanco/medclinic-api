import { QueryFailedError } from 'typeorm';

const UNIQUE_VIOLATION_CODE = '23505'; // codigo do Postgres para unique violado

// nome da restricao unica que o banco recusou, ou null se o erro e outro
export function uniqueViolationConstraint(error: unknown): string | null {
  if (!(error instanceof QueryFailedError)) {
    return null;
  }

  const driverError = error.driverError as { code?: string; constraint?: string } | undefined;

  if (driverError?.code !== UNIQUE_VIOLATION_CODE) {
    return null;
  }

  return driverError.constraint ?? '';
}

// escapa os curingas do LIKE para a busca parcial ser literal
export function likePattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}
