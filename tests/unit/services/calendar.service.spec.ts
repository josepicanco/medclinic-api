import { beforeEach, describe, expect, it } from 'vitest';

import { AppointmentStatus } from '../../../src/enums/appointment-status.enum';
import { CalendarService } from '../../../src/services/calendar.service';
import { Fakes, buildFakes } from '../../fakes/build.fake';

describe('CalendarService (RF05)', () => {
  let fakes: Fakes;
  let calendarService: CalendarService;

  beforeEach(async () => {
    fakes = buildFakes();
    calendarService = new CalendarService(
      fakes.doctorRepository,
      fakes.workScheduleRepository,
      fakes.appointmentRepository,
    );
    await fakes.doctorRepository.createWithUser({
      crm: 'CRM-1',
      name: 'Dra. Helena',
      email: 'h@m.com',
      passwordHash: 'x',
    });
    await fakes.workScheduleRepository.replace(1, [
      { weekDay: 2, startMinutes: 480, endMinutes: 720, slotDurationMinutes: 30 },
    ]);
  });

  it('devolve a escala e as consultas ativas, sem as canceladas (RN13)', async () => {
    fakes.appointmentRepository.seed({
      doctorId: 1,
      patientId: 1,
      startsAt: new Date('2026-10-13T11:00:00Z'),
      endsAt: new Date('2026-10-13T11:30:00Z'),
    });
    fakes.appointmentRepository.seed({
      doctorId: 1,
      patientId: 2,
      startsAt: new Date('2026-10-13T12:00:00Z'),
      endsAt: new Date('2026-10-13T12:30:00Z'),
      status: AppointmentStatus.CANCELLED,
    });

    await expect(calendarService.findByDoctorId(1, { from: '2026-10-12', to: '2026-10-16' })).resolves.toEqual({
      workSchedule: { shifts: [{ weekDay: 2, startTime: '08:00', endTime: '12:00', slotDurationMinutes: 30 }] },
      appointments: [
        {
          id: 1,
          doctorId: 1,
          patientId: 1,
          startsAt: '2026-10-13T11:00:00.000Z',
          endsAt: '2026-10-13T11:30:00.000Z',
          status: 'scheduled',
        },
      ],
    });
  });

  it('considera o dia inteiro no horario local nas duas pontas', async () => {
    // 23:30 de 16/10 em Sao Paulo = 02:30Z de 17/10: ainda esta no periodo
    fakes.appointmentRepository.seed({
      doctorId: 1,
      patientId: 1,
      startsAt: new Date('2026-10-17T02:30:00Z'),
      endsAt: new Date('2026-10-17T03:00:00Z'),
    });

    const calendar = await calendarService.findByDoctorId(1, { from: '2026-10-16', to: '2026-10-16' });
    expect(calendar.appointments).toHaveLength(1);
  });

  it('recusa periodo invertido ou maior que 31 dias', async () => {
    await expect(calendarService.findByDoctorId(1, { from: '2026-10-16', to: '2026-10-12' })).rejects.toMatchObject({
      code: 'DADOS_INVALIDOS',
    });
    await expect(calendarService.findByDoctorId(1, { from: '2026-10-01', to: '2026-11-01' })).rejects.toMatchObject({
      code: 'DADOS_INVALIDOS',
    });
    await expect(calendarService.findByDoctorId(1, { from: '2026-10-01', to: '2026-10-31' })).resolves.toBeDefined();
  });

  it('responde RECURSO_NAO_ENCONTRADO para medico inexistente', async () => {
    await expect(calendarService.findByDoctorId(9, { from: '2026-10-12', to: '2026-10-16' })).rejects.toMatchObject({
      code: 'RECURSO_NAO_ENCONTRADO',
    });
  });
});
