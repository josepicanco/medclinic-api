import { UserResponseDTO, toUserResponseDTO } from '../dtos/user-response.dto';
import { NotFoundError } from '../errors/app-error';
import { IUserRepository } from '../repositories/user.repository';

export class UserService {
  private readonly userRepository: IUserRepository;

  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  public async findProfileById(id: number): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundError('Usuário não encontrado.');
    }

    return toUserResponseDTO(user);
  }
}
