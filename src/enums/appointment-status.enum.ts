export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

export const APPOINTMENT_STATUSES: readonly AppointmentStatus[] = Object.values(AppointmentStatus);
