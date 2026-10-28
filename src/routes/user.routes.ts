import { RequestHandler, Router } from 'express';

import { UserController } from '../controllers/user.controller';
import { createUserSchema } from '../dtos/create-user.dto';
import { UserRole } from '../enums/user-role.enum';
import { authorize } from '../middlewares/authorization.middleware';
import { validate } from '../middlewares/validation.middleware';

// RF13: criar usuario exige admin autenticado; nao existe cadastro publico
export function createUserRoutes(userController: UserController, authenticate: RequestHandler): Router {
  const userRoutes = Router();

  userRoutes.get('/me', authenticate, userController.me);
  userRoutes.post(
    '/',
    authenticate,
    authorize(UserRole.ADMIN),
    validate({ body: createUserSchema }),
    userController.create,
  );

  return userRoutes;
}
