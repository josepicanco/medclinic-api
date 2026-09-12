import { NextFunction, Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

import { env } from '../config/env';
import { AppError } from '../errors/app-error';

interface ErrorResponseBody {
  status: 'error';
  statusCode: number;
  message: string;
  details?: readonly string[];
  path: string;
  timestamp: string;
}

const UNIQUE_VIOLATION_CODE = '23505'; // código do Postgres para unique violado

export function errorHandler(
  error: unknown,
  request: Request,
  response: Response,
  _next: NextFunction,
): void {
  const body: ErrorResponseBody = {
    status: 'error',
    statusCode: 500,
    message: 'Erro interno do servidor.',
    path: request.originalUrl,
    timestamp: new Date().toISOString(),
  };

  if (error instanceof AppError) {
    body.statusCode = error.statusCode;
    body.message = error.message;

    if (error.details && error.details.length > 0) {
      body.details = error.details;
    }
  } else if (error instanceof QueryFailedError) {
    const driverError = error.driverError as { code?: string } | undefined;

    if (driverError?.code === UNIQUE_VIOLATION_CODE) {
      body.statusCode = 409;
      body.message = 'Já existe um registro com este valor único.';
    } else {
      body.statusCode = 500;
      body.message = 'Falha ao executar a operação no banco de dados.';
    }
  } else if (error instanceof SyntaxError && 'body' in error) {
    body.statusCode = 400;
    body.message = 'JSON inválido no corpo da requisição.';
  }

  if (body.statusCode >= 500) {
    console.error('[error-handler]', error);
  }

  if (env.nodeEnv !== 'production' && body.statusCode >= 500 && error instanceof Error) {
    body.details = [error.message];
  }

  response.status(body.statusCode).json(body);
}
