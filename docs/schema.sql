-- Mesma estrutura da migration, para quem preferir rodar direto no banco:
-- psql -U postgres -d medclinic -f docs/schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Perfis de acesso (RBAC)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN
    CREATE TYPE "users_role_enum" AS ENUM ('ADMIN', 'ATENDENTE');
  END IF;
END
$$;

-- Tabela de usuarios
CREATE TABLE IF NOT EXISTS "users" (
  "id"            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "name"          varchar(120) NOT NULL,
  "email"         varchar(180) NOT NULL,
  "password_hash" varchar(255) NOT NULL,
  "role"          "users_role_enum" NOT NULL DEFAULT 'ATENDENTE',
  "created_at"    timestamptz NOT NULL DEFAULT now(),
  "updated_at"    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_users_email" UNIQUE ("email")
);

CREATE INDEX IF NOT EXISTS "IDX_users_email" ON "users" ("email");
