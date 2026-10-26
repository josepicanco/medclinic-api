import 'reflect-metadata';

import { createApp } from './app';
import { env } from './config/env';
import { buildContainer } from './container';
import { AppDataSource, initializeDatabase } from './database/data-source';

// RP10: na nuvem o servico precisa escutar em todas as interfaces, nao so em localhost
const HOST = '0.0.0.0';

async function bootstrap(): Promise<void> {
  try {
    await initializeDatabase();
    console.log('[database] Conexão com o PostgreSQL estabelecida.');

    const container = buildContainer(AppDataSource, env);

    const server = createApp(container).listen(env.port, HOST, () => {
      console.log(`[server] MedClinic API rodando em http://${HOST}:${env.port} (${env.nodeEnv})`);
    });

    const shutdown = (signal: string): void => {
      console.log(`[server] ${signal} recebido, encerrando.`);
      server.close(() => {
        void AppDataSource.destroy().finally(() => process.exit(0));
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[server] Falha ao iniciar a aplicação:', error);

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }

    process.exit(1);
  }
}

void bootstrap();
