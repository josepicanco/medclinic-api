import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

import { isUserRole } from '../enums/user-role.enum';
import { UnauthorizedError } from '../errors/app-error';
import { AuthenticatedUser } from '../types/authenticated-user';

export interface ITokenProvider {
  sign(user: AuthenticatedUser): string;
  verify(token: string): AuthenticatedUser;
}

export class JwtUtil implements ITokenProvider {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor(secret: string, expiresIn: string) {
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  public sign(user: AuthenticatedUser): string {
    const options: SignOptions = {
      algorithm: 'HS256',
      expiresIn: this.expiresIn as SignOptions['expiresIn'],
      subject: String(user.id),
    };

    return jwt.sign({ roles: user.roles }, this.secret, options);
  }

  public verify(token: string): AuthenticatedUser {
    try {
      const decoded = jwt.verify(token, this.secret, { algorithms: ['HS256'] });

      if (typeof decoded === 'string') {
        throw new UnauthorizedError('Token inválido.');
      }

      return JwtUtil.parsePayload(decoded);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expirado. Realize o login novamente.');
      }

      if (error instanceof UnauthorizedError) {
        throw error;
      }

      throw new UnauthorizedError('Token inválido.');
    }
  }

  private static parsePayload(decoded: JwtPayload): AuthenticatedUser {
    const id = Number(decoded.sub);
    const roles: unknown = decoded.roles;

    if (!Number.isInteger(id) || id <= 0 || !Array.isArray(roles) || !roles.every(isUserRole)) {
      throw new UnauthorizedError('Token inválido.');
    }

    return { id, roles };
  }
}
