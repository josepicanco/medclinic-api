import { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../errors/app-error';
import { JwtUtil } from '../utils/jwt.util';

const BEARER_PREFIX = 'Bearer ';

export function authenticate(request: Request, _response: Response, next: NextFunction): void {
  try {
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      throw new UnauthorizedError('Token de autenticação não informado.');
    }

    if (!authorizationHeader.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedError('Formato do token inválido. Utilize: Bearer <token>.');
    }

    const token = authorizationHeader.slice(BEARER_PREFIX.length).trim();

    if (token.length === 0) {
      throw new UnauthorizedError('Token de autenticação não informado.');
    }

    const payload = JwtUtil.verify(token);

    request.user = { id: payload.sub, role: payload.role };

    next();
  } catch (error) {
    next(error);
  }
}
