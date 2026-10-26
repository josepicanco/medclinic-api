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

    // RP06: as migrations rodam na inicializacao
    if (env.runMigrations) {
      const executed = await AppDataSource.runMigrations({ transaction: 'each' });

      if (executed.length > 0) {
        console.log(`[database] Migrations executadas: ${executed.map((migration) => migration.name).join(', ')}`);
      }
    }

    const container = buildContainer(AppDataSource, env);

    // RP07: primeiro admin criado a partir das variaveis de ambiente
    if ((await container.adminSeedService.ensureAdmin(env.seedAdmin)) === 'created') {
      console.log(`[seed] Administrador criado: ${env.seedAdmin.email}`);
    }

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
