import { MedicalRecord } from '../../src/entities/medical-record.entity';
import { CreateMedicalRecordData, IMedicalRecordRepository } from '../../src/repositories/medical-record.repository';
import { Page, PageRequest } from '../../src/types/pagination.type';
import { paginate } from './paginate';

export class InMemoryMedicalRecordRepository implements IMedicalRecordRepository {
  public readonly items: MedicalRecord[] = [];
  private nextId = 1;
  private clock = Date.parse('2026-10-13T11:00:00.000Z');

  public async create(data: CreateMedicalRecordData): Promise<MedicalRecord> {
    this.clock += 60_000;
    const record = Object.assign(new MedicalRecord(), { id: this.nextId++, ...data, createdAt: new Date(this.clock) });
    this.items.push(record);

    return record;
  }

  public async listByPatient(patientId: number, request: PageRequest): Promise<Page<MedicalRecord>> {
    const records = this.items
      .filter((record) => record.patientId === patientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return paginate(records, request);
  }
}
