import { toAppointmentResponseDTO } from '../dtos/appointment.dto';
import { CalendarQueryDTO, CalendarResponseDTO } from '../dtos/calendar.dto';
import { toWorkScheduleResponseDTO } from '../dtos/work-schedule.dto';
import { BadRequestError, NotFoundError } from '../errors/app.error';
import { IAppointmentRepository } from '../repositories/appointment.repository';
import { IDoctorRepository } from '../repositories/doctor.repository';
import { IWorkScheduleRepository } from '../repositories/work-schedule.repository';
import { daysInRangeInclusive, endOfClinicDayExclusive, startOfClinicDay } from '../rules/clinic-time.rules';

export const MAX_CALENDAR_DAYS = 31;

// RF05: entrega escala + consultas ativas; quem monta os horarios livres e o front-end
export class CalendarService {
  private readonly doctorRepository: IDoctorRepository;
  private readonly workScheduleRepository: IWorkScheduleRepository;
  private readonly appointmentRepository: IAppointmentRepository;

  constructor(
    doctorRepository: IDoctorRepository,
    workScheduleRepository: IWorkScheduleRepository,
    appointmentRepository: IAppointmentRepository,
  ) {
    this.doctorRepository = doctorRepository;
    this.workScheduleRepository = workScheduleRepository;
    this.appointmentRepository = appointmentRepository;
  }

  public async findByDoctorId(doctorId: number, query: CalendarQueryDTO): Promise<CalendarResponseDTO> {
    const days = daysInRangeInclusive(query.from, query.to);

    if (days < 1) {
      throw new BadRequestError('A data inicial não pode ser posterior à data final.');
    }

    if (days > MAX_CALENDAR_DAYS) {
      throw new BadRequestError(`O período máximo é de ${MAX_CALENDAR_DAYS} dias.`);
    }

    if (!(await this.doctorRepository.findById(doctorId))) {
      throw new NotFoundError('Médico não encontrado.');
    }

    // periodo inclusivo nas duas pontas, no horario local da clinica
    const period = { startsAt: startOfClinicDay(query.from), endsAt: endOfClinicDayExclusive(query.to) };
    const [shifts, appointments] = await Promise.all([
      this.workScheduleRepository.findByDoctorId(doctorId),
      this.appointmentRepository.findActiveByDoctorInPeriod(doctorId, period),
    ]);

    return {
      workSchedule: toWorkScheduleResponseDTO(shifts),
      appointments: appointments.map(toAppointmentResponseDTO),
    };
  }
}
