import { UserRole } from '../enums/user-role.enum';

export interface AuthenticatedUser {
  readonly id: string;
  readonly role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
