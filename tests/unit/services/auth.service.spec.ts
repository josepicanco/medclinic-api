import { beforeEach, describe, expect, it } from 'vitest';

import { UserRole } from '../../../src/enums/user-role.enum';
import { AppError } from '../../../src/errors/app-error';
import { AuthService } from '../../../src/services/auth.service';
import { FakePasswordHasher } from '../../fakes/fake-password-hasher';
import { FakeTokenProvider } from '../../fakes/fake-token-provider';
import { InMemoryUserRepository } from '../../fakes/in-memory-user.repository';

describe('AuthService (RF01)', () => {
  let userRepository: InMemoryUserRepository;
  let passwordHasher: FakePasswordHasher;
  let authService: AuthService;

  beforeEach(async () => {
    userRepository = new InMemoryUserRepository();
    passwordHasher = new FakePasswordHasher();
    authService = new AuthService(userRepository, passwordHasher, new FakeTokenProvider());

    await userRepository.create({
      name: 'Administrador',
      email: 'admin@medclinic.com',
      passwordHash: 'hashed:SenhaForte@123',
      roles: [UserRole.ADMIN],
    });
  });

  it('devolve accessToken com o id e os perfis do usuario', async () => {
    const result = await authService.login({ email: 'admin@medclinic.com', password: 'SenhaForte@123' });
    expect(result).toEqual({ accessToken: 'token:1:admin' });
  });

  it('compara a senha informada com o hash guardado', async () => {
    await authService.login({ email: 'admin@medclinic.com', password: 'SenhaForte@123' });
    expect(passwordHasher.compareCalls).toEqual([
      { plainPassword: 'SenhaForte@123', passwordHash: 'hashed:SenhaForte@123' },
    ]);
  });

  it('recusa senha errada com CREDENCIAIS_INVALIDAS', async () => {
    await expect(authService.login({ email: 'admin@medclinic.com', password: 'errada' })).rejects.toMatchObject({
      code: 'CREDENCIAIS_INVALIDAS',
    });
  });

  it('recusa e-mail inexistente com o mesmo erro, comparando um hash mesmo assim', async () => {
    const error: unknown = await authService
      .login({ email: 'nao@existe.com', password: 'SenhaForte@123' })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ code: 'CREDENCIAIS_INVALIDAS' });
    expect(passwordHasher.compareCalls).toHaveLength(1);
  });
});
