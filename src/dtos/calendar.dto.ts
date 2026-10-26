import { z } from 'zod';

import { AppointmentResponseDTO } from './appointment.dto';
import { dateSchema } from './common.dto';
import { WorkScheduleResponseDTO } from './work-schedule.dto';

export const calendarQuerySchema = z.object({
  from: dateSchema,
  to: dateSchema,
});

export type CalendarQueryDTO = z.infer<typeof calendarQuerySchema>;

export interface CalendarResponseDTO {
  readonly workSchedule: WorkScheduleResponseDTO;
  readonly appointments: AppointmentResponseDTO[];
}
