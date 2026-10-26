import { z } from 'zod';

import { Patient } from '../entities/patient.entity';
import { nameSchema, paginationQuerySchema } from './common.dto';

export const createPatientSchema = z.object({
  name: nameSchema,
  // RN02: 11 digitos, sem pontuacao
  cpf: z.string().regex(/^\d{11}$/, 'deve ter 11 dígitos numéricos'),
});

export const updatePatientSchema = z.object({
  name: nameSchema,
});

export const listPatientsQuerySchema = paginationQuerySchema.extend({
  name: z.string().trim().max(120).optional(),
});

export type CreatePatientDTO = z.infer<typeof createPatientSchema>;
export type UpdatePatientDTO = z.infer<typeof updatePatientSchema>;
export type ListPatientsQueryDTO = z.infer<typeof listPatientsQuerySchema>;

export interface PatientResponseDTO {
  readonly id: number;
  readonly name: string;
  readonly cpf: string;
  readonly createdAt: string;
}

export function toPatientResponseDTO(patient: Patient): PatientResponseDTO {
  return {
    id: patient.id,
    name: patient.name,
    cpf: patient.cpf,
    createdAt: patient.createdAt.toISOString(),
  };
}
