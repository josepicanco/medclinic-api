import { beforeEach, describe, expect, it } from 'vitest';

import { AppointmentStatus } from '../../../src/enums/appointment-status.enum';
import { UserRole } from '../../../src/enums/user-role.enum';
import { MedicalRecordService } from '../../../src/services/medical-record.service';
import { AuthenticatedUser } from '../../../src/types/authenticated-user.type';
import { Fakes, buildFakes } from '../../fakes/build.fake';

const page = { page: 1, pageSize: 20 };

describe('MedicalRecordService (RF09 / RN14)', () => {
  let fakes: Fakes;
  let medicalRecordService: MedicalRecordService;
  let bonded: AuthenticatedUser;
  let notBonded: AuthenticatedUser;
  const admin: AuthenticatedUser = { id: 100, roles: [UserRole.ADMIN] };
  const secretary: AuthenticatedUser = { id: 101, roles: [UserRole.SECRETARY] };

  const appointment = (doctorId: number, status: AppointmentStatus) =>
    fakes.appointmentRepository.seed({
      doctorId,
      patientId: 1,
      startsAt: new Date('2026-10-13T11:00:00Z'),
      endsAt: new Date('2026-10-13T11:30:00Z'),
      status,
    });

  beforeEach(async () => {
    fakes = buildFakes();
    medicalRecordService = new MedicalRecordService(
      fakes.medicalRecordRepository,
      fakes.patientRepository,
      fakes.doctorRepository,
      fakes.appointmentRepository,
    );

    const doctor1 = await fakes.doctorRepository.createWithUser({
      crm: 'CRM-1',
      name: 'Helena',
      email: 'h@m.com',
      passwordHash: 'x',
    });
    const doctor2 = await fakes.doctorRepository.createWithUser({
      crm: 'CRM-2',
      name: 'Rui',
      email: 'r@m.com',
      passwordHash: 'x',
    });
    bonded = { id: doctor1.userId, roles: [UserRole.DOCTOR] };
    notBonded = { id: doctor2.userId, roles: [UserRole.DOCTOR] };

    await fakes.patientRepository.create({ name: 'Carlos', cpf: '11111111111' });
    appointment(1, AppointmentStatus.IN_PROGRESS);
    appointment(2, AppointmentStatus.SCHEDULED); // so agendada nao cria vinculo
  });

  it('medico com vinculo escreve, e o autor sai do usuario autenticado', async () => {
    await expect(
      medicalRecordService.create(bonded, 1, { text: 'Paciente relata dor lombar.' }),
    ).resolves.toMatchObject({
      patientId: 1,
      doctorId: 1,
      text: 'Paciente relata dor lombar.',
    });
  });

  it('consulta concluida tambem cria vinculo', async () => {
    appointment(2, AppointmentStatus.DONE);
    await expect(medicalRecordService.create(notBonded, 1, { text: 'Retorno.' })).resolves.toMatchObject({
      doctorId: 2,
    });
  });

  it('medico sem vinculo recebe ACESSO_NEGADO ao escrever e ao ler', async () => {
    await expect(medicalRecordService.create(notBonded, 1, { text: 'x' })).rejects.toMatchObject({
      code: 'ACESSO_NEGADO',
    });
    await expect(medicalRecordService.list(notBonded, 1, page)).rejects.toMatchObject({ code: 'ACESSO_NEGADO' });
  });

  it('admin e secretaria nao escrevem', async () => {
    await expect(medicalRecordService.create(admin, 1, { text: 'x' })).rejects.toMatchObject({ code: 'ACESSO_NEGADO' });
    await expect(medicalRecordService.create(secretary, 1, { text: 'x' })).rejects.toMatchObject({
      code: 'ACESSO_NEGADO',
    });
  });

  it('usuario doctor sem registro profissional nao tem vinculo', async () => {
    await expect(
      medicalRecordService.create({ id: 999, roles: [UserRole.DOCTOR] }, 1, { text: 'x' }),
    ).rejects.toMatchObject({ code: 'ACESSO_NEGADO' });
  });

  it('medico com vinculo e admin leem do mais recente para o mais antigo; secretaria nao le', async () => {
    await medicalRecordService.create(bonded, 1, { text: 'primeiro' });
    await medicalRecordService.create(bonded, 1, { text: 'segundo' });

    const asDoctor = await medicalRecordService.list(bonded, 1, page);
    expect(asDoctor.data.map((record) => record.text)).toEqual(['segundo', 'primeiro']);
    expect((await medicalRecordService.list(admin, 1, page)).meta.total).toBe(2);
    await expect(medicalRecordService.list(secretary, 1, page)).rejects.toMatchObject({ code: 'ACESSO_NEGADO' });
  });

  it('responde RECURSO_NAO_ENCONTRADO para paciente inexistente', async () => {
    await expect(medicalRecordService.create(bonded, 9, { text: 'x' })).rejects.toMatchObject({
      code: 'RECURSO_NAO_ENCONTRADO',
    });
    await expect(medicalRecordService.list(admin, 9, page)).rejects.toMatchObject({ code: 'RECURSO_NAO_ENCONTRADO' });
  });
});
