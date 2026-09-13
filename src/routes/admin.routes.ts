import { Router } from 'express';

import { AdminController } from '../controllers/admin.controller';
import { UserRole } from '../enums/user-role.enum';
import { authenticate } from '../middlewares/authentication.middleware';
import { authorize } from '../middlewares/authorization.middleware';

const adminRoutes = Router();
const adminController = new AdminController();

adminRoutes.get('/ping', authenticate, authorize(UserRole.ADMIN), adminController.ping);

export { adminRoutes };
