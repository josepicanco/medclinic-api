import { UserRole } from '../enums/user-role.enum';
import { IUserRepository } from '../repositories/user.repository';
import { IPasswordHasher } from '../utils/password.util';

export interface AdminSeedInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
}

export type AdminSeedResult = 'created' | 'already-exists';

// RP07: o primeiro admin sai das variaveis de ambiente; rodar de novo nao duplica
export class AdminSeedService {
  private readonly userRepository: IUserRepository;
  private readonly passwordHasher: IPasswordHasher;

  constructor(userRepository: IUserRepository, passwordHasher: IPasswordHasher) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
  }

  public async ensureAdmin(admin: AdminSeedInput): Promise<AdminSeedResult> {
    if (await this.userRepository.existsByEmail(admin.email)) {
      return 'already-exists';
    }

    const passwordHash = await this.passwordHasher.hash(admin.password);
    await this.userRepository.create({ name: admin.name, email: admin.email, passwordHash, roles: [UserRole.ADMIN] });

    return 'created';
  }
}
