import { PageResponseDTO, toPageResponseDTO } from '../dtos/common.dto';
import {
  CreatePatientDTO,
  ListPatientsQueryDTO,
  PatientResponseDTO,
  UpdatePatientDTO,
  toPatientResponseDTO,
} from '../dtos/patient.dto';
import { ConflictError, NotFoundError } from '../errors/app.error';
import { IPatientRepository } from '../repositories/patient.repository';

export class PatientService {
  private readonly patientRepository: IPatientRepository;

  constructor(patientRepository: IPatientRepository) {
    this.patientRepository = patientRepository;
  }

  // RN02: a consulta da a resposta certa; a garantia de verdade e o indice unico do banco
  public async create(data: CreatePatientDTO): Promise<PatientResponseDTO> {
    if (await this.patientRepository.existsByCpf(data.cpf)) {
      throw new ConflictError('CPF_JA_CADASTRADO', 'Já existe um paciente cadastrado com este CPF.');
    }

    return toPatientResponseDTO(await this.patientRepository.create(data));
  }

  public async list(query: ListPatientsQueryDTO): Promise<PageResponseDTO<PatientResponseDTO>> {
    const page = await this.patientRepository.list(query);
    return toPageResponseDTO(page, toPatientResponseDTO);
  }

  public async findById(id: number): Promise<PatientResponseDTO> {
    const patient = await this.patientRepository.findById(id);

    if (!patient) {
      throw new NotFoundError('Paciente não encontrado.');
    }

    return toPatientResponseDTO(patient);
  }

  public async update(id: number, data: UpdatePatientDTO): Promise<PatientResponseDTO> {
    const patient = await this.patientRepository.update(id, data);

    if (!patient) {
      throw new NotFoundError('Paciente não encontrado.');
    }

    return toPatientResponseDTO(patient);
  }

  public async remove(id: number): Promise<void> {
    if (!(await this.patientRepository.softDelete(id))) {
      throw new NotFoundError('Paciente não encontrado.');
    }
  }
}
