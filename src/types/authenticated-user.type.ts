import { UserRole } from '../enums/user-role.enum';

export interface AuthenticatedUser {
  readonly id: number;
  readonly roles: readonly UserRole[];
}
