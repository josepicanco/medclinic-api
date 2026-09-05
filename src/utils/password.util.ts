import bcrypt from 'bcryptjs';

import { env } from '../config/env';

export class PasswordUtil {
  public static async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, env.bcryptSaltRounds);
  }

  public static async compare(plainPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }
}
