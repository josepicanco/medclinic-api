import { DataSource, EntityManager, Repository } from 'typeorm';

import { Appointment } from '../entities/appointment.entity';
import { Doctor } from '../entities/doctor.entity';
import { Patient } from '../entities/patient.entity';
import { WorkShift } from '../entities/work-shift.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { Period } from '../rules/period.rules';
import { Page, PageRequest } from '../types/pagination.type';

export interface CreateAppointmentData {
  readonly doctorId: number;
  readonly patientId: number;
  readonly startsAt: Date;
  readonly endsAt: Date;
}

export interface AppointmentFilter extends PageRequest {
  readonly doctorId?: number;
  readonly patientId?: number;
  readonly status?: AppointmentStatus;
  readonly startsFrom?: Date; // inclusivo
  readonly startsBefore?: Date; // exclusivo
}

// operacoes que rodam dentro da transacao do agendamento (RF07)
export interface IBookingTransaction {
  lockDoctor(doctorId: number): Promise<boolean>;
  lockPatient(patientId: number): Promise<boolean>;
  findShifts(doctorId: number): Promise<WorkShift[]>;
  hasActiveOverlapForDoctor(doctorId: number, period: Period): Promise<boolean>;
  hasActiveOverlapForPatient(patientId: number, period: Period): Promise<boolean>;
  create(data: CreateAppointmentData): Promise<Appointment>;
}

export interface IAppointmentRepository {
  runBookingTransaction<T>(work: (transaction: IBookingTransaction) => Promise<T>): Promise<T>;
  findById(id: number): Promise<Appointment | null>;
  list(filter: AppointmentFilter): Promise<Page<Appointment>>;
  findActiveByDoctorInPeriod(doctorId: number, period: Period): Promise<Appointment[]>;
  updateStatus(appointment: Appointment, status: AppointmentStatus): Promise<Appointment>;
  existsWithStatus(doctorId: number, patientId: number, statuses: readonly AppointmentStatus[]): Promise<boolean>;
}

// tudo aqui dentro usa o EntityManager da transacao: o repositorio injetado rodaria fora dela
class BookingTransaction implements IBookingTransaction {
  private readonly manager: EntityManager;

  constructor(manager: EntityManager) {
    this.manager = manager;
  }

  // trava a linha do medico e nao as de consulta: numa agenda vazia nao haveria o que travar
  public async lockDoctor(doctorId: number): Promise<boolean> {
    const doctor = await this.manager
      .getRepository(Doctor)
      .createQueryBuilder('doctor')
      .setLock('pessimistic_write')
      .where('doctor.id = :doctorId', { doctorId })
      .getOne();

    return doctor !== null;
  }

  public async lockPatient(patientId: number): Promise<boolean> {
    const patient = await this.manager
      .getRepository(Patient)
      .createQueryBuilder('patient')
      .setLock('pessimistic_write')
      .where('patient.id = :patientId', { patientId })
      .andWhere('patient.deletedAt IS NULL')
      .getOne();

    return patient !== null;
  }

  public async findShifts(doctorId: number): Promise<WorkShift[]> {
    return this.manager.getRepository(WorkShift).find({ where: { doctorId } });
  }

  public async hasActiveOverlapForDoctor(doctorId: number, period: Period): Promise<boolean> {
    return this.hasActiveOverlap('appointment.doctorId = :ownerId', doctorId, period);
  }

  public async hasActiveOverlapForPatient(patientId: number, period: Period): Promise<boolean> {
    return this.hasActiveOverlap('appointment.patientId = :ownerId', patientId, period);
  }

  public async create(data: CreateAppointmentData): Promise<Appointment> {
    const repository = this.manager.getRepository(Appointment);
    return repository.save(repository.create({ ...data, status: AppointmentStatus.SCHEDULED }));
  }

  private async hasActiveOverlap(ownerCondition: string, ownerId: number, period: Period): Promise<boolean> {
    return this.manager
      .getRepository(Appointment)
      .createQueryBuilder('appointment')
      .where(ownerCondition, { ownerId })
      .andWhere('appointment.status <> :cancelled', { cancelled: AppointmentStatus.CANCELLED })
      .andWhere('appointment.startsAt < :endsAt', { endsAt: period.endsAt })
      .andWhere('appointment.endsAt > :startsAt', { startsAt: period.startsAt })
      .getExists();
  }
}

export class AppointmentRepository implements IAppointmentRepository {
  private readonly dataSource: DataSource;
  private readonly repository: Repository<Appointment>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.repository = dataSource.getRepository(Appointment);
  }

  public async runBookingTransaction<T>(work: (transaction: IBookingTransaction) => Promise<T>): Promise<T> {
    return this.dataSource.transaction((manager) => work(new BookingTransaction(manager)));
  }

  public async findById(id: number): Promise<Appointment | null> {
    return this.repository.findOne({ where: { id } });
  }

  public async list(filter: AppointmentFilter): Promise<Page<Appointment>> {
    const query = this.repository
      .createQueryBuilder('appointment')
      .orderBy('appointment.startsAt', 'ASC')
      .addOrderBy('appointment.id', 'ASC');

    if (filter.doctorId !== undefined) {
      query.andWhere('appointment.doctorId = :doctorId', { doctorId: filter.doctorId });
    }

    if (filter.patientId !== undefined) {
      query.andWhere('appointment.patientId = :patientId', { patientId: filter.patientId });
    }

    if (filter.status !== undefined) {
      query.andWhere('appointment.status = :status', { status: filter.status });
    }

    if (filter.startsFrom) {
      query.andWhere('appointment.startsAt >= :startsFrom', { startsFrom: filter.startsFrom });
    }

    if (filter.startsBefore) {
      query.andWhere('appointment.startsAt < :startsBefore', { startsBefore: filter.startsBefore });
    }

    const [items, total] = await query
      .skip((filter.page - 1) * filter.pageSize)
      .take(filter.pageSize)
      .getManyAndCount();

    return { items, total, page: filter.page, pageSize: filter.pageSize };
  }

  public async findActiveByDoctorInPeriod(doctorId: number, period: Period): Promise<Appointment[]> {
    return this.repository
      .createQueryBuilder('appointment')
      .where('appointment.doctorId = :doctorId', { doctorId })
      .andWhere('appointment.status <> :cancelled', { cancelled: AppointmentStatus.CANCELLED })
      .andWhere('appointment.startsAt < :endsAt', { endsAt: period.endsAt })
      .andWhere('appointment.endsAt > :startsAt', { startsAt: period.startsAt })
      .orderBy('appointment.startsAt', 'ASC')
      .getMany();
  }

  public async updateStatus(appointment: Appointment, status: AppointmentStatus): Promise<Appointment> {
    appointment.status = status;
    return this.repository.save(appointment);
  }

  public async existsWithStatus(
    doctorId: number,
    patientId: number,
    statuses: readonly AppointmentStatus[],
  ): Promise<boolean> {
    return this.repository
      .createQueryBuilder('appointment')
      .where('appointment.doctorId = :doctorId', { doctorId })
      .andWhere('appointment.patientId = :patientId', { patientId })
      .andWhere('appointment.status IN (:...statuses)', { statuses })
      .getExists();
  }
}
