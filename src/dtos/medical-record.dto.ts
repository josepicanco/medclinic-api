import { z } from 'zod';

import { MedicalRecord } from '../entities/medical-record.entity';

// doctorId nao faz parte do corpo: se vier e descartado, o autor sai do token
export const createMedicalRecordSchema = z.object({
  text: z.string().trim().min(1, 'não pode ser vazio').max(10_000),
});

export type CreateMedicalRecordDTO = z.infer<typeof createMedicalRecordSchema>;

export interface MedicalRecordResponseDTO {
  readonly id: number;
  readonly patientId: number;
  readonly doctorId: number;
  readonly text: string;
  readonly createdAt: string;
}

export function toMedicalRecordResponseDTO(record: MedicalRecord): MedicalRecordResponseDTO {
  return {
    id: record.id,
    patientId: record.patientId,
    doctorId: record.doctorId,
    text: record.text,
    createdAt: record.createdAt.toISOString(),
  };
}
