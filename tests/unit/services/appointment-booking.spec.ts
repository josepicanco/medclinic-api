import { beforeEach, describe, expect, it } from 'vitest';

import { AppointmentStatus } from '../../../src/enums/appointment-status.enum';
import { AppointmentService } from '../../../src/services/appointment.service';
import { Fakes, buildFakes } from '../../fakes/build.fake';

// terca, 13/10/2026, no horario local da clinica
const tuesday = (time: string): Date => new Date(`2026-10-13T${time}:00-03:00`);

describe('AppointmentService.create (RF06/RF07)', () => {
  let fakes: Fakes;
  let appointmentService: AppointmentService;

  beforeEach(async () => {
    fakes = buildFakes();
    appointmentService = new AppointmentService(fakes.appointmentRepository, fakes.doctorRepository);

    await fakes.doctorRepository.createWithUser({
      crm: 'CRM-1',
      name: 'Dra. Helena',
      email: 'h@m.com',
      passwordHash: 'x',
    });
    await fakes.doctorRepository.createWithUser({ crm: 'CRM-2', name: 'Dr. Rui', email: 'r@m.com', passwordHash: 'x' });
    await fakes.patientRepository.create({ name: 'Carlos', cpf: '11111111111' });
    await fakes.patientRepository.create({ name: 'Maria', cpf: '22222222222' });
    // terca: 08-12 com 30 min e 14-18 com 20 min
    await fakes.workScheduleRepository.replace(1, [
      { weekDay: 2, startMinutes: 480, endMinutes: 720, slotDurationMinutes: 30 },
      { weekDay: 2, startMinutes: 840, endMinutes: 1080, slotDurationMinutes: 20 },
    ]);
    await fakes.workScheduleRepository.replace(2, [
      { weekDay: 2, startMinutes: 480, endMinutes: 720, slotDurationMinutes: 30 },
    ]);
  });

  it('cria a consulta calculando o fim pela duracao do turno', async () => {
    await expect(appointmentService.create({ doctorId: 1, patientId: 1, startsAt: tuesday('08:00') })).resolves.toEqual(
      {
        id: 1,
        doctorId: 1,
        patientId: 1,
        startsAt: '2026-10-13T11:00:00.000Z',
        endsAt: '2026-10-13T11:30:00.000Z',
        status: 'scheduled',
      },
    );
  });

  it('usa a duracao do turno em que o horario cai', async () => {
    const appointment = await appointmentService.create({ doctorId: 1, patientId: 1, startsAt: tuesday('14:20') });
    expect(appointment.endsAt).toBe(tuesday('14:40').toISOString());
  });

  it('trava a linha do medico antes de verificar e gravar', async () => {
    await appointmentService.create({ doctorId: 1, patientId: 1, startsAt: tuesday('08:00') });
    expect(fakes.appointmentRepository.lockedDoctors).toEqual([1]);
  });

  it('recusa horario fora de qualquer turno', async () => {
    await expect(
      appointmentService.create({ doctorId: 1, patientId: 1, startsAt: tuesday('12:30') }),
    ).rejects.toMatchObject({ code: 'HORARIO_FORA_DA_ESCALA' });
  });

  it('recusa horario desalinhado da grade', async () => {
    await expect(
      appointmentService.create({ doctorId: 1, patientId: 1, startsAt: tuesday('08:20') }),
    ).rejects.toMatchObject({ code: 'HORARIO_FORA_DA_ESCALA' });
  });

  it('recusa consulta que nao cabe no fim do turno', async () => {
    await fakes.workScheduleRepository.replace(1, [
      { weekDay: 2, startMinutes: 480, endMinutes: 585, slotDurationMinutes: 30 },
    ]);

    await expect(
      appointmentService.create({ doctorId: 1, patientId: 1, startsAt: tuesday('09:30') }),
    ).rejects.toMatchObject({ code: 'HORARIO_FORA_DA_ESCALA' });
  });

  it('recusa conflito com consulta existente do medico (RN08)', async () => {
    await appointmentService.create({ doctorId: 1, patientId: 1, startsAt: tuesday('08:00') });

    await expect(
      appointmentService.create({ doctorId: 1, patientId: 2, startsAt: tuesday('08:00') }),
    ).rejects.toMatchObject({ code: 'HORARIO_INDISPONIVEL' });
  });

  it('detecta conflito por intersecao, mesmo com inicios diferentes', async () => {
    // consulta antiga de 30 min as 14:00, de antes de a escala mudar para 20 min
    fakes.appointmentRepository.seed({
      doctorId: 1,
      patientId: 2,
      startsAt: tuesday('14:00'),
      endsAt: tuesday('14:30'),
    });

    await expect(
      appointmentService.create({ doctorId: 1, patientId: 1, startsAt: tuesday('14:20') }),
    ).rejects.toMatchObject({ code: 'HORARIO_INDISPONIVEL' });
  });

  it('recusa conflito com consulta existente do paciente, mesmo com outro medico (RN09)', async () => {
    await appointmentService.create({ doctorId: 1, patientId: 1, startsAt: tuesday('08:00') });

    await expect(
      appointmentService.create({ doctorId: 2, patientId: 1, startsAt: tuesday('08:00') }),
    ).rejects.toMatchObject({ code: 'PACIENTE_INDISPONIVEL' });
  });

  it('aceita consultas encostadas', async () => {
    await appointmentService.create({ doctorId: 1, patientId: 1, startsAt: tuesday('08:00') });
    await expect(
      appointmentService.create({ doctorId: 1, patientId: 1, startsAt: tuesday('08:30') }),
    ).resolves.toBeDefined();
  });

  it('ignora consultas canceladas: cancelar libera o horario (RN13)', async () => {
    fakes.appointmentRepository.seed({
      doctorId: 1,
      patientId: 2,
      startsAt: tuesday('08:00'),
      endsAt: tuesday('08:30'),
      status: AppointmentStatus.CANCELLED,
    });

    await expect(
      appointmentService.create({ doctorId: 1, patientId: 1, startsAt: tuesday('08:00') }),
    ).resolves.toBeDefined();
  });

  it('responde RECURSO_NAO_ENCONTRADO para medico ou paciente inexistente', async () => {
    await expect(
      appointmentService.create({ doctorId: 9, patientId: 1, startsAt: tuesday('08:00') }),
    ).rejects.toMatchObject({ code: 'RECURSO_NAO_ENCONTRADO' });
    await expect(
      appointmentService.create({ doctorId: 1, patientId: 9, startsAt: tuesday('08:00') }),
    ).rejects.toMatchObject({ code: 'RECURSO_NAO_ENCONTRADO' });
  });
});
