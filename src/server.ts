import 'reflect-metadata';

import { env } from './config/env';
import { createApp } from './app';
import { AppDataSource, initializeDatabase } from './database/data-source';

async function bootstrap(): Promise<void> {
  try {
    await initializeDatabase();
    console.log('[database] Conexão com o PostgreSQL estabelecida.');

    const app = createApp();

    app.listen(env.port, () => {
      console.log(`[server] MedClinic API rodando em http://localhost:${env.port} (${env.nodeEnv})`);
    });
  } catch (error) {
    console.error('[server] Falha ao iniciar a aplicação:', error);

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }

    process.exit(1);
  }
}

void bootstrap();
