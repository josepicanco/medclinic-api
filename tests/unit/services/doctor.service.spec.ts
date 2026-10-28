import { beforeEach, describe, expect, it } from 'vitest';

import { DoctorService } from '../../../src/services/doctor.service';
import { Fakes, buildFakes } from '../../fakes/build-fakes';

describe('DoctorService (RF03)', () => {
  let fakes: Fakes;
  let doctorService: DoctorService;
  const helena = {
    name: 'Dra. Helena Souza',
    email: 'helena@medclinic.com',
    password: 'SenhaForte@123',
    crm: 'CRM-SC-54321',
  };

  beforeEach(() => {
    fakes = buildFakes();
    doctorService = new DoctorService(fakes.doctorRepository, fakes.userRepository, fakes.passwordHasher);
  });

  it('cria o usuario com perfil doctor e o registro profissional juntos', async () => {
    await expect(doctorService.create(helena)).resolves.toEqual({
      id: 1,
      crm: 'CRM-SC-54321',
      user: { id: 1, name: helena.name, email: helena.email, roles: ['doctor'] },
    });
    expect(fakes.userRepository.items[0].passwordHash).toBe('hashed:SenhaForte@123');
  });

  it('recusa CRM repetido sem criar o usuario (RN03)', async () => {
    await doctorService.create(helena);

    await expect(doctorService.create({ ...helena, email: 'novo@medclinic.com' })).rejects.toMatchObject({
      code: 'CRM_JA_CADASTRADO',
    });
    await expect(fakes.userRepository.existsByEmail('novo@medclinic.com')).resolves.toBe(false);
  });

  it('recusa e-mail repetido', async () => {
    await doctorService.create(helena);

    await expect(doctorService.create({ ...helena, crm: 'CRM-SC-99999' })).rejects.toMatchObject({
      code: 'EMAIL_JA_CADASTRADO',
    });
    expect(fakes.doctorRepository.items).toHaveLength(1);
  });

  it('lista com busca por nome e consulta por id', async () => {
    await doctorService.create(helena);
    await doctorService.create({ ...helena, name: 'Dr. Rui Alves', email: 'rui@medclinic.com', crm: 'CRM-SC-11111' });

    const page = await doctorService.list({ page: 1, pageSize: 20, name: 'rui' });
    expect(page.data.map((doctor) => doctor.crm)).toEqual(['CRM-SC-11111']);
    await expect(doctorService.findById(1)).resolves.toMatchObject({ crm: 'CRM-SC-54321' });
    await expect(doctorService.findById(99)).rejects.toMatchObject({ code: 'RECURSO_NAO_ENCONTRADO' });
  });
});
