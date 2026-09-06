import { DataSource, Repository } from 'typeorm';

import { AppDataSource } from '../database/data-source';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';

export interface CreateUserData {
  readonly name: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: UserRole;
}

export interface IUserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  existsByEmail(email: string): Promise<boolean>;
}

export class UserRepository implements IUserRepository {
  private readonly repository: Repository<User>;

  constructor(dataSource: DataSource = AppDataSource) {
    this.repository = dataSource.getRepository(User);
  }

  public async create(data: CreateUserData): Promise<User> {
    const user = this.repository.create(data);
    return this.repository.save(user);
  }

  public async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  public async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  public async existsByEmail(email: string): Promise<boolean> {
    const total = await this.repository.count({ where: { email } });
    return total > 0;
  }
}
