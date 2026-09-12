import { Router } from 'express';

import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/authentication.middleware';

const userRoutes = Router();
const userController = new UserController();

userRoutes.get('/me', authenticate, userController.me);

export { userRoutes };
