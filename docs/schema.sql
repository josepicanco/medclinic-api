-- Estrutura final do banco depois de todas as migrations (etapa 2).
-- Serve so de referencia: o banco e criado pelas migrations (npm run migration:run ou na subida da API).

-- Usuarios (etapa 1, ajustada na etapa 2: id inteiro e perfis em array)
CREATE TABLE "users" (
  "id"            SERIAL PRIMARY KEY,
  "name"          varchar(120) NOT NULL,
  "email"         varchar(180) NOT NULL,
  "password_hash" varchar(255) NOT NULL,
  "roles"         text[] NOT NULL,
  "created_at"    timestamptz NOT NULL DEFAULT now(),
  "updated_at"    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_users_email" UNIQUE ("email"),
  CONSTRAINT "CHK_users_roles" CHECK (
    cardinality("roles") > 0 AND "roles" <@ ARRAY['admin', 'secretary', 'doctor']::text[]
  )
);

-- Pacientes (remocao logica por deleted_at)
CREATE TABLE "patients" (
  "id"         SERIAL PRIMARY KEY,
  "name"       varchar(120) NOT NULL,
  "cpf"        char(11) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz NULL,
  CONSTRAINT "CHK_patients_cpf" CHECK ("cpf" ~ '^[0-9]{11}$')
);
CREATE UNIQUE INDEX "UQ_patients_cpf_active" ON "patients" ("cpf") WHERE "deleted_at" IS NULL;

-- Medicos: registro profissional ligado a um usuario com perfil doctor
CREATE TABLE "doctors" (
  "id"         SERIAL PRIMARY KEY,
  "crm"        varchar(30) NOT NULL,
  "user_id"    integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_doctors_crm" UNIQUE ("crm"),
  CONSTRAINT "UQ_doctors_user" UNIQUE ("user_id"),
  CONSTRAINT "FK_doctors_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT
);

-- Escala: um turno por linha, horas em minutos desde 00:00 no horario de Sao Paulo
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
CREATE INDEX "IDX_work_shifts_doctor" ON "work_shifts" ("doctor_id");

-- Agendamentos: o fim fica gravado (RN15)
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
CREATE INDEX "IDX_appointments_doctor_period" ON "appointments" ("doctor_id", "starts_at", "ends_at");
CREATE INDEX "IDX_appointments_patient_period" ON "appointments" ("patient_id", "starts_at", "ends_at");

-- Prontuario
CREATE TABLE "medical_records" (
  "id"         SERIAL PRIMARY KEY,
  "patient_id" integer NOT NULL,
  "doctor_id"  integer NOT NULL,
  "text"       text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "FK_medical_records_patient" FOREIGN KEY ("patient_id") REFERENCES "patients" ("id") ON DELETE RESTRICT,
  CONSTRAINT "FK_medical_records_doctor" FOREIGN KEY ("doctor_id") REFERENCES "doctors" ("id") ON DELETE RESTRICT
);
CREATE INDEX "IDX_medical_records_patient_created" ON "medical_records" ("patient_id", "created_at");
