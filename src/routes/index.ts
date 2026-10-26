import { Request, Response, Router } from 'express';

import { AppContainer } from '../container';
import { createAuthRoutes } from './auth.routes';
import { createPatientRoutes } from './patient.routes';
import { createUserRoutes } from './user.routes';

export function createRoutes(container: AppContainer): Router {
  const routes = Router();
  const { authenticate } = container;

  routes.get('/health', (_request: Request, response: Response) => {
    response.status(200).json({ status: 'ok' });
  });

  routes.use('/auth', createAuthRoutes(container.authController));
  routes.use('/users', createUserRoutes(container.userController, authenticate));
  routes.use('/patients', createPatientRoutes(container.patientController, authenticate));

  return routes;
}
