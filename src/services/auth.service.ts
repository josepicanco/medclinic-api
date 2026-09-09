import { env } from '../config/env';
import { LoginDTO } from '../dtos/login.dto';
import { AuthResponseDTO, toUserResponseDTO } from '../dtos/user-response.dto';
import { UnauthorizedError } from '../errors/app-error';
import { IUserRepository, UserRepository } from '../repositories/user.repository';
import { JwtUtil } from '../utils/jwt.util';
import { PasswordUtil } from '../utils/password.util';

export class AuthService {
  private readonly userRepository: IUserRepository;

  constructor(userRepository: IUserRepository = new UserRepository()) {
    this.userRepository = userRepository;
  }

  public async login(credentials: LoginDTO): Promise<AuthResponseDTO> {
    // mesma mensagem para e-mail ou senha errados
    const invalidCredentials = new UnauthorizedError('E-mail ou senha inválidos.');

    const user = await this.userRepository.findByEmail(credentials.email);

    if (!user) {
      throw invalidCredentials;
    }

    const passwordMatches = await PasswordUtil.compare(credentials.password, user.passwordHash);

    if (!passwordMatches) {
      throw invalidCredentials;
    }

    const token = JwtUtil.sign({ sub: user.id, role: user.role });

    return {
      user: toUserResponseDTO(user),
      token,
      expiresIn: env.jwt.expiresIn,
    };
  }
}
