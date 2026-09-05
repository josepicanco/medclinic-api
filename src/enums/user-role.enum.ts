export enum UserRole {
  ADMIN = 'ADMIN',
  ATENDENTE = 'ATENDENTE',
}

export const USER_ROLES: readonly UserRole[] = Object.values(UserRole);

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && USER_ROLES.includes(value as UserRole);
}
