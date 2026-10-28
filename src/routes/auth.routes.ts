import { Router } from 'express';

import { AuthController } from '../controllers/auth.controller';
import { loginSchema } from '../dtos/login.dto';
import { validate } from '../middlewares/validation.middleware';

export function createAuthRoutes(authController: AuthController): Router {
  const authRoutes = Router();

  authRoutes.post('/login', validate({ body: loginSchema }), authController.login);

  return authRoutes;
}
