import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePatientsTable1792627013744 implements MigrationInterface {
  public name = 'CreatePatientsTable1792627013744';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "patients" (
        "id"         SERIAL PRIMARY KEY,
        "name"       varchar(120) NOT NULL,
        "cpf"        char(11) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "CHK_patients_cpf" CHECK ("cpf" ~ '^[0-9]{11}$')
      );
    `);

    // RN02: cpf unico entre pacientes ativos (a remocao e logica)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_patients_cpf_active" ON "patients" ("cpf") WHERE "deleted_at" IS NULL;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "patients";`);
  }
}
