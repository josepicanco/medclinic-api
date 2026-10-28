import bcrypt from 'bcryptjs';

export interface IPasswordHasher {
  hash(plainPassword: string): Promise<string>;
  compare(plainPassword: string, passwordHash: string): Promise<boolean>;
}

export class PasswordUtil implements IPasswordHasher {
  private readonly saltRounds: number;

  constructor(saltRounds: number) {
    this.saltRounds = saltRounds;
  }

  public async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.saltRounds);
  }

  public async compare(plainPassword: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, passwordHash);
  }
}
