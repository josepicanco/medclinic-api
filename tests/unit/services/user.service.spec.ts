import { beforeEach, describe, expect, it } from 'vitest';

import { UserRole } from '../../../src/enums/user-role.enum';
import { AdminSeedService } from '../../../src/services/admin-seed.service';
import { UserService } from '../../../src/services/user.service';
import { FakePasswordHasher } from '../../fakes/fake-password-hasher';
import { InMemoryUserRepository } from '../../fakes/in-memory-user.repository';

describe('UserService', () => {
  let userRepository: InMemoryUserRepository;
  let userService: UserService;
  const joana = { name: 'Joana Secretaria', email: 'joana@medclinic.com', password: 'SenhaForte@123' };

  beforeEach(() => {
    userRepository = new InMemoryUserRepository();
    userService = new UserService(userRepository, new FakePasswordHasher());
  });

  it('cria usuario guardando so o hash da senha, sem devolve-lo', async () => {
    const created = await userService.create({ ...joana, roles: [UserRole.SECRETARY] });

    expect(created).toEqual({ id: 1, name: joana.name, email: joana.email, roles: ['secretary'] });
    expect(userRepository.items[0].passwordHash).toBe('hashed:SenhaForte@123');
  });

  it('remove perfis repetidos', async () => {
    const created = await userService.create({
      ...joana,
      roles: [UserRole.SECRETARY, UserRole.SECRETARY, UserRole.ADMIN],
    });
    expect(created.roles).toEqual(['secretary', 'admin']);
  });

  it('recusa e-mail ja cadastrado', async () => {
    await userService.create({ ...joana, roles: [UserRole.SECRETARY] });
    await expect(userService.create({ ...joana, roles: [UserRole.ADMIN] })).rejects.toMatchObject({
      code: 'EMAIL_JA_CADASTRADO',
    });
  });

  it('nao concede o perfil doctor sem registro profissional (RN03)', async () => {
    await expect(userService.create({ ...joana, roles: [UserRole.DOCTOR] })).rejects.toMatchObject({
      code: 'DADOS_INVALIDOS',
    });
    expect(userRepository.items).toHaveLength(0);
  });

  it('busca o perfil do usuario autenticado', async () => {
    await userService.create({ ...joana, roles: [UserRole.SECRETARY] });

    await expect(userService.findProfileById(1)).resolves.toMatchObject({ email: joana.email });
    await expect(userService.findProfileById(99)).rejects.toMatchObject({ code: 'RECURSO_NAO_ENCONTRADO' });
  });
});

describe('AdminSeedService (RP07)', () => {
  it('cria o admin uma vez e nao duplica nas proximas execucoes', async () => {
    const userRepository = new InMemoryUserRepository();
    const seed = new AdminSeedService(userRepository, new FakePasswordHasher());
    const admin = { name: 'Administrador', email: 'admin@medclinic.com', password: 'SenhaForte@123' };

    await expect(seed.ensureAdmin(admin)).resolves.toBe('created');
    await expect(seed.ensureAdmin(admin)).resolves.toBe('already-exists');
    expect(userRepository.items).toHaveLength(1);
    expect(userRepository.items[0].roles).toEqual(['admin']);
  });
});
