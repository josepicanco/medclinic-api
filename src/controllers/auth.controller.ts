import { NextFunction, Request, Response } from 'express';

import { parseCreateUserDTO } from '../dtos/create-user.dto';
import { parseLoginDTO } from '../dtos/login.dto';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

export class AuthController {
  private readonly userService: UserService;
  private readonly authService: AuthService;

  constructor(userService: UserService = new UserService(), authService: AuthService = new AuthService()) {
    this.userService = userService;
    this.authService = authService;
  }

  // POST /auth/register
  public register = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = parseCreateUserDTO(request.body);
      const user = await this.userService.register(dto);

      response.status(201).json({
        message: 'Usuário cadastrado com sucesso.',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /auth/login
  public login = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = parseLoginDTO(request.body);
      const authResult = await this.authService.login(dto);

      response.status(200).json({
        message: 'Autenticação realizada com sucesso.',
        data: authResult,
      });
    } catch (error) {
      next(error);
    }
  };
}
