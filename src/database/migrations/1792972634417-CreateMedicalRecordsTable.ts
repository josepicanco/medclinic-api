import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMedicalRecordsTable1792972634417 implements MigrationInterface {
  public name = 'CreateMedicalRecordsTable1792972634417';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "medical_records" (
        "id"         SERIAL PRIMARY KEY,
        "patient_id" integer NOT NULL,
        "doctor_id"  integer NOT NULL,
        "text"       text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_medical_records_patient" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_medical_records_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctors" ("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_medical_records_patient_created" ON "medical_records" ("patient_id", "created_at");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "medical_records";`);
  }
}
