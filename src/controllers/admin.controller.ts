import { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../errors/app-error';

export class AdminController {
  public ping = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const authenticatedUser = request.user;

      if (!authenticatedUser) {
        throw new UnauthorizedError('Não autenticado.');
      }

      response.status(200).json({
        message: 'pong - acesso autorizado ao recurso restrito de administrador.',
        data: {
          userId: authenticatedUser.id,
          role: authenticatedUser.role,
          checkedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
