import 'dotenv/config';

export interface DatabaseConfig {
  readonly url?: string;
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly database: string;
  readonly logging: boolean;
  readonly ssl: boolean;
  readonly sslRejectUnauthorized: boolean;
}

export interface JwtConfig {
  readonly secret: string;
  readonly expiresIn: string;
}

export interface SeedAdminConfig {
  readonly name: string;
  readonly email: string;
  readonly password: string;
}

export interface AppEnv {
  readonly nodeEnv: 'development' | 'production' | 'test';
  readonly port: number;
  readonly runMigrations: boolean;
  readonly database: DatabaseConfig;
  readonly jwt: JwtConfig;
  readonly bcryptSaltRounds: number;
  readonly seedAdmin: SeedAdminConfig;
}

// se faltar variavel obrigatoria a API nem sobe
function requiredEnv(key: string): string {
  const value = process.env[key];

  if (value === undefined || value.trim() === '') {
    throw new Error(
      `Variável de ambiente obrigatória ausente: ${key}. Copie o arquivo .env.example para .env e preencha os valores.`,
    );
  }

  return value.trim();
}

function optionalEnv(key: string, fallback: string): string {
  const value = process.env[key];
  return value === undefined || value.trim() === '' ? fallback : value.trim();
}

function numberEnv(key: string, fallback: number): number {
  const value = process.env[key];

  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw new Error(`Variável de ambiente ${key} deve ser um número válido.`);
  }

  return parsed;
}

function booleanEnv(key: string, fallback: boolean): boolean {
  return optionalEnv(key, String(fallback)).toLowerCase() === 'true';
}

// com DATABASE_URL (Neon/Render) as variaveis DB_* deixam de ser obrigatorias
function loadDatabaseConfig(): DatabaseConfig {
  const url = optionalEnv('DATABASE_URL', '');
  const hasUrl = url !== '';

  return {
    url: hasUrl ? url : undefined,
    host: optionalEnv('DB_HOST', 'localhost'),
    port: numberEnv('DB_PORT', 5432),
    username: hasUrl ? optionalEnv('DB_USERNAME', '') : requiredEnv('DB_USERNAME'),
    password: hasUrl ? optionalEnv('DB_PASSWORD', '') : requiredEnv('DB_PASSWORD'),
    database: hasUrl ? optionalEnv('DB_DATABASE', '') : requiredEnv('DB_DATABASE'),
    logging: booleanEnv('DB_LOGGING', false),
    ssl: booleanEnv('DB_SSL', false),
    sslRejectUnauthorized: booleanEnv('DB_SSL_REJECT_UNAUTHORIZED', true),
  };
}

export const env: AppEnv = {
  nodeEnv: optionalEnv('NODE_ENV', 'development') as AppEnv['nodeEnv'],
  port: numberEnv('PORT', 3333),
  runMigrations: booleanEnv('RUN_MIGRATIONS', true),
  database: loadDatabaseConfig(),
  jwt: {
    secret: requiredEnv('JWT_SECRET'),
    expiresIn: optionalEnv('JWT_EXPIRES_IN', '1h'),
  },
  bcryptSaltRounds: numberEnv('BCRYPT_SALT_ROUNDS', 10),
  seedAdmin: {
    name: optionalEnv('ADMIN_NAME', 'Administrador do Sistema'),
    email: requiredEnv('ADMIN_EMAIL').toLowerCase(),
    password: requiredEnv('ADMIN_PASSWORD'),
  },
};
