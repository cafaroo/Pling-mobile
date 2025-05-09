import { Result, ok, err } from '@/shared/core/Result';

export class PhoneNumber {
  private constructor(readonly value: string) {}

  public static create(phoneNumber: string): Result<PhoneNumber> {
    if (!phoneNumber) {
      return err('Telefonnummer kan inte vara tomt');
    }

    // Ta bort alla icke-numeriska tecken
    const normalizedNumber = phoneNumber.replace(/[^\d+]/g, '');

    // Validera formatet (svenska nummer)
    const phoneRegex = /^(\+46|0)7[0-9]{8}$/;
    if (!phoneRegex.test(normalizedNumber)) {
      return err('Ogiltigt telefonnummer');
    }

    // Konvertera till standardformat (+46)
    const standardizedNumber = normalizedNumber.startsWith('0') 
      ? '+46' + normalizedNumber.substring(1)
      : normalizedNumber;

    return ok(new PhoneNumber(standardizedNumber));
  }

  public toString(): string {
    return this.value;
  }

  public format(): string {
    // Formatera för visning: +46 70 123 45 67
    return this.value.replace(/(\+46)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }

  public equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }
} 