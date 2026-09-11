import { NextFunction, Request, Response } from 'express';

import { UserRole } from '../enums/user-role.enum';
import { ForbiddenError, UnauthorizedError } from '../errors/app-error';

export function authorize(...allowedRoles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    try {
      const authenticatedUser = request.user;

      if (!authenticatedUser) {
        throw new UnauthorizedError('Não autenticado.');
      }

      if (!allowedRoles.includes(authenticatedUser.role)) {
        throw new ForbiddenError(
          `Acesso restrito aos perfis: ${allowedRoles.join(', ')}. Seu perfil: ${authenticatedUser.role}.`,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
