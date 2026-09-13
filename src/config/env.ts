import 'dotenv/config';

export interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly password: string;
  readonly database: string;
  readonly logging: boolean;
}

export interface JwtConfig {
  readonly secret: string;
  readonly expiresIn: string;
}

export interface AppEnv {
  readonly nodeEnv: 'development' | 'production' | 'test';
  readonly port: number;
  readonly database: DatabaseConfig;
  readonly jwt: JwtConfig;
  readonly bcryptSaltRounds: number;
  readonly seedAdmin: {
    readonly name: string;
    readonly email: string;
    readonly password: string;
  };
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

export const env: AppEnv = {
  nodeEnv: optionalEnv('NODE_ENV', 'development') as AppEnv['nodeEnv'],
  port: numberEnv('PORT', 3333),
  database: {
    host: optionalEnv('DB_HOST', 'localhost'),
    port: numberEnv('DB_PORT', 5432),
    username: requiredEnv('DB_USERNAME'),
    password: requiredEnv('DB_PASSWORD'),
    database: requiredEnv('DB_DATABASE'),
    logging: optionalEnv('DB_LOGGING', 'false') === 'true',
  },
  jwt: {
    secret: requiredEnv('JWT_SECRET'),
    expiresIn: optionalEnv('JWT_EXPIRES_IN', '1h'),
  },
  bcryptSaltRounds: numberEnv('BCRYPT_SALT_ROUNDS', 10),
  seedAdmin: {
    name: optionalEnv('ADMIN_NAME', 'Administrador do Sistema'),
    email: optionalEnv('ADMIN_EMAIL', 'admin@medclinic.com'),
    password: optionalEnv('ADMIN_PASSWORD', 'Admin@123'),
  },
};
