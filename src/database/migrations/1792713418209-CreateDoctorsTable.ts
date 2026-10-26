import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDoctorsTable1792713418209 implements MigrationInterface {
  public name = 'CreateDoctorsTable1792713418209';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "doctors" (
        "id"         SERIAL PRIMARY KEY,
        "crm"        varchar(30) NOT NULL,
        "user_id"    integer NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_doctors_crm" UNIQUE ("crm"),
        CONSTRAINT "UQ_doctors_user" UNIQUE ("user_id"),
        CONSTRAINT "FK_doctors_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "doctors";`);
  }
}
