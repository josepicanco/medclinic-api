import { RequestHandler, Router } from 'express';

import { UserController } from '../controllers/user.controller';

export function createUserRoutes(userController: UserController, authenticate: RequestHandler): Router {
  const userRoutes = Router();

  userRoutes.get('/me', authenticate, userController.me);

  return userRoutes;
}
