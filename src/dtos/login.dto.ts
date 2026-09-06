import { BadRequestError } from '../errors/app-error';
import { ValidationUtil } from '../utils/validation.util';

export interface LoginDTO {
  readonly email: string;
  readonly password: string;
}

export function parseLoginDTO(body: unknown): LoginDTO {
  const errors: string[] = [];
  const payload = (body ?? {}) as Record<string, unknown>;

  const { email, password } = payload;

  if (!ValidationUtil.isNonEmptyString(email)) {
    errors.push('O campo "email" é obrigatório.');
  }

  if (!ValidationUtil.isNonEmptyString(password)) {
    errors.push('O campo "password" é obrigatório.');
  }

  if (errors.length > 0) {
    throw new BadRequestError('Dados inválidos para o login.', errors);
  }

  return {
    email: ValidationUtil.normalizeEmail(email as string),
    password: password as string,
  };
}
