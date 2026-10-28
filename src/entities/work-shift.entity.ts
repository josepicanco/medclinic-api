import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Doctor } from './doctor.entity';

// horarios em minutos desde 00:00 no horario local da clinica
@Entity('work_shifts')
@Index('IDX_work_shifts_doctor', ['doctorId'])
export class WorkShift {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: 'doctor_id', type: 'integer' })
  public doctorId: number;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  public doctor?: Doctor;

  @Column({ name: 'week_day', type: 'smallint' })
  public weekDay: number;

  @Column({ name: 'start_minutes', type: 'smallint' })
  public startMinutes: number;

  @Column({ name: 'end_minutes', type: 'smallint' })
  public endMinutes: number;

  @Column({ name: 'slot_duration_minutes', type: 'smallint' })
  public slotDurationMinutes: number;
}
