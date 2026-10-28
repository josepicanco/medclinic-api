import { z } from 'zod';

import { UserRole } from '../enums/user-role.enum';
import { nameSchema } from './common.dto';

export const emailSchema = z.string().trim().toLowerCase().pipe(z.string().email().max(180));

const MIN_PASSWORD_LENGTH = 8;

export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `deve possuir no mínimo ${MIN_PASSWORD_LENGTH} caracteres`)
  .max(200);

export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  roles: z.array(z.nativeEnum(UserRole)).min(1, 'informe ao menos um perfil'),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;
