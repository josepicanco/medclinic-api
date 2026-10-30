import { beforeEach, describe, expect, it } from 'vitest';

import { ShiftDTO } from '../../../src/dtos/work-schedule.dto';
import { WorkScheduleService } from '../../../src/services/work-schedule.service';
import { Fakes, buildFakes } from '../../fakes/build.fake';

const shift = (weekDay: number, startTime: string, endTime: string, slotDurationMinutes: number): ShiftDTO => ({
  weekDay,
  startTime,
  endTime,
  slotDurationMinutes,
});

describe('WorkScheduleService (RF04)', () => {
  let fakes: Fakes;
  let workScheduleService: WorkScheduleService;

  beforeEach(async () => {
    fakes = buildFakes();
    workScheduleService = new WorkScheduleService(fakes.doctorRepository, fakes.workScheduleRepository);
    await fakes.doctorRepository.createWithUser({
      crm: 'CRM-1',
      name: 'Dra. Helena',
      email: 'h@m.com',
      passwordHash: 'x',
    });
  });

  it('registra e devolve a escala do medico', async () => {
    const shifts = [shift(2, '08:00', '12:00', 30), shift(4, '08:00', '11:00', 30)];

    await expect(workScheduleService.replace(1, { shifts })).resolves.toEqual({ shifts });
    await expect(workScheduleService.findByDoctorId(1)).resolves.toEqual({ shifts });
  });

  it('aceita turnos encostados no mesmo dia (RN05)', async () => {
    const shifts = [shift(2, '08:00', '12:00', 30), shift(2, '12:00', '18:00', 20)];
    await expect(workScheduleService.replace(1, { shifts })).resolves.toEqual({ shifts });
  });

  it('rejeita turnos sobrepostos no mesmo dia da semana (RN05)', async () => {
    const shifts = [shift(2, '08:00', '12:00', 30), shift(2, '11:00', '14:00', 30)];

    await expect(workScheduleService.replace(1, { shifts })).rejects.toMatchObject({ code: 'DADOS_INVALIDOS' });
    await expect(workScheduleService.findByDoctorId(1)).resolves.toEqual({ shifts: [] });
  });

  it('rejeita turno malformado', async () => {
    await expect(workScheduleService.replace(1, { shifts: [shift(2, '12:00', '08:00', 30)] })).rejects.toMatchObject({
      code: 'DADOS_INVALIDOS',
    });
  });

  it('substitui a escala inteira e lista vazia apaga', async () => {
    await workScheduleService.replace(1, { shifts: [shift(2, '08:00', '12:00', 30), shift(3, '08:00', '12:00', 30)] });
    await workScheduleService.replace(1, { shifts: [shift(5, '08:00', '12:00', 15)] });
    await expect(workScheduleService.findByDoctorId(1)).resolves.toEqual({ shifts: [shift(5, '08:00', '12:00', 15)] });

    await workScheduleService.replace(1, { shifts: [] });
    await expect(workScheduleService.findByDoctorId(1)).resolves.toEqual({ shifts: [] });
  });

  it('responde RECURSO_NAO_ENCONTRADO para medico inexistente', async () => {
    await expect(workScheduleService.replace(9, { shifts: [] })).rejects.toMatchObject({
      code: 'RECURSO_NAO_ENCONTRADO',
    });
    await expect(workScheduleService.findByDoctorId(9)).rejects.toMatchObject({ code: 'RECURSO_NAO_ENCONTRADO' });
  });
});
