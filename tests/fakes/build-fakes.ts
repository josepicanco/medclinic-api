import { FakePasswordHasher } from './fake-password-hasher';
import { InMemoryDoctorRepository } from './in-memory-doctor.repository';
import { InMemoryPatientRepository } from './in-memory-patient.repository';
import { InMemoryUserRepository } from './in-memory-user.repository';
import { InMemoryWorkScheduleRepository } from './in-memory-work-schedule.repository';

// monta os dubles ligados entre si, como o container faz com os repositorios reais
export function buildFakes() {
  const userRepository = new InMemoryUserRepository();
  const patientRepository = new InMemoryPatientRepository();
  const doctorRepository = new InMemoryDoctorRepository(userRepository);
  const workScheduleRepository = new InMemoryWorkScheduleRepository();
  const passwordHasher = new FakePasswordHasher();

  return {
    userRepository,
    patientRepository,
    doctorRepository,
    workScheduleRepository,
    passwordHasher,
  };
}

export type Fakes = ReturnType<typeof buildFakes>;
