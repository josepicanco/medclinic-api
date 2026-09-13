import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';

export interface UserResponseDTO {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: UserRole;
  readonly createdAt: Date;
}

export interface AuthResponseDTO {
  readonly user: UserResponseDTO;
  readonly token: string;
  readonly expiresIn: string;
}

// toda resposta de usuário passa por aqui para não vazar o hash da senha
export function toUserResponseDTO(user: User): UserResponseDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}
