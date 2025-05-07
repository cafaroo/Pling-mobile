import { Result } from '@/shared/core/Result';

export class Email {
  private constructor(readonly value: string) {}

  public static create(email: string): Result<Email> {
    if (!email) {
      return Result.err('Email kan inte vara tom');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Kontrollera maxlängd
    if (normalizedEmail.length > 254) {
      return Result.err('E-postadressen är för lång');
    }

    // Kontrollera att @ finns och att det bara finns en
    const atCount = normalizedEmail.split('@').length - 1;
    if (atCount !== 1) {
      return Result.err('Ogiltig e-postadress');
    }

    // Dela upp i lokal del och domän
    const [localPart, domain] = normalizedEmail.split('@');

    // Validera lokal del
    if (!localPart || localPart.length > 64) {
      return Result.err('Ogiltig e-postadress');
    }

    // Validera domän
    if (!domain || domain.length > 255 || !domain.includes('.')) {
      return Result.err('Ogiltig e-postadress');
    }

    // Striktare regex för både lokal del och domän
    const emailRegex = /^[a-z0-9](?:[a-z0-9!#$%&'*+/=?^_`{|}~-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9!#$%&'*+/=?^_`{|}~-]*[a-z0-9])?)*@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;

    if (!emailRegex.test(normalizedEmail)) {
      return Result.err('Ogiltig e-postadress');
    }

    return Result.ok(new Email(normalizedEmail));
  }

  public toString(): string {
    return this.value;
  }

  public equals(other: Email): boolean {
    return this.value === other.value;
  }
} 