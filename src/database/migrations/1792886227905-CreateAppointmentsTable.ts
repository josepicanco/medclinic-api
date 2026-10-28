import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAppointmentsTable1792886227905 implements MigrationInterface {
  public name = 'CreateAppointmentsTable1792886227905';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id"         SERIAL PRIMARY KEY,
        "doctor_id"  integer NOT NULL,
        "patient_id" integer NOT NULL,
        "starts_at"  timestamptz NOT NULL,
        "ends_at"    timestamptz NOT NULL,
        "status"     varchar(20) NOT NULL DEFAULT 'scheduled',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_appointments_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctors" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_appointments_patient" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_appointments_period" CHECK ("starts_at" < "ends_at"),
        CONSTRAINT "CHK_appointments_status" CHECK ("status" IN ('scheduled', 'in_progress', 'done', 'cancelled'))
      );
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_doctor_period" ON "appointments" ("doctor_id", "starts_at", "ends_at");`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_appointments_patient_period" ON "appointments" ("patient_id", "starts_at", "ends_at");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments";`);
  }
}
