import express, { Application } from 'express';

import { AppContainer } from './container';
import { errorHandler } from './middlewares/error-handler.middleware';
import { notFoundHandler } from './middlewares/not-found.middleware';
import { createRoutes } from './routes';

export const API_PREFIX = '/api/v1';

export function createApp(container: AppContainer): Application {
  const app: Application = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '100kb' }));

  app.use(API_PREFIX, createRoutes(container));

  // precisam ficar por ultimo
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
