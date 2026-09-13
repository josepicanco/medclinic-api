import { Request, Response, Router } from 'express';

import { adminRoutes } from './admin.routes';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';

const routes = Router();

routes.get('/health', (_request: Request, response: Response) => {
  response.status(200).json({ status: 'ok', service: 'MedClinic API', stage: 'auth' });
});

routes.use('/auth', authRoutes);
routes.use('/users', userRoutes);
routes.use('/admin', adminRoutes);

export { routes };
