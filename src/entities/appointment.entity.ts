import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { AppointmentStatus } from '../enums/appointment-status.enum';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';

@Entity('appointments')
@Index('IDX_appointments_doctor_period', ['doctorId', 'startsAt', 'endsAt'])
@Index('IDX_appointments_patient_period', ['patientId', 'startsAt', 'endsAt'])
export class Appointment {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: 'doctor_id', type: 'integer' })
  public doctorId: number;

  @ManyToOne(() => Doctor, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'doctor_id' })
  public doctor?: Doctor;

  @Column({ name: 'patient_id', type: 'integer' })
  public patientId: number;

  @ManyToOne(() => Patient, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patient_id' })
  public patient?: Patient;

  @Column({ name: 'starts_at', type: 'timestamp with time zone' })
  public startsAt: Date;

  // RN15: o fim fica gravado e nao e recalculado pela escala
  @Column({ name: 'ends_at', type: 'timestamp with time zone' })
  public endsAt: Date;

  @Column({ type: 'varchar', length: 20, default: AppointmentStatus.SCHEDULED })
  public status: AppointmentStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  public updatedAt: Date;
}
