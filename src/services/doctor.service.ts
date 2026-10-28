import { PageResponseDTO, toPageResponseDTO } from '../dtos/common.dto';
import { CreateDoctorDTO, DoctorResponseDTO, ListDoctorsQueryDTO, toDoctorResponseDTO } from '../dtos/doctor.dto';
import { ConflictError, NotFoundError } from '../errors/app-error';
import { IDoctorRepository } from '../repositories/doctor.repository';
import { IUserRepository } from '../repositories/user.repository';
import { IPasswordHasher } from '../utils/password.util';

export class DoctorService {
  private readonly doctorRepository: IDoctorRepository;
  private readonly userRepository: IUserRepository;
  private readonly passwordHasher: IPasswordHasher;

  constructor(doctorRepository: IDoctorRepository, userRepository: IUserRepository, passwordHasher: IPasswordHasher) {
    this.doctorRepository = doctorRepository;
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
  }

  // RF03: as checagens dao o codigo certo no caso comum; a atomicidade fica na transacao do repositorio
  public async create(data: CreateDoctorDTO): Promise<DoctorResponseDTO> {
    if (await this.userRepository.existsByEmail(data.email)) {
      throw new ConflictError('EMAIL_JA_CADASTRADO', 'Já existe um usuário cadastrado com este e-mail.');
    }

    if (await this.doctorRepository.existsByCrm(data.crm)) {
      throw new ConflictError('CRM_JA_CADASTRADO', 'Já existe um médico cadastrado com este CRM.');
    }

    const passwordHash = await this.passwordHasher.hash(data.password);
    const doctor = await this.doctorRepository.createWithUser({
      crm: data.crm,
      name: data.name,
      email: data.email,
      passwordHash,
    });

    return toDoctorResponseDTO(doctor);
  }

  public async list(query: ListDoctorsQueryDTO): Promise<PageResponseDTO<DoctorResponseDTO>> {
    const page = await this.doctorRepository.list(query);
    return toPageResponseDTO(page, toDoctorResponseDTO);
  }

  public async findById(id: number): Promise<DoctorResponseDTO> {
    const doctor = await this.doctorRepository.findById(id);

    if (!doctor) {
      throw new NotFoundError('Médico não encontrado.');
    }

    return toDoctorResponseDTO(doctor);
  }
}
