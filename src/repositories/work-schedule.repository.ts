import { DataSource, Repository } from 'typeorm';

import { WorkShift } from '../entities/work-shift.entity';

export interface ShiftData {
  readonly weekDay: number;
  readonly startMinutes: number;
  readonly endMinutes: number;
  readonly slotDurationMinutes: number;
}

export interface IWorkScheduleRepository {
  findByDoctorId(doctorId: number): Promise<WorkShift[]>;
  // substitui a escala inteira; lista vazia apaga a escala
  replace(doctorId: number, shifts: readonly ShiftData[]): Promise<WorkShift[]>;
}

export class WorkScheduleRepository implements IWorkScheduleRepository {
  private readonly dataSource: DataSource;
  private readonly repository: Repository<WorkShift>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.repository = dataSource.getRepository(WorkShift);
  }

  public async findByDoctorId(doctorId: number): Promise<WorkShift[]> {
    return this.repository.find({ where: { doctorId }, order: { weekDay: 'ASC', startMinutes: 'ASC' } });
  }

  public async replace(doctorId: number, shifts: readonly ShiftData[]): Promise<WorkShift[]> {
    return this.dataSource.transaction(async (manager) => {
      await manager.delete(WorkShift, { doctorId });

      if (shifts.length === 0) {
        return [];
      }

      const saved = await manager.save(shifts.map((shift) => manager.create(WorkShift, { ...shift, doctorId })));
      return saved.sort((a, b) => a.weekDay - b.weekDay || a.startMinutes - b.startMinutes);
    });
  }
}
