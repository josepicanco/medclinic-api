import { PageResponseDTO, PaginationQueryDTO, toPageResponseDTO } from '../dtos/common.dto';
import {
  CreateMedicalRecordDTO,
  MedicalRecordResponseDTO,
  toMedicalRecordResponseDTO,
} from '../dtos/medical-record.dto';
import { UserRole, hasRole } from '../enums/user-role.enum';
import { ForbiddenError, NotFoundError } from '../errors/app-error';
import { IAppointmentRepository } from '../repositories/appointment.repository';
import { IDoctorRepository } from '../repositories/doctor.repository';
import { IMedicalRecordRepository } from '../repositories/medical-record.repository';
import { IPatientRepository } from '../repositories/patient.repository';
import { BOND_STATUSES } from '../rules/appointment-status.rules';
import { AuthenticatedUser } from '../types/authenticated-user';

// RN14: o acesso depende do vinculo com o atendimento, nao so do cargo
export class MedicalRecordService {
  private readonly medicalRecordRepository: IMedicalRecordRepository;
  private readonly patientRepository: IPatientRepository;
  private readonly doctorRepository: IDoctorRepository;
  private readonly appointmentRepository: IAppointmentRepository;

  constructor(
    medicalRecordRepository: IMedicalRecordRepository,
    patientRepository: IPatientRepository,
    doctorRepository: IDoctorRepository,
    appointmentRepository: IAppointmentRepository,
  ) {
    this.medicalRecordRepository = medicalRecordRepository;
    this.patientRepository = patientRepository;
    this.doctorRepository = doctorRepository;
    this.appointmentRepository = appointmentRepository;
  }

  // RF09: so o medico com vinculo escreve, e o autor sempre sai do token
  public async create(
    user: AuthenticatedUser,
    patientId: number,
    data: CreateMedicalRecordDTO,
  ): Promise<MedicalRecordResponseDTO> {
    if (!hasRole(user.roles, UserRole.DOCTOR)) {
      throw new ForbiddenError('Escrever no prontuário é ato médico.');
    }

    await this.ensurePatientExists(patientId);
    const doctorId = await this.findBondedDoctorId(user, patientId);

    if (doctorId === null) {
      throw new ForbiddenError('Você não tem vínculo de atendimento com este paciente.');
    }

    const record = await this.medicalRecordRepository.create({ patientId, doctorId, text: data.text });
    return toMedicalRecordResponseDTO(record);
  }

  // le: medico com vinculo ou admin (auditoria). secretaria nao le
  public async list(
    user: AuthenticatedUser,
    patientId: number,
    query: PaginationQueryDTO,
  ): Promise<PageResponseDTO<MedicalRecordResponseDTO>> {
    const isAdmin = hasRole(user.roles, UserRole.ADMIN);

    if (!isAdmin && !hasRole(user.roles, UserRole.DOCTOR)) {
      throw new ForbiddenError('A secretaria não acessa informação clínica.');
    }

    await this.ensurePatientExists(patientId);

    if (!isAdmin && (await this.findBondedDoctorId(user, patientId)) === null) {
      throw new ForbiddenError('Você não tem vínculo de atendimento com este paciente.');
    }

    const page = await this.medicalRecordRepository.listByPatient(patientId, query);
    return toPageResponseDTO(page, toMedicalRecordResponseDTO);
  }

  private async ensurePatientExists(patientId: number): Promise<void> {
    if (!(await this.patientRepository.findById(patientId))) {
      throw new NotFoundError('Paciente não encontrado.');
    }
  }

  // id do medico logado se ele tem vinculo com o paciente, senao null
  private async findBondedDoctorId(user: AuthenticatedUser, patientId: number): Promise<number | null> {
    const doctor = await this.doctorRepository.findByUserId(user.id);

    if (!doctor) {
      return null;
    }

    const bonded = await this.appointmentRepository.existsWithStatus(doctor.id, patientId, BOND_STATUSES);
    return bonded ? doctor.id : null;
  }
}
