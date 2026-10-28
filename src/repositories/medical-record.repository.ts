import { DataSource, Repository } from 'typeorm';

import { MedicalRecord } from '../entities/medical-record.entity';
import { Page, PageRequest } from '../types/pagination.types';

export interface CreateMedicalRecordData {
  readonly patientId: number;
  readonly doctorId: number;
  readonly text: string;
}

export interface IMedicalRecordRepository {
  create(data: CreateMedicalRecordData): Promise<MedicalRecord>;
  // mais recente primeiro
  listByPatient(patientId: number, page: PageRequest): Promise<Page<MedicalRecord>>;
}

export class MedicalRecordRepository implements IMedicalRecordRepository {
  private readonly repository: Repository<MedicalRecord>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(MedicalRecord);
  }

  public async create(data: CreateMedicalRecordData): Promise<MedicalRecord> {
    return this.repository.save(this.repository.create(data));
  }

  public async listByPatient(patientId: number, page: PageRequest): Promise<Page<MedicalRecord>> {
    const [items, total] = await this.repository.findAndCount({
      where: { patientId },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (page.page - 1) * page.pageSize,
      take: page.pageSize,
    });

    return { items, total, page: page.page, pageSize: page.pageSize };
  }
}
