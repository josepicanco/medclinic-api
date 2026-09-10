import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

import { env } from '../config/env';
import { UserRole, isUserRole } from '../enums/user-role.enum';
import { UnauthorizedError } from '../errors/app-error';

export interface TokenPayload {
  readonly sub: string;
  readonly role: UserRole;
}

export class JwtUtil {
  public static sign(payload: TokenPayload): string {
    const options: SignOptions = {
      expiresIn: env.jwt.expiresIn as SignOptions['expiresIn'],
    };

    return jwt.sign({ role: payload.role }, env.jwt.secret, { ...options, subject: payload.sub });
  }

  public static verify(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, env.jwt.secret);

      if (typeof decoded === 'string') {
        throw new UnauthorizedError('Token inválido.');
      }

      return JwtUtil.parsePayload(decoded);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }

      throw new UnauthorizedError('Token inválido.');
    }
  }

  private static parsePayload(decoded: JwtPayload): TokenPayload {
    const { sub, role } = decoded;

    if (typeof sub !== 'string' || !isUserRole(role)) {
      throw new UnauthorizedError('Token inválido.');
    }

    return { sub, role };
  }
}
