import {
  WorkScheduleDTO,
  WorkScheduleResponseDTO,
  toShiftTime,
  toWorkScheduleResponseDTO,
} from '../dtos/work-schedule.dto';
import { BadRequestError, NotFoundError } from '../errors/app.error';
import { IDoctorRepository } from '../repositories/doctor.repository';
import { IWorkScheduleRepository } from '../repositories/work-schedule.repository';
import { hasOverlappingShifts, isShiftWellFormed } from '../rules/schedule.rules';

export class WorkScheduleService {
  private readonly doctorRepository: IDoctorRepository;
  private readonly workScheduleRepository: IWorkScheduleRepository;

  constructor(doctorRepository: IDoctorRepository, workScheduleRepository: IWorkScheduleRepository) {
    this.doctorRepository = doctorRepository;
    this.workScheduleRepository = workScheduleRepository;
  }

  // RF04: substitui a escala inteira. RN15: consulta marcada nao muda porque guarda o proprio fim
  public async replace(doctorId: number, data: WorkScheduleDTO): Promise<WorkScheduleResponseDTO> {
    await this.ensureDoctorExists(doctorId);
    const shifts = data.shifts.map(toShiftTime);

    if (!shifts.every(isShiftWellFormed)) {
      throw new BadRequestError('Turno inválido: confira weekDay, horários e duração da consulta.');
    }

    if (hasOverlappingShifts(shifts)) {
      throw new BadRequestError('Dois turnos do mesmo dia da semana se sobrepõem.');
    }

    return toWorkScheduleResponseDTO(await this.workScheduleRepository.replace(doctorId, shifts));
  }

  public async findByDoctorId(doctorId: number): Promise<WorkScheduleResponseDTO> {
    await this.ensureDoctorExists(doctorId);
    return toWorkScheduleResponseDTO(await this.workScheduleRepository.findByDoctorId(doctorId));
  }

  private async ensureDoctorExists(doctorId: number): Promise<void> {
    if (!(await this.doctorRepository.findById(doctorId))) {
      throw new NotFoundError('Médico não encontrado.');
    }
  }
}
