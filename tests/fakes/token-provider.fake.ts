import { UnauthorizedError } from '../../src/errors/app.error';
import { AuthenticatedUser } from '../../src/types/authenticated-user.type';
import { ITokenProvider } from '../../src/utils/jwt.util';

export class FakeTokenProvider implements ITokenProvider {
  public sign(user: AuthenticatedUser): string {
    return `token:${user.id}:${user.roles.join(',')}`;
  }

  public verify(): AuthenticatedUser {
    throw new UnauthorizedError('Token invalido.');
  }
}
