import { FakePasswordHasher } from './fake-password-hasher';
import { InMemoryDoctorRepository } from './in-memory-doctor.repository';
import { InMemoryPatientRepository } from './in-memory-patient.repository';
import { InMemoryUserRepository } from './in-memory-user.repository';

// monta os dubles ligados entre si, como o container faz com os repositorios reais
export function buildFakes() {
  const userRepository = new InMemoryUserRepository();
  const patientRepository = new InMemoryPatientRepository();
  const doctorRepository = new InMemoryDoctorRepository(userRepository);
  const passwordHasher = new FakePasswordHasher();

  return {
    userRepository,
    patientRepository,
    doctorRepository,
    passwordHasher,
  };
}

export type Fakes = ReturnType<typeof buildFakes>;
