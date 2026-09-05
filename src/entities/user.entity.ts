import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { UserRole } from '../enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'varchar', length: 120 })
  public name: string;

  @Column({ type: 'varchar', length: 180, unique: true })
  public email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: true })
  public passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ATENDENTE })
  public role: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  public updatedAt: Date;
}
