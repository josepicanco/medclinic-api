// catalogo de codigos do contrato (secao 4.9.1)
export type ErrorCode =
  | 'DADOS_INVALIDOS'
  | 'NAO_AUTENTICADO'
  | 'CREDENCIAIS_INVALIDAS'
  | 'ACESSO_NEGADO'
  | 'RECURSO_NAO_ENCONTRADO'
  | 'EMAIL_JA_CADASTRADO'
  | 'CPF_JA_CADASTRADO'
  | 'CRM_JA_CADASTRADO'
  | 'HORARIO_INDISPONIVEL'
  | 'PACIENTE_INDISPONIVEL'
  | 'HORARIO_FORA_DA_ESCALA'
  | 'TRANSICAO_INVALIDA';

export type ConflictCode =
  'EMAIL_JA_CADASTRADO' | 'CPF_JA_CADASTRADO' | 'CRM_JA_CADASTRADO' | 'HORARIO_INDISPONIVEL' | 'PACIENTE_INDISPONIVEL';

export type UnprocessableCode = 'HORARIO_FORA_DA_ESCALA' | 'TRANSICAO_INVALIDA';

// a regra de negocio so conhece o codigo; o status HTTP sai no error-handler
export abstract class AppError extends Error {
  public readonly code: ErrorCode;

  protected constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = new.target.name;
    this.code = code;
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Dados inválidos.') {
    super('DADOS_INVALIDOS', message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autenticado.') {
    super('NAO_AUTENTICADO', message);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor(message = 'E-mail ou senha inválidos.') {
    super('CREDENCIAIS_INVALIDAS', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado para o seu perfil de usuário.') {
    super('ACESSO_NEGADO', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado.') {
    super('RECURSO_NAO_ENCONTRADO', message);
  }
}

export class ConflictError extends AppError {
  constructor(code: ConflictCode, message: string) {
    super(code, message);
  }
}

export class UnprocessableError extends AppError {
  constructor(code: UnprocessableCode, message: string) {
    super(code, message);
  }
}
