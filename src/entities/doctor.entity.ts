import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from './user.entity';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'varchar', length: 30, unique: true })
  public crm: string;

  @Column({ name: 'user_id', type: 'integer', unique: true })
  public userId: number;

  @OneToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  public user: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  public createdAt: Date;
}
