import { WorkShift } from '../../src/entities/work-shift.entity';
import { IWorkScheduleRepository, ShiftData } from '../../src/repositories/work-schedule.repository';

export class InMemoryWorkScheduleRepository implements IWorkScheduleRepository {
  private readonly byDoctor = new Map<number, WorkShift[]>();
  private nextId = 1;

  public async findByDoctorId(doctorId: number): Promise<WorkShift[]> {
    return [...(this.byDoctor.get(doctorId) ?? [])];
  }

  public async replace(doctorId: number, shifts: readonly ShiftData[]): Promise<WorkShift[]> {
    const saved = shifts.map((shift) => Object.assign(new WorkShift(), { id: this.nextId++, doctorId, ...shift }));
    this.byDoctor.set(doctorId, saved);

    return [...saved];
  }
}
