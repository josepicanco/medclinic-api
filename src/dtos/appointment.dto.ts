import { z } from 'zod';

import { Appointment } from '../entities/appointment.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { dateSchema, idNumberSchema, idStringSchema, paginationQuerySchema } from './common.dto';

// iso 8601 com fuso explicito: 2026-10-13T10:00:00-03:00 ou 2026-10-13T13:00:00Z
const ISO_WITH_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

function isRealCalendarDate(value: string): boolean {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const instantSchema = z
  .string()
  .regex(ISO_WITH_OFFSET, 'deve estar em ISO 8601 com fuso explícito')
  .refine((value) => !Number.isNaN(Date.parse(value)) && isRealCalendarDate(value), 'data inválida')
  .transform((value) => new Date(value));

export const createAppointmentSchema = z.object({
  doctorId: idNumberSchema,
  patientId: idNumberSchema,
  startsAt: instantSchema,
});

export const listAppointmentsQuerySchema = paginationQuerySchema.extend({
  doctorId: idStringSchema.optional(),
  patientId: idStringSchema.optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

export const changeStatusSchema = z.object({
  status: z.nativeEnum(AppointmentStatus),
});

export type CreateAppointmentDTO = z.infer<typeof createAppointmentSchema>;
export type ListAppointmentsQueryDTO = z.infer<typeof listAppointmentsQuerySchema>;
export type ChangeStatusDTO = z.infer<typeof changeStatusSchema>;

export interface AppointmentResponseDTO {
  readonly id: number;
  readonly doctorId: number;
  readonly patientId: number;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly status: AppointmentStatus;
}

export function toAppointmentResponseDTO(appointment: Appointment): AppointmentResponseDTO {
  return {
    id: appointment.id,
    doctorId: appointment.doctorId,
    patientId: appointment.patientId,
    startsAt: appointment.startsAt.toISOString(),
    endsAt: appointment.endsAt.toISOString(),
    status: appointment.status,
  };
}
