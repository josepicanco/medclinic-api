import 'reflect-metadata';

import { env } from '../../config/env';
import { UserRole } from '../../enums/user-role.enum';
import { UserRepository } from '../../repositories/user.repository';
import { PasswordUtil } from '../../utils/password.util';
import { AppDataSource, initializeDatabase } from '../data-source';

// o cadastro público só cria ATENDENTE, então o primeiro ADMIN sai daqui
async function createAdminSeed(): Promise<void> {
  await initializeDatabase();

  const userRepository = new UserRepository();
  const email = env.seedAdmin.email.toLowerCase();
  const existingAdmin = await userRepository.findByEmail(email);

  if (existingAdmin) {
    console.log(`[seed] Administrador já existe: ${email}`);
    await AppDataSource.destroy();
    return;
  }

  const passwordHash = await PasswordUtil.hash(env.seedAdmin.password);

  const admin = await userRepository.create({
    name: env.seedAdmin.name,
    email,
    passwordHash,
    role: UserRole.ADMIN,
  });

  console.log(`[seed] Administrador criado com sucesso: ${admin.email} (id: ${admin.id})`);
  await AppDataSource.destroy();
}

createAdminSeed().catch(async (error: unknown) => {
  console.error('[seed] Falha ao criar o administrador:', error);

  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }

  process.exit(1);
});
