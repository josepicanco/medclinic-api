import { LoginDTO } from '../dtos/login.dto';
import { AuthResponseDTO } from '../dtos/user-response.dto';
import { InvalidCredentialsError } from '../errors/app.error';
import { IUserRepository } from '../repositories/user.repository';
import { ITokenProvider } from '../utils/jwt.util';
import { IPasswordHasher } from '../utils/password.util';

// hash fixo para comparar quando o e-mail nao existe: a resposta demora o mesmo
// tempo nos dois casos e nao entrega se o e-mail esta cadastrado
const DUMMY_HASH = '$2b$10$AdCyTzkobfE50FdF6z.u1.4.KE8/b7u0N5Efkb5Ihz4PUzLH9Sdqu';

export class AuthService {
  private readonly userRepository: IUserRepository;
  private readonly passwordHasher: IPasswordHasher;
  private readonly tokenProvider: ITokenProvider;

  constructor(userRepository: IUserRepository, passwordHasher: IPasswordHasher, tokenProvider: ITokenProvider) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenProvider = tokenProvider;
  }

  public async login(credentials: LoginDTO): Promise<AuthResponseDTO> {
    const user = await this.userRepository.findByEmail(credentials.email);
    const passwordMatches = await this.passwordHasher.compare(credentials.password, user?.passwordHash ?? DUMMY_HASH);

    // mesma resposta para e-mail ou senha errados
    if (!user || !passwordMatches) {
      throw new InvalidCredentialsError();
    }

    return { accessToken: this.tokenProvider.sign({ id: user.id, roles: user.roles }) };
  }
}
