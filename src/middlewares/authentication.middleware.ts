import { NextFunction, Request, RequestHandler, Response } from 'express';

import { UnauthorizedError } from '../errors/app-error';
import { AuthenticatedUser } from '../types/authenticated-user';
import { ITokenProvider } from '../utils/jwt.util';

const BEARER_PREFIX = 'Bearer ';

export function authenticate(tokenProvider: ITokenProvider): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction): void => {
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

    request.user = tokenProvider.verify(token);
    next();
  };
}

// usuario do token; a rota precisa ter passado pelo authenticate
export function getAuthenticatedUser(request: Request): AuthenticatedUser {
  if (!request.user) {
    throw new UnauthorizedError('Não autenticado.');
  }

  return request.user;
}
