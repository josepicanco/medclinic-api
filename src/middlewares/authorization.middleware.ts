import { NextFunction, Request, RequestHandler, Response } from 'express';

import { UserRole } from '../enums/user-role.enum';
import { ForbiddenError, UnauthorizedError } from '../errors/app-error';

// RN01: basta o usuario ter um dos perfis permitidos
export function authorize(...allowedRoles: UserRole[]): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const authenticatedUser = request.user;

    if (!authenticatedUser) {
      throw new UnauthorizedError('Não autenticado.');
    }

    if (!authenticatedUser.roles.some((role) => allowedRoles.includes(role))) {
      throw new ForbiddenError(`Acesso restrito aos perfis: ${allowedRoles.join(', ')}.`);
    }

    next();
  };
}
