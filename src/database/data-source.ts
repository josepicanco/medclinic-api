import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { DatabaseConfig, env } from '../config/env';
import { Patient } from '../entities/patient.entity';
import { User } from '../entities/user.entity';
import { CreateUsersTable1788619277482 } from './migrations/1788619277482-CreateUsersTable';
import { AlterUsersToRolesArray1792540612031 } from './migrations/1792540612031-AlterUsersToRolesArray';
import { CreatePatientsTable1792627013744 } from './migrations/1792627013744-CreatePatientsTable';

// banco gerenciado (Neon/Render) passa a URL inteira; local usa as variaveis separadas
function connectionOptions(database: DatabaseConfig): Partial<PostgresConnectionOptions> {
  if (database.url) {
    return { url: database.url };
  }

  return {
    host: database.host,
    port: database.port,
    username: database.username,
    password: database.password,
    database: database.database,
  };
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...connectionOptions(env.database),
  ssl: env.database.ssl ? { rejectUnauthorized: env.database.sslRejectUnauthorized } : false,
  synchronize: false, // tabelas criadas pelas migrations
  logging: env.database.logging,
  entities: [User, Patient],
  migrations: [
    CreateUsersTable1788619277482,
    AlterUsersToRolesArray1792540612031,
    CreatePatientsTable1792627013744,
  ],
  migrationsTableName: 'migrations_history',
});

export async function initializeDatabase(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  return AppDataSource;
}
