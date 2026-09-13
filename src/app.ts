import express, { Application } from 'express';

import { errorHandler } from './middlewares/error-handler.middleware';
import { notFoundHandler } from './middlewares/not-found.middleware';
import { routes } from './routes';

export function createApp(): Application {
  const app: Application = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(routes);

  // precisam ficar por ultimo
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
