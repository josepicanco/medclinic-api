import { FakePasswordHasher } from './fake-password-hasher';
import { InMemoryAppointmentRepository } from './in-memory-appointment.repository';
import { InMemoryDoctorRepository } from './in-memory-doctor.repository';
import { InMemoryMedicalRecordRepository } from './in-memory-medical-record.repository';
import { InMemoryPatientRepository } from './in-memory-patient.repository';
import { InMemoryUserRepository } from './in-memory-user.repository';
import { InMemoryWorkScheduleRepository } from './in-memory-work-schedule.repository';

// monta os dubles ligados entre si, como o container faz com os repositorios reais
export function buildFakes() {
  const userRepository = new InMemoryUserRepository();
  const patientRepository = new InMemoryPatientRepository();
  const doctorRepository = new InMemoryDoctorRepository(userRepository);
  const workScheduleRepository = new InMemoryWorkScheduleRepository();
  const appointmentRepository = new InMemoryAppointmentRepository(
    doctorRepository,
    patientRepository,
    workScheduleRepository,
  );
  const medicalRecordRepository = new InMemoryMedicalRecordRepository();
  const passwordHasher = new FakePasswordHasher();

  return {
    userRepository,
    patientRepository,
    doctorRepository,
    workScheduleRepository,
    appointmentRepository,
    medicalRecordRepository,
    passwordHasher,
  };
}

export type Fakes = ReturnType<typeof buildFakes>;
