import { DataSource, Repository } from 'typeorm';

import { Doctor } from '../entities/doctor.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';
import { ConflictError } from '../errors/app.error';
import { Page, PageRequest } from '../types/pagination.type';
import { likePattern, uniqueViolationConstraint } from '../utils/database.util';

export interface CreateDoctorData {
  readonly crm: string;
  readonly name: string;
  readonly email: string;
  readonly passwordHash: string;
}

export interface DoctorFilter extends PageRequest {
  readonly name?: string;
}

export interface IDoctorRepository {
  // RN03: usuario e medico na mesma transacao; se um falha nada e gravado
  createWithUser(data: CreateDoctorData): Promise<Doctor>;
  findById(id: number): Promise<Doctor | null>;
  findByUserId(userId: number): Promise<Doctor | null>;
  existsByCrm(crm: string): Promise<boolean>;
  list(filter: DoctorFilter): Promise<Page<Doctor>>;
}

export class DoctorRepository implements IDoctorRepository {
  private readonly dataSource: DataSource;
  private readonly repository: Repository<Doctor>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.repository = dataSource.getRepository(Doctor);
  }

  public async createWithUser(data: CreateDoctorData): Promise<Doctor> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const user = await manager.save(
          manager.create(User, {
            name: data.name,
            email: data.email,
            passwordHash: data.passwordHash,
            roles: [UserRole.DOCTOR],
          }),
        );
        const doctor = await manager.save(manager.create(Doctor, { crm: data.crm, userId: user.id }));
        doctor.user = user;

        return doctor;
      });
    } catch (error) {
      const constraint = uniqueViolationConstraint(error);

      if (constraint === 'UQ_users_email') {
        throw new ConflictError('EMAIL_JA_CADASTRADO', 'Já existe um usuário cadastrado com este e-mail.');
      }

      if (constraint === 'UQ_doctors_crm') {
        throw new ConflictError('CRM_JA_CADASTRADO', 'Já existe um médico cadastrado com este CRM.');
      }

      throw error;
    }
  }

  public async findById(id: number): Promise<Doctor | null> {
    return this.repository.findOne({ where: { id }, relations: { user: true } });
  }

  public async findByUserId(userId: number): Promise<Doctor | null> {
    return this.repository.findOne({ where: { userId }, relations: { user: true } });
  }

  public async existsByCrm(crm: string): Promise<boolean> {
    return this.repository.exists({ where: { crm } });
  }

  public async list(filter: DoctorFilter): Promise<Page<Doctor>> {
    const query = this.repository
      .createQueryBuilder('doctor')
      .innerJoinAndSelect('doctor.user', 'user')
      .orderBy('doctor.id', 'ASC');

    if (filter.name) {
      query.where(`user.name ILIKE :name ESCAPE '\\'`, { name: likePattern(filter.name) });
    }

    const [items, total] = await query
      .skip((filter.page - 1) * filter.pageSize)
      .take(filter.pageSize)
      .getManyAndCount();

    return { items, total, page: filter.page, pageSize: filter.pageSize };
  }
}
