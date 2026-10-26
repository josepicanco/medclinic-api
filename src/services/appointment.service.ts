import {
  AppointmentResponseDTO,
  CreateAppointmentDTO,
  ListAppointmentsQueryDTO,
  toAppointmentResponseDTO,
} from '../dtos/appointment.dto';
import { PageResponseDTO, toPageResponseDTO } from '../dtos/common.dto';
import { Appointment } from '../entities/appointment.entity';
import { UserRole, hasRole } from '../enums/user-role.enum';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnprocessableError } from '../errors/app-error';
import { AppointmentFilter, IAppointmentRepository } from '../repositories/appointment.repository';
import { IDoctorRepository } from '../repositories/doctor.repository';
import { endOfClinicDayExclusive, startOfClinicDay } from '../rules/clinic-time.rules';
import { addMinutes } from '../rules/period.rules';
import { findShiftForSlot } from '../rules/schedule.rules';
import { AuthenticatedUser } from '../types/authenticated-user';
import { emptyPage } from '../types/pagination.types';

export class AppointmentService {
  private readonly appointmentRepository: IAppointmentRepository;
  private readonly doctorRepository: IDoctorRepository;

  constructor(appointmentRepository: IAppointmentRepository, doctorRepository: IDoctorRepository) {
    this.appointmentRepository = appointmentRepository;
    this.doctorRepository = doctorRepository;
  }

  // RF06/RF07: verificar e gravar dentro da mesma transacao, com a linha do medico travada.
  // ordem do contrato: existencia -> escala (RN07) -> medico livre (RN08) -> paciente livre (RN09)
  public async create(data: CreateAppointmentDTO): Promise<AppointmentResponseDTO> {
    const appointment = await this.appointmentRepository.runBookingTransaction(async (transaction) => {
      // sempre medico antes do paciente, para duas transacoes nao travarem uma a outra
      const doctorExists = await transaction.lockDoctor(data.doctorId);
      const patientExists = await transaction.lockPatient(data.patientId);

      if (!doctorExists) {
        throw new NotFoundError('Médico não encontrado.');
      }

      if (!patientExists) {
        throw new NotFoundError('Paciente não encontrado.');
      }

      const shift = findShiftForSlot(await transaction.findShifts(data.doctorId), data.startsAt);

      if (!shift) {
        throw new UnprocessableError('HORARIO_FORA_DA_ESCALA', 'Este horário não existe na escala do médico.');
      }

      // RN15: o fim e calculado agora e fica gravado na consulta
      const period = { startsAt: data.startsAt, endsAt: addMinutes(data.startsAt, shift.slotDurationMinutes) };

      if (await transaction.hasActiveOverlapForDoctor(data.doctorId, period)) {
        throw new ConflictError('HORARIO_INDISPONIVEL', 'Este horário acabou de ser ocupado.');
      }

      if (await transaction.hasActiveOverlapForPatient(data.patientId, period)) {
        throw new ConflictError('PACIENTE_INDISPONIVEL', 'O paciente já tem uma consulta neste período.');
      }

      return transaction.create({ doctorId: data.doctorId, patientId: data.patientId, ...period });
    });

    return toAppointmentResponseDTO(appointment);
  }

  // RF10: doctor sem admin enxerga so as proprias consultas, qualquer que seja o filtro
  public async list(
    user: AuthenticatedUser,
    query: ListAppointmentsQueryDTO,
  ): Promise<PageResponseDTO<AppointmentResponseDTO>> {
    if (query.from && query.to && query.from > query.to) {
      throw new BadRequestError('A data inicial não pode ser posterior à data final.');
    }

    const filter: AppointmentFilter = {
      page: query.page,
      pageSize: query.pageSize,
      doctorId: query.doctorId,
      patientId: query.patientId,
      status: query.status,
      startsFrom: query.from ? startOfClinicDay(query.from) : undefined,
      startsBefore: query.to ? endOfClinicDayExclusive(query.to) : undefined,
    };

    if (this.seesOnlyOwnAppointments(user)) {
      const ownDoctorId = await this.findDoctorIdOf(user);

      if (ownDoctorId === null || (query.doctorId !== undefined && query.doctorId !== ownDoctorId)) {
        return toPageResponseDTO(emptyPage<Appointment>(query), toAppointmentResponseDTO);
      }

      return toPageResponseDTO(
        await this.appointmentRepository.list({ ...filter, doctorId: ownDoctorId }),
        toAppointmentResponseDTO,
      );
    }

    return toPageResponseDTO(await this.appointmentRepository.list(filter), toAppointmentResponseDTO);
  }

  public async findById(user: AuthenticatedUser, id: number): Promise<AppointmentResponseDTO> {
    const appointment = await this.findEntityById(id);

    if (this.seesOnlyOwnAppointments(user) && (await this.findDoctorIdOf(user)) !== appointment.doctorId) {
      throw new ForbiddenError('Esta consulta não é sua.');
    }

    return toAppointmentResponseDTO(appointment);
  }

  private async findEntityById(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(id);

    if (!appointment) {
      throw new NotFoundError('Agendamento não encontrado.');
    }

    return appointment;
  }

  private seesOnlyOwnAppointments(user: AuthenticatedUser): boolean {
    return hasRole(user.roles, UserRole.DOCTOR) && !hasRole(user.roles, UserRole.ADMIN);
  }

  private async findDoctorIdOf(user: AuthenticatedUser): Promise<number | null> {
    const doctor = await this.doctorRepository.findByUserId(user.id);
    return doctor ? doctor.id : null;
  }
}
