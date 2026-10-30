import { NextFunction, Request, Response } from 'express';

import { AppError, ErrorCode } from '../errors/app.error';

// traducao codigo de dominio -> status http, so existe aqui (RP03)
const STATUS_BY_CODE: Record<ErrorCode, number> = {
  DADOS_INVALIDOS: 400,
  NAO_AUTENTICADO: 401,
  CREDENCIAIS_INVALIDAS: 401,
  ACESSO_NEGADO: 403,
  RECURSO_NAO_ENCONTRADO: 404,
  EMAIL_JA_CADASTRADO: 409,
  CPF_JA_CADASTRADO: 409,
  CRM_JA_CADASTRADO: 409,
  HORARIO_INDISPONIVEL: 409,
  PACIENTE_INDISPONIVEL: 409,
  HORARIO_FORA_DA_ESCALA: 422,
  TRANSICAO_INVALIDA: 422,
};

interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string;
}

// erros do body-parser (json quebrado, corpo grande demais) chegam com status 4xx
function isClientHttpError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('status' in error)) {
    return false;
  }

  const status = (error as { status: unknown }).status;
  return typeof status === 'number' && status >= 400 && status < 500;
}

// RF11/RNF03: todo erro sai no envelope do contrato e sem stack trace
export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction): void {
  let body: ErrorResponseBody;

  if (error instanceof AppError) {
    body = { statusCode: STATUS_BY_CODE[error.code], error: error.code, message: error.message };
  } else if (isClientHttpError(error)) {
    body = { statusCode: 400, error: 'DADOS_INVALIDOS', message: 'JSON inválido no corpo da requisição.' };
  } else {
    console.error('[error-handler]', error);
    body = { statusCode: 500, error: 'ERRO_INTERNO', message: 'Erro interno do servidor.' };
  }

  response.status(body.statusCode).json(body);
}
