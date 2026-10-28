import { z } from 'zod';

import { formatClockTime, isValidClockTime, parseClockTime } from '../rules/clinic-time.rules';
import { ShiftTime } from '../rules/schedule.rules';

const clockTimeSchema = z.string().refine(isValidClockTime, 'deve estar no formato HH:MM');

// so compara quando os dois horarios estao no formato certo; senao vale o erro de formato
function startsBeforeEnds(shift: { startTime: string; endTime: string }): boolean {
  if (!isValidClockTime(shift.startTime) || !isValidClockTime(shift.endTime)) {
    return true;
  }

  return parseClockTime(shift.startTime) < parseClockTime(shift.endTime);
}

export const shiftSchema = z
  .object({
    weekDay: z.number().int().min(0).max(6),
    startTime: clockTimeSchema,
    endTime: clockTimeSchema,
    slotDurationMinutes: z.number().int().positive(),
  })
  .refine(startsBeforeEnds, { message: 'startTime deve ser anterior a endTime', path: ['endTime'] });

export const workScheduleSchema = z.object({
  shifts: z.array(shiftSchema).max(100),
});

export type ShiftDTO = z.infer<typeof shiftSchema>;
export type WorkScheduleDTO = z.infer<typeof workScheduleSchema>;

export interface ShiftResponseDTO {
  readonly weekDay: number;
  readonly startTime: string;
  readonly endTime: string;
  readonly slotDurationMinutes: number;
}

export interface WorkScheduleResponseDTO {
  readonly shifts: ShiftResponseDTO[];
}

export function toShiftTime(shift: ShiftDTO): ShiftTime {
  return {
    weekDay: shift.weekDay,
    startMinutes: parseClockTime(shift.startTime),
    endMinutes: parseClockTime(shift.endTime),
    slotDurationMinutes: shift.slotDurationMinutes,
  };
}

export function toWorkScheduleResponseDTO(shifts: readonly ShiftTime[]): WorkScheduleResponseDTO {
  return {
    shifts: shifts.map((shift) => ({
      weekDay: shift.weekDay,
      startTime: formatClockTime(shift.startMinutes),
      endTime: formatClockTime(shift.endMinutes),
      slotDurationMinutes: shift.slotDurationMinutes,
    })),
  };
}
