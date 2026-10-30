import { DataSource, Repository } from 'typeorm';

import { Patient } from '../entities/patient.entity';
import { ConflictError } from '../errors/app.error';
import { Page, PageRequest } from '../types/pagination.type';
import { likePattern, uniqueViolationConstraint } from '../utils/database.util';

export interface CreatePatientData {
  readonly name: string;
  readonly cpf: string;
}

export interface UpdatePatientData {
  readonly name?: string;
}

export interface PatientFilter extends PageRequest {
  readonly name?: string;
}

// pacientes removidos (soft delete) nao aparecem em nenhuma consulta
export interface IPatientRepository {
  create(data: CreatePatientData): Promise<Patient>;
  findById(id: number): Promise<Patient | null>;
  existsByCpf(cpf: string): Promise<boolean>;
  list(filter: PatientFilter): Promise<Page<Patient>>;
  update(id: number, data: UpdatePatientData): Promise<Patient | null>;
  softDelete(id: number): Promise<boolean>;
}

export class PatientRepository implements IPatientRepository {
  private readonly repository: Repository<Patient>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Patient);
  }

  public async create(data: CreatePatientData): Promise<Patient> {
    try {
      return await this.repository.save(this.repository.create(data));
    } catch (error) {
      if (uniqueViolationConstraint(error) === 'UQ_patients_cpf_active') {
        throw new ConflictError('CPF_JA_CADASTRADO', 'Já existe um paciente cadastrado com este CPF.');
      }

      throw error;
    }
  }

  public async findById(id: number): Promise<Patient | null> {
    return this.repository.findOne({ where: { id } });
  }

  public async existsByCpf(cpf: string): Promise<boolean> {
    return this.repository.exists({ where: { cpf } });
  }

  public async list(filter: PatientFilter): Promise<Page<Patient>> {
    const query = this.repository.createQueryBuilder('patient').orderBy('patient.id', 'ASC');

    if (filter.name) {
      query.where(`patient.name ILIKE :name ESCAPE '\\'`, { name: likePattern(filter.name) });
    }

    const [items, total] = await query
      .skip((filter.page - 1) * filter.pageSize)
      .take(filter.pageSize)
      .getManyAndCount();

    return { items, total, page: filter.page, pageSize: filter.pageSize };
  }

  public async update(id: number, data: UpdatePatientData): Promise<Patient | null> {
    const patient = await this.findById(id);

    if (!patient) {
      return null;
    }

    if (data.name !== undefined) {
      patient.name = data.name;
    }

    return this.repository.save(patient);
  }

  public async softDelete(id: number): Promise<boolean> {
    const result = await this.repository
      .createQueryBuilder()
      .softDelete()
      .where('id = :id', { id })
      .andWhere('deleted_at IS NULL')
      .execute();

    return (result.affected ?? 0) > 0;
  }
}
