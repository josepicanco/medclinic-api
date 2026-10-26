import { Appointment } from '../../src/entities/appointment.entity';
import { AppointmentStatus } from '../../src/enums/appointment-status.enum';
import {
  AppointmentFilter,
  CreateAppointmentData,
  IAppointmentRepository,
  IBookingTransaction,
} from '../../src/repositories/appointment.repository';
import { Period, periodsOverlap } from '../../src/rules/period.rules';
import { Page } from '../../src/types/pagination.types';
import { InMemoryDoctorRepository } from './in-memory-doctor.repository';
import { InMemoryPatientRepository } from './in-memory-patient.repository';
import { InMemoryWorkScheduleRepository } from './in-memory-work-schedule.repository';
import { paginate } from './paginate';

export class InMemoryAppointmentRepository implements IAppointmentRepository {
  public readonly items: Appointment[] = [];
  public readonly lockedDoctors: number[] = [];
  private readonly doctorRepository: InMemoryDoctorRepository;
  private readonly patientRepository: InMemoryPatientRepository;
  private readonly workScheduleRepository: InMemoryWorkScheduleRepository;
  private nextId = 1;

  constructor(
    doctorRepository: InMemoryDoctorRepository,
    patientRepository: InMemoryPatientRepository,
    workScheduleRepository: InMemoryWorkScheduleRepository,
  ) {
    this.doctorRepository = doctorRepository;
    this.patientRepository = patientRepository;
    this.workScheduleRepository = workScheduleRepository;
  }

  // insere direto, sem validacao, para montar o cenario do teste
  public seed(data: CreateAppointmentData & { status?: AppointmentStatus }): Appointment {
    const appointment = Object.assign(new Appointment(), {
      id: this.nextId++,
      status: AppointmentStatus.SCHEDULED,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    });
    this.items.push(appointment);

    return appointment;
  }

  public async runBookingTransaction<T>(work: (transaction: IBookingTransaction) => Promise<T>): Promise<T> {
    return work({
      lockDoctor: async (doctorId) => {
        this.lockedDoctors.push(doctorId);
        return (await this.doctorRepository.findById(doctorId)) !== null;
      },
      lockPatient: async (patientId) => (await this.patientRepository.findById(patientId)) !== null,
      findShifts: (doctorId) => this.workScheduleRepository.findByDoctorId(doctorId),
      hasActiveOverlapForDoctor: async (doctorId, period) =>
        this.hasActiveOverlap((appointment) => appointment.doctorId === doctorId, period),
      hasActiveOverlapForPatient: async (patientId, period) =>
        this.hasActiveOverlap((appointment) => appointment.patientId === patientId, period),
      create: async (data) => this.seed(data),
    });
  }

  public async findById(id: number): Promise<Appointment | null> {
    return this.items.find((appointment) => appointment.id === id) ?? null;
  }

  public async list(filter: AppointmentFilter): Promise<Page<Appointment>> {
    const matches = this.items.filter(
      (appointment) =>
        (filter.doctorId === undefined || appointment.doctorId === filter.doctorId) &&
        (filter.patientId === undefined || appointment.patientId === filter.patientId) &&
        (filter.status === undefined || appointment.status === filter.status) &&
        (!filter.startsFrom || appointment.startsAt >= filter.startsFrom) &&
        (!filter.startsBefore || appointment.startsAt < filter.startsBefore),
    );

    return paginate(matches, filter);
  }

  private hasActiveOverlap(owner: (appointment: Appointment) => boolean, period: Period): boolean {
    return this.items.some(
      (appointment) =>
        owner(appointment) && appointment.status !== AppointmentStatus.CANCELLED && periodsOverlap(appointment, period),
    );
  }
}
