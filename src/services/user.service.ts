import { CreateUserDTO } from '../dtos/create-user.dto';
import { UserResponseDTO, toUserResponseDTO } from '../dtos/user-response.dto';
import { UserRole } from '../enums/user-role.enum';
import { BadRequestError, ConflictError, NotFoundError } from '../errors/app.error';
import { IUserRepository } from '../repositories/user.repository';
import { IPasswordHasher } from '../utils/password.util';

export class UserService {
  private readonly userRepository: IUserRepository;
  private readonly passwordHasher: IPasswordHasher;

  constructor(userRepository: IUserRepository, passwordHasher: IPasswordHasher) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
  }

  // RF13: so admin chega aqui (conferido na rota). RN03: o perfil doctor nao sai por esta
  // rota porque nao existe acesso de medico sem CRM; medico nasce em POST /doctors
  public async create(data: CreateUserDTO): Promise<UserResponseDTO> {
    const roles = [...new Set(data.roles)];

    if (roles.includes(UserRole.DOCTOR)) {
      throw new BadRequestError('O perfil doctor é concedido apenas pelo cadastro de médico (POST /doctors).');
    }

    if (await this.userRepository.existsByEmail(data.email)) {
      throw new ConflictError('EMAIL_JA_CADASTRADO', 'Já existe um usuário cadastrado com este e-mail.');
    }

    const passwordHash = await this.passwordHasher.hash(data.password);
    const createdUser = await this.userRepository.create({ name: data.name, email: data.email, passwordHash, roles });

    return toUserResponseDTO(createdUser);
  }

  public async findProfileById(id: number): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundError('Usuário não encontrado.');
    }

    return toUserResponseDTO(user);
  }
}
