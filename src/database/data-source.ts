import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { DatabaseConfig, env } from '../config/env';
import { Appointment } from '../entities/appointment.entity';
import { Doctor } from '../entities/doctor.entity';
import { Patient } from '../entities/patient.entity';
import { User } from '../entities/user.entity';
import { WorkShift } from '../entities/work-shift.entity';
import { CreateUsersTable1788619277482 } from './migrations/1788619277482-CreateUsersTable';
import { AlterUsersToRolesArray1792540612031 } from './migrations/1792540612031-AlterUsersToRolesArray';
import { CreatePatientsTable1792627013744 } from './migrations/1792627013744-CreatePatientsTable';
import { CreateDoctorsTable1792713418209 } from './migrations/1792713418209-CreateDoctorsTable';
import { CreateWorkShiftsTable1792799823512 } from './migrations/1792799823512-CreateWorkShiftsTable';
import { CreateAppointmentsTable1792886227905 } from './migrations/1792886227905-CreateAppointmentsTable';

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
  entities: [User, Patient, Doctor, WorkShift, Appointment],
  migrations: [
    CreateUsersTable1788619277482,
    AlterUsersToRolesArray1792540612031,
    CreatePatientsTable1792627013744,
    CreateDoctorsTable1792713418209,
    CreateWorkShiftsTable1792799823512,
    CreateAppointmentsTable1792886227905,
  ],
  migrationsTableName: 'migrations_history',
});

export async function initializeDatabase(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  return AppDataSource;
}
