import { MigrationInterface, QueryRunner } from 'typeorm';

// etapa 2: perfis viram array (admin, secretary, doctor) e o id passa a ser inteiro, como no contrato
export class AlterUsersToRolesArray1792540612031 implements MigrationInterface {
  public name = 'AlterUsersToRolesArray1792540612031';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "roles" text[];`);
    await queryRunner.query(`
      UPDATE "users"
      SET "roles" = CASE "role" WHEN 'ADMIN' THEN ARRAY['admin'] ELSE ARRAY['secretary'] END;
    `);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roles" SET NOT NULL;`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum";`);
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "CHK_users_roles"
      CHECK (cardinality("roles") > 0 AND "roles" <@ ARRAY['admin', 'secretary', 'doctor']::text[]);
    `);

    // ainda nao existe chave estrangeira apontando para users, entao da para trocar o id
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_pkey";`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "id";`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "id" SERIAL PRIMARY KEY;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_pkey";`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "id";`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4();`);

    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "CHK_users_roles";`);
    await queryRunner.query(`CREATE TYPE "users_role_enum" AS ENUM ('ADMIN', 'ATENDENTE');`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "role" "users_role_enum" NOT NULL DEFAULT 'ATENDENTE';`);
    await queryRunner.query(`UPDATE "users" SET "role" = 'ADMIN' WHERE 'admin' = ANY("roles");`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "roles";`);
  }
}
