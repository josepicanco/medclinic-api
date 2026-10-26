import { beforeEach, describe, expect, it } from 'vitest';

import { PatientService } from '../../../src/services/patient.service';
import { InMemoryPatientRepository } from '../../fakes/in-memory-patient.repository';

describe('PatientService (RF02)', () => {
  let patientRepository: InMemoryPatientRepository;
  let patientService: PatientService;
  const page = { page: 1, pageSize: 20 };

  beforeEach(() => {
    patientRepository = new InMemoryPatientRepository();
    patientService = new PatientService(patientRepository);
  });

  it('cadastra paciente e devolve createdAt em UTC', async () => {
    await expect(patientService.create({ name: 'Carlos Pereira', cpf: '12345678901' })).resolves.toEqual({
      id: 1,
      name: 'Carlos Pereira',
      cpf: '12345678901',
      createdAt: '2026-10-20T14:03:11.000Z',
    });
  });

  it('recusa CPF repetido sem criar segundo registro (RN02)', async () => {
    await patientService.create({ name: 'Carlos Pereira', cpf: '12345678901' });

    await expect(patientService.create({ name: 'Outro', cpf: '12345678901' })).rejects.toMatchObject({
      code: 'CPF_JA_CADASTRADO',
    });
    expect(patientRepository.items).toHaveLength(1);
  });

  it('lista paginado com busca parcial por nome', async () => {
    await patientService.create({ name: 'Carlos Pereira', cpf: '11111111111' });
    await patientService.create({ name: 'Maria Souza', cpf: '22222222222' });

    await expect(patientService.list({ ...page, name: 'souza' })).resolves.toEqual({
      data: [expect.objectContaining({ name: 'Maria Souza' })],
      meta: { total: 1, page: 1, pageSize: 20, totalPages: 1 },
    });
  });

  it('consulta, altera e remove por id', async () => {
    const { id } = await patientService.create({ name: 'Carlos Pereira', cpf: '12345678901' });

    await expect(patientService.findById(id)).resolves.toMatchObject({ id });
    await expect(patientService.update(id, { name: 'Carlos P.' })).resolves.toMatchObject({ name: 'Carlos P.' });
    await patientService.remove(id);
    await expect(patientService.findById(id)).rejects.toMatchObject({ code: 'RECURSO_NAO_ENCONTRADO' });
  });

  it('responde RECURSO_NAO_ENCONTRADO para paciente inexistente', async () => {
    await expect(patientService.findById(9)).rejects.toMatchObject({ code: 'RECURSO_NAO_ENCONTRADO' });
    await expect(patientService.update(9, { name: 'x' })).rejects.toMatchObject({ code: 'RECURSO_NAO_ENCONTRADO' });
    await expect(patientService.remove(9)).rejects.toMatchObject({ code: 'RECURSO_NAO_ENCONTRADO' });
  });
});
