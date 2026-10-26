import { RequestHandler } from 'express';
import { DataSource } from 'typeorm';

import { AppEnv } from './config/env';
import { AppointmentController } from './controllers/appointment.controller';
import { AuthController } from './controllers/auth.controller';
import { DoctorController } from './controllers/doctor.controller';
import { PatientController } from './controllers/patient.controller';
import { UserController } from './controllers/user.controller';
import { WorkScheduleController } from './controllers/work-schedule.controller';
import { authenticate } from './middlewares/authentication.middleware';
import { AppointmentRepository } from './repositories/appointment.repository';
import { DoctorRepository } from './repositories/doctor.repository';
import { PatientRepository } from './repositories/patient.repository';
import { UserRepository } from './repositories/user.repository';
import { WorkScheduleRepository } from './repositories/work-schedule.repository';
import { AdminSeedService } from './services/admin-seed.service';
import { AppointmentService } from './services/appointment.service';
import { AuthService } from './services/auth.service';
import { DoctorService } from './services/doctor.service';
import { PatientService } from './services/patient.service';
import { UserService } from './services/user.service';
import { WorkScheduleService } from './services/work-schedule.service';
import { JwtUtil } from './utils/jwt.util';
import { PasswordUtil } from './utils/password.util';

export interface AppContainer {
  readonly authenticate: RequestHandler;
  readonly adminSeedService: AdminSeedService;
  readonly authController: AuthController;
  readonly userController: UserController;
  readonly patientController: PatientController;
  readonly doctorController: DoctorController;
  readonly workScheduleController: WorkScheduleController;
  readonly appointmentController: AppointmentController;
}

// unico lugar que conhece as implementacoes concretas: o resto recebe tudo pelo construtor (RP02)
export function buildContainer(dataSource: DataSource, env: AppEnv): AppContainer {
  const passwordUtil = new PasswordUtil(env.bcryptSaltRounds);
  const jwtUtil = new JwtUtil(env.jwt.secret, env.jwt.expiresIn);

  const userRepository = new UserRepository(dataSource);
  const patientRepository = new PatientRepository(dataSource);
  const doctorRepository = new DoctorRepository(dataSource);
  const workScheduleRepository = new WorkScheduleRepository(dataSource);
  const appointmentRepository = new AppointmentRepository(dataSource);

  const authService = new AuthService(userRepository, passwordUtil, jwtUtil);
  const userService = new UserService(userRepository, passwordUtil);
  const patientService = new PatientService(patientRepository);
  const doctorService = new DoctorService(doctorRepository, userRepository, passwordUtil);
  const workScheduleService = new WorkScheduleService(doctorRepository, workScheduleRepository);
  const appointmentService = new AppointmentService(appointmentRepository, doctorRepository);

  return {
    authenticate: authenticate(jwtUtil),
    adminSeedService: new AdminSeedService(userRepository, passwordUtil),
    authController: new AuthController(authService),
    userController: new UserController(userService),
    patientController: new PatientController(patientService),
    doctorController: new DoctorController(doctorService),
    workScheduleController: new WorkScheduleController(workScheduleService),
    appointmentController: new AppointmentController(appointmentService),
  };
}
