import { Request, Response } from 'express';

import { createUserSchema } from '../dtos/create-user.dto';
import { getAuthenticatedUser } from '../middlewares/authentication.middleware';
import { getValidated } from '../middlewares/validation.middleware';
import { UserService } from '../services/user.service';

export class UserController {
  private readonly userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  // GET /api/v1/users/me
  public me = async (request: Request, response: Response): Promise<void> => {
    const profile = await this.userService.findProfileById(getAuthenticatedUser(request).id);
    response.status(200).json(profile);
  };

  // POST /api/v1/users
  public create = async (_request: Request, response: Response): Promise<void> => {
    const dto = getValidated(response, 'body', createUserSchema);
    response.status(201).json(await this.userService.create(dto));
  };
}
