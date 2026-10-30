import 'reflect-metadata';

import { env } from '../../config/env.config';
import { UserRepository } from '../../repositories/user.repository';
import { AdminSeedService } from '../../services/admin-seed.service';
import { PasswordUtil } from '../../utils/password.util';
import { AppDataSource, initializeDatabase } from '../data-source.config';

// nao existe rota publica que crie admin, entao o primeiro sai daqui (o server tambem chama na subida)
async function createAdminSeed(): Promise<void> {
  const dataSource = await initializeDatabase();
  const seed = new AdminSeedService(new UserRepository(dataSource), new PasswordUtil(env.bcryptSaltRounds));
  const result = await seed.ensureAdmin(env.seedAdmin);

  console.log(
    result === 'created'
      ? `[seed] Administrador criado com sucesso: ${env.seedAdmin.email}`
      : `[seed] Administrador já existe: ${env.seedAdmin.email}`,
  );

  await AppDataSource.destroy();
}

createAdminSeed().catch(async (error: unknown) => {
  console.error('[seed] Falha ao criar o administrador:', error);

  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }

  process.exit(1);
});
