import { UserRole, isUserRole } from '../enums/user-role.enum';
import { BadRequestError } from '../errors/app-error';
import { ValidationUtil } from '../utils/validation.util';

export interface CreateUserDTO {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly role: UserRole;
}

const MIN_PASSWORD_LENGTH = 8;
const MIN_NAME_LENGTH = 3;

export function parseCreateUserDTO(body: unknown): CreateUserDTO {
  const errors: string[] = [];
  const payload = (body ?? {}) as Record<string, unknown>;

  const { name, email, password, role } = payload;

  if (!ValidationUtil.isNonEmptyString(name)) {
    errors.push('O campo "name" é obrigatório.');
  } else if (!ValidationUtil.hasMinLength(name, MIN_NAME_LENGTH)) {
    errors.push(`O campo "name" deve possuir no mínimo ${MIN_NAME_LENGTH} caracteres.`);
  }

  if (!ValidationUtil.isNonEmptyString(email)) {
    errors.push('O campo "email" é obrigatório.');
  } else if (!ValidationUtil.isValidEmail(email)) {
    errors.push('O campo "email" deve conter um endereço de e-mail válido.');
  }

  if (!ValidationUtil.isNonEmptyString(password)) {
    errors.push('O campo "password" é obrigatório.');
  } else if (!ValidationUtil.hasMinLength(password, MIN_PASSWORD_LENGTH)) {
    errors.push(`O campo "password" deve possuir no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`);
  }

  if (role !== undefined && !isUserRole(role)) {
    errors.push('O campo "role" deve ser ADMIN ou ATENDENTE.');
  }

  if (errors.length > 0) {
    throw new BadRequestError('Dados inválidos para o cadastro de usuário.', errors);
  }

  return {
    name: (name as string).trim(),
    email: ValidationUtil.normalizeEmail(email as string),
    password: password as string,
    role: isUserRole(role) ? role : UserRole.ATENDENTE,
  };
}
