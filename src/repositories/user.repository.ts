import { DataSource, Repository } from 'typeorm';

import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';
import { ConflictError } from '../errors/app-error';
import { uniqueViolationConstraint } from '../utils/database.util';

export interface CreateUserData {
  readonly name: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly roles: UserRole[];
}

export interface IUserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  existsByEmail(email: string): Promise<boolean>;
}

export class UserRepository implements IUserRepository {
  private readonly repository: Repository<User>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(User);
  }

  public async create(data: CreateUserData): Promise<User> {
    try {
      return await this.repository.save(this.repository.create(data));
    } catch (error) {
      // duas gravacoes ao mesmo tempo: quem barra e a restricao do banco
      if (uniqueViolationConstraint(error) === 'UQ_users_email') {
        throw new ConflictError('EMAIL_JA_CADASTRADO', 'Já existe um usuário cadastrado com este e-mail.');
      }

      throw error;
    }
  }

  public async findById(id: number): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  public async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  public async existsByEmail(email: string): Promise<boolean> {
    return this.repository.exists({ where: { email } });
  }
}
