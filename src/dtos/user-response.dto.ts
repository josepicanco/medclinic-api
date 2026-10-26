import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';

export interface UserResponseDTO {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly roles: UserRole[];
}

export interface AuthResponseDTO {
  readonly accessToken: string;
}

// toda resposta de usuario passa por aqui para nao vazar o hash da senha
export function toUserResponseDTO(user: User): UserResponseDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles,
  };
}
