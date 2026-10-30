import { beforeEach, describe, expect, it } from 'vitest';

import { AppointmentStatus } from '../../../src/enums/appointment-status.enum';
import { UserRole } from '../../../src/enums/user-role.enum';
import { AppointmentService } from '../../../src/services/appointment.service';
import { AuthenticatedUser } from '../../../src/types/authenticated-user.type';
import { Fakes, buildFakes } from '../../fakes/build.fake';

const page = { page: 1, pageSize: 20 };
const slot = (iso: string) => ({ startsAt: new Date(iso), endsAt: new Date(new Date(iso).getTime() + 30 * 60_000) });

describe('AppointmentService - listagem e consulta (RF10)', () => {
  let fakes: Fakes;
  let appointmentService: AppointmentService;
  let helena: AuthenticatedUser;
  let rui: AuthenticatedUser;
  const admin: AuthenticatedUser = { id: 100, roles: [UserRole.ADMIN] };
  const secretary: AuthenticatedUser = { id: 101, roles: [UserRole.SECRETARY] };

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
    helena = { id: doctor1.userId, roles: [UserRole.DOCTOR] };
    rui = { id: doctor2.userId, roles: [UserRole.DOCTOR] };

    fakes.appointmentRepository.seed({ doctorId: 1, patientId: 1, ...slot('2026-10-13T11:00:00Z') });
    fakes.appointmentRepository.seed({
      doctorId: 1,
      patientId: 2,
      ...slot('2026-10-15T11:00:00Z'),
      status: AppointmentStatus.CANCELLED,
    });
    fakes.appointmentRepository.seed({ doctorId: 2, patientId: 1, ...slot('2026-10-14T11:00:00Z') });
  });

  it('admin e secretaria enxergam tudo e combinam filtros', async () => {
    expect((await appointmentService.list(admin, page)).meta.total).toBe(3);
    expect((await appointmentService.list(secretary, { ...page, doctorId: 1 })).meta.total).toBe(2);
    expect(
      (await appointmentService.list(secretary, { ...page, status: AppointmentStatus.CANCELLED })).meta.total,
    ).toBe(1);

    const byPatientAndDay = await appointmentService.list(secretary, {
      ...page,
      patientId: 1,
      from: '2026-10-14',
      to: '2026-10-14',
    });
    expect(byPatientAndDay.data.map((appointment) => appointment.doctorId)).toEqual([2]);
  });

  it('medico enxerga so as proprias consultas, qualquer que seja o filtro', async () => {
    const own = await appointmentService.list(helena, page);
    expect(own.data.every((appointment) => appointment.doctorId === 1)).toBe(true);
    expect(own.meta.total).toBe(2);

    await expect(appointmentService.list(helena, { ...page, doctorId: 2 })).resolves.toEqual({
      data: [],
      meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 },
    });
  });

  it('usuario doctor sem registro profissional nao enxerga consultas', async () => {
    const result = await appointmentService.list({ id: 999, roles: [UserRole.DOCTOR] }, page);
    expect(result.meta.total).toBe(0);
  });

  it('recusa periodo invertido', async () => {
    await expect(
      appointmentService.list(admin, { ...page, from: '2026-10-20', to: '2026-10-10' }),
    ).rejects.toMatchObject({ code: 'DADOS_INVALIDOS' });
  });

  it('consulta por id respeitando a posse do medico', async () => {
    await expect(appointmentService.findById(helena, 1)).resolves.toMatchObject({ id: 1 });
    await expect(appointmentService.findById(secretary, 1)).resolves.toMatchObject({ id: 1 });
    await expect(appointmentService.findById(rui, 1)).rejects.toMatchObject({ code: 'ACESSO_NEGADO' });
    await expect(appointmentService.findById(admin, 99)).rejects.toMatchObject({ code: 'RECURSO_NAO_ENCONTRADO' });
  });
});
