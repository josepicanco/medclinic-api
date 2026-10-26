import { User } from '../../src/entities/user.entity';
import { ConflictError } from '../../src/errors/app-error';
import { CreateUserData, IUserRepository } from '../../src/repositories/user.repository';

export class InMemoryUserRepository implements IUserRepository {
  public readonly items: User[] = [];
  private nextId = 1;

  public async create(data: CreateUserData): Promise<User> {
    if (this.items.some((user) => user.email === data.email)) {
      throw new ConflictError('EMAIL_JA_CADASTRADO', 'Ja existe um usuario cadastrado com este e-mail.');
    }

    const now = new Date('2026-10-20T14:03:11.000Z');
    const user = Object.assign(new User(), { id: this.nextId++, ...data, createdAt: now, updatedAt: now });
    this.items.push(user);

    return user;
  }

  public async findById(id: number): Promise<User | null> {
    return this.items.find((user) => user.id === id) ?? null;
  }

  public async findByEmail(email: string): Promise<User | null> {
    return this.items.find((user) => user.email === email) ?? null;
  }

  public async existsByEmail(email: string): Promise<boolean> {
    return this.items.some((user) => user.email === email);
  }
}
