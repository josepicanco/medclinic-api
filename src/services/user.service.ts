import { CreateUserDTO } from '../dtos/create-user.dto';
import { UserResponseDTO, toUserResponseDTO } from '../dtos/user-response.dto';
import { User } from '../entities/user.entity';
import { ConflictError, NotFoundError } from '../errors/app-error';
import { IUserRepository, UserRepository } from '../repositories/user.repository';
import { PasswordUtil } from '../utils/password.util';

export class UserService {
  private readonly userRepository: IUserRepository;

  constructor(userRepository: IUserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  public async register(data: CreateUserDTO): Promise<UserResponseDTO> {
    const emailAlreadyUsed = await this.userRepository.existsByEmail(data.email);

    if (emailAlreadyUsed) {
      throw new ConflictError('Já existe um usuário cadastrado com este e-mail.');
    }

    const passwordHash = await PasswordUtil.hash(data.password);

    const createdUser = await this.userRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
    });

    return toUserResponseDTO(createdUser);
  }

  public async findProfileById(id: string): Promise<UserResponseDTO> {
    const user = await this.findEntityById(id);
    return toUserResponseDTO(user);
  }

  private async findEntityById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundError('Usuário não encontrado.');
    }

    return user;
  }
}
