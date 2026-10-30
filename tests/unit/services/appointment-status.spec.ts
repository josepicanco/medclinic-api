import { beforeEach, describe, expect, it } from 'vitest';

import { AppointmentStatus } from '../../../src/enums/appointment-status.enum';
import { UserRole } from '../../../src/enums/user-role.enum';
import { AppointmentService } from '../../../src/services/appointment.service';
import { AuthenticatedUser } from '../../../src/types/authenticated-user.type';
import { Fakes, buildFakes } from '../../fakes/build-fakes';

const { SCHEDULED, IN_PROGRESS, DONE, CANCELLED } = AppointmentStatus;

describe('AppointmentService.changeStatus (RF08)', () => {
  let fakes: Fakes;
  let appointmentService: AppointmentService;
  let owner: AuthenticatedUser;
  let otherDoctor: AuthenticatedUser;
  const admin: AuthenticatedUser = { id: 100, roles: [UserRole.ADMIN] };
  const secretary: AuthenticatedUser = { id: 101, roles: [UserRole.SECRETARY] };

  const seed = (status: AppointmentStatus) =>
    fakes.appointmentRepository.seed({
      doctorId: 1,
      patientId: 1,
      startsAt: new Date('2026-10-13T11:00:00Z'),
      endsAt: new Date('2026-10-13T11:30:00Z'),
      status,
    });

  beforeEach(async () => {
    fakes = buildFakes();
    appointmentService = new AppointmentService(fakes.appointmentRepository, fakes.doctorRepository);

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
    owner = { id: doctor1.userId, roles: [UserRole.DOCTOR] };
    otherDoctor = { id: doctor2.userId, roles: [UserRole.DOCTOR] };
  });

  it('o medico da consulta coloca em andamento e conclui', async () => {
    const { id } = seed(SCHEDULED);

    await expect(appointmentService.changeStatus(owner, id, IN_PROGRESS)).resolves.toMatchObject({
      status: 'in_progress',
    });
    await expect(appointmentService.changeStatus(owner, id, DONE)).resolves.toMatchObject({ status: 'done' });
  });

  it('admin tambem conduz o atendimento', async () => {
    const { id } = seed(SCHEDULED);
    await expect(appointmentService.changeStatus(admin, id, IN_PROGRESS)).resolves.toMatchObject({
      status: 'in_progress',
    });
  });

  it('recusa transicao que o ciclo de vida nao permite (422)', async () => {
    await expect(appointmentService.changeStatus(owner, seed(SCHEDULED).id, DONE)).rejects.toMatchObject({
      code: 'TRANSICAO_INVALIDA',
    });
    await expect(appointmentService.changeStatus(admin, seed(DONE).id, CANCELLED)).rejects.toMatchObject({
      code: 'TRANSICAO_INVALIDA',
    });
    await expect(appointmentService.changeStatus(admin, seed(CANCELLED).id, SCHEDULED)).rejects.toMatchObject({
      code: 'TRANSICAO_INVALIDA',
    });
  });

  it('recusa perfil sem autoridade para a transicao (403)', async () => {
    const { id } = seed(SCHEDULED);

    await expect(appointmentService.changeStatus(secretary, id, IN_PROGRESS)).rejects.toMatchObject({
      code: 'ACESSO_NEGADO',
    });
    await expect(appointmentService.changeStatus(otherDoctor, id, IN_PROGRESS)).rejects.toMatchObject({
      code: 'ACESSO_NEGADO',
    });
  });

  it('secretaria cancela consulta agendada, mas nao em andamento', async () => {
    await expect(appointmentService.changeStatus(secretary, seed(SCHEDULED).id, CANCELLED)).resolves.toMatchObject({
      status: 'cancelled',
    });

    const inProgress = seed(IN_PROGRESS);
    await expect(appointmentService.changeStatus(secretary, inProgress.id, CANCELLED)).rejects.toMatchObject({
      code: 'ACESSO_NEGADO',
    });
    await expect(appointmentService.changeStatus(owner, inProgress.id, CANCELLED)).resolves.toMatchObject({
      status: 'cancelled',
    });
  });

  it('responde RECURSO_NAO_ENCONTRADO para consulta inexistente', async () => {
    await expect(appointmentService.changeStatus(admin, 99, CANCELLED)).rejects.toMatchObject({
      code: 'RECURSO_NAO_ENCONTRADO',
    });
  });
});
