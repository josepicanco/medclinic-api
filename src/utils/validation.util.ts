const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export class ValidationUtil {
  public static isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  public static isValidEmail(value: unknown): value is string {
    return typeof value === 'string' && EMAIL_PATTERN.test(value.trim());
  }

  public static hasMinLength(value: string, minLength: number): boolean {
    return value.trim().length >= minLength;
  }

  public static normalizeEmail(value: string): string {
    return value.trim().toLowerCase();
  }
}
