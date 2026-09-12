import { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../errors/app-error';
import { UserService } from '../services/user.service';

export class UserController {
  private readonly userService: UserService;

  constructor(userService: UserService = new UserService()) {
    this.userService = userService;
  }

  public me = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const authenticatedUser = request.user;

      if (!authenticatedUser) {
        throw new UnauthorizedError('Não autenticado.');
      }

      const profile = await this.userService.findProfileById(authenticatedUser.id);

      response.status(200).json({
        message: 'Usuário autenticado recuperado com sucesso.',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  };
}
