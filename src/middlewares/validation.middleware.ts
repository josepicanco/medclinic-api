import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodTypeAny, z } from 'zod';

import { BadRequestError } from '../errors/app.error';

type RequestPart = 'params' | 'query' | 'body';
type RequestSchemas = Partial<Record<RequestPart, ZodTypeAny>>;

const VALIDATED_KEY = 'validated';

// RF12: valida params, query e body antes do controller. o resultado convertido fica em
// response.locals porque no express 5 o request.query e somente leitura
export function validate(schemas: RequestSchemas): RequestHandler {
  return (request: Request, response: Response, next: NextFunction): void => {
    const validated: Partial<Record<RequestPart, unknown>> = {};

    for (const part of ['params', 'query', 'body'] as const) {
      const schema = schemas[part];

      if (!schema) {
        continue;
      }

      const result = schema.safeParse(request[part]);

      if (!result.success) {
        const issue = result.error.issues[0];
        const field = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
        throw new BadRequestError(`Dados inválidos em ${part}. ${field}${issue.message}`);
      }

      validated[part] = result.data;
    }

    response.locals[VALIDATED_KEY] = validated;
    next();
  };
}

export function getValidated<S extends ZodTypeAny>(response: Response, part: RequestPart, _schema: S): z.output<S> {
  const validated = response.locals[VALIDATED_KEY] as Partial<Record<RequestPart, z.output<S>>> | undefined;

  if (!validated || !(part in validated)) {
    throw new Error(`A rota não validou "${part}" antes do controller.`);
  }

  return validated[part] as z.output<S>;
}
