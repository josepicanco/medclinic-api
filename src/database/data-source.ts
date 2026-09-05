import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { env } from '../config/env';
import { User } from '../entities/user.entity';
import { CreateUsersTable1788619277482 } from './migrations/1788619277482-CreateUsersTable';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.database.host,
  port: env.database.port,
  username: env.database.username,
  password: env.database.password,
  database: env.database.database,
  synchronize: false, // tabelas criadas pela migration
  logging: env.database.logging,
  entities: [User],
  migrations: [CreateUsersTable1788619277482],
  migrationsTableName: 'migrations_history',
});

export async function initializeDatabase(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  return AppDataSource;
}
