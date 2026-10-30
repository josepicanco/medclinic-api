import { Patient } from '../../src/entities/patient.entity';
import {
  CreatePatientData,
  IPatientRepository,
  PatientFilter,
  UpdatePatientData,
} from '../../src/repositories/patient.repository';
import { Page } from '../../src/types/pagination.type';
import { paginate } from './paginate.fake';

export class InMemoryPatientRepository implements IPatientRepository {
  public readonly items: Patient[] = [];
  private nextId = 1;

  public async create(data: CreatePatientData): Promise<Patient> {
    const now = new Date('2026-10-20T14:03:11.000Z');
    const patient = Object.assign(new Patient(), {
      id: this.nextId++,
      ...data,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    this.items.push(patient);

    return patient;
  }

  public async findById(id: number): Promise<Patient | null> {
    return this.active().find((patient) => patient.id === id) ?? null;
  }

  public async existsByCpf(cpf: string): Promise<boolean> {
    return this.active().some((patient) => patient.cpf === cpf);
  }

  public async list(filter: PatientFilter): Promise<Page<Patient>> {
    const term = filter.name?.toLowerCase();
    return paginate(
      this.active().filter((patient) => !term || patient.name.toLowerCase().includes(term)),
      filter,
    );
  }

  public async update(id: number, data: UpdatePatientData): Promise<Patient | null> {
    const patient = await this.findById(id);

    if (patient && data.name !== undefined) {
      patient.name = data.name;
    }

    return patient;
  }

  public async softDelete(id: number): Promise<boolean> {
    const patient = await this.findById(id);

    if (!patient) {
      return false;
    }

    patient.deletedAt = new Date();
    return true;
  }

  private active(): Patient[] {
    return this.items.filter((patient) => patient.deletedAt === null);
  }
}
