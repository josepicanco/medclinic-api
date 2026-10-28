import { IPasswordHasher } from '../../src/utils/password.util';

// hash previsivel ("hashed:<senha>") e registro de cada comparacao feita
export class FakePasswordHasher implements IPasswordHasher {
  public readonly compareCalls: Array<{ plainPassword: string; passwordHash: string }> = [];

  public async hash(plainPassword: string): Promise<string> {
    return `hashed:${plainPassword}`;
  }

  public async compare(plainPassword: string, passwordHash: string): Promise<boolean> {
    this.compareCalls.push({ plainPassword, passwordHash });
    return passwordHash === `hashed:${plainPassword}`;
  }
}
