import { Request, Response } from 'express';

import { loginSchema } from '../dtos/login.dto';
import { getValidated } from '../middlewares/validation.middleware';
import { AuthService } from '../services/auth.service';

export class AuthController {
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  // POST /api/v1/auth/login
  public login = async (_request: Request, response: Response): Promise<void> => {
    const dto = getValidated(response, 'body', loginSchema);
    response.status(200).json(await this.authService.login(dto));
  };
}
