import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';

@Entity('medical_records')
@Index('IDX_medical_records_patient_created', ['patientId', 'createdAt'])
export class MedicalRecord {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ name: 'patient_id', type: 'integer' })
  public patientId: number;

  @ManyToOne(() => Patient, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patient_id' })
  public patient?: Patient;

  @Column({ name: 'doctor_id', type: 'integer' })
  public doctorId: number;

  @ManyToOne(() => Doctor, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'doctor_id' })
  public doctor?: Doctor;

  @Column({ type: 'text' })
  public text: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  public createdAt: Date;
}
