export abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean = true;
  public readonly details?: readonly string[];

  protected constructor(message: string, statusCode: number, details?: readonly string[]) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, new.target);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Requisição inválida.', details?: readonly string[]) {
    super(message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autenticado.') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado para o seu perfil de usuário.') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado.') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflito com um registro existente.') {
    super(message, 409);
  }
}
