import { z } from 'zod';

import { Doctor } from '../entities/doctor.entity';
import { nameSchema, paginationQuerySchema } from './common.dto';
import { emailSchema, passwordSchema } from './create-user.dto';
import { UserResponseDTO, toUserResponseDTO } from './user-response.dto';

export const createDoctorSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  crm: z.string().trim().min(1, 'não pode ser vazio').max(30),
});

export const listDoctorsQuerySchema = paginationQuerySchema.extend({
  name: z.string().trim().max(120).optional(),
});

export type CreateDoctorDTO = z.infer<typeof createDoctorSchema>;
export type ListDoctorsQueryDTO = z.infer<typeof listDoctorsQuerySchema>;

export interface DoctorResponseDTO {
  readonly id: number;
  readonly crm: string;
  readonly user: UserResponseDTO;
}

export function toDoctorResponseDTO(doctor: Doctor): DoctorResponseDTO {
  return {
    id: doctor.id,
    crm: doctor.crm,
    user: toUserResponseDTO(doctor.user),
  };
}
