import { Doctor } from '../../src/entities/doctor.entity';
import { UserRole } from '../../src/enums/user-role.enum';
import { CreateDoctorData, DoctorFilter, IDoctorRepository } from '../../src/repositories/doctor.repository';
import { Page } from '../../src/types/pagination.types';
import { InMemoryUserRepository } from './in-memory-user.repository';
import { paginate } from './paginate';

export class InMemoryDoctorRepository implements IDoctorRepository {
  public readonly items: Doctor[] = [];
  private readonly userRepository: InMemoryUserRepository;
  private nextId = 1;

  constructor(userRepository: InMemoryUserRepository) {
    this.userRepository = userRepository;
  }

  public async createWithUser(data: CreateDoctorData): Promise<Doctor> {
    const user = await this.userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      roles: [UserRole.DOCTOR],
    });
    const doctor = Object.assign(new Doctor(), {
      id: this.nextId++,
      crm: data.crm,
      userId: user.id,
      user,
      createdAt: user.createdAt,
    });
    this.items.push(doctor);

    return doctor;
  }

  public async findById(id: number): Promise<Doctor | null> {
    return this.items.find((doctor) => doctor.id === id) ?? null;
  }

  public async findByUserId(userId: number): Promise<Doctor | null> {
    return this.items.find((doctor) => doctor.userId === userId) ?? null;
  }

  public async existsByCrm(crm: string): Promise<boolean> {
    return this.items.some((doctor) => doctor.crm === crm);
  }

  public async list(filter: DoctorFilter): Promise<Page<Doctor>> {
    const term = filter.name?.toLowerCase();
    return paginate(
      this.items.filter((doctor) => !term || doctor.user.name.toLowerCase().includes(term)),
      filter,
    );
  }
}
