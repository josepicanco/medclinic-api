import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkShiftsTable1792799823512 implements MigrationInterface {
  public name = 'CreateWorkShiftsTable1792799823512';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "work_shifts" (
        "id"                    SERIAL PRIMARY KEY,
        "doctor_id"             integer NOT NULL,
        "week_day"              smallint NOT NULL,
        "start_minutes"         smallint NOT NULL,
        "end_minutes"           smallint NOT NULL,
        "slot_duration_minutes" smallint NOT NULL,
        CONSTRAINT "FK_work_shifts_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctors" ("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_work_shifts_week_day" CHECK ("week_day" BETWEEN 0 AND 6),
        CONSTRAINT "CHK_work_shifts_minutes" CHECK (
          "start_minutes" >= 0 AND "end_minutes" <= 1440 AND "start_minutes" < "end_minutes"
        ),
        CONSTRAINT "CHK_work_shifts_slot" CHECK ("slot_duration_minutes" > 0)
      );
    `);

    await queryRunner.query(`CREATE INDEX "IDX_work_shifts_doctor" ON "work_shifts" ("doctor_id");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "work_shifts";`);
  }
}
