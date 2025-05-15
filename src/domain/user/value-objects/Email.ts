import { ValueObject } from '@/shared/domain/ValueObject';
import { Result, ok, err } from '@/shared/core/Result';

interface EmailProps {
  value: string;
}

/**
 * Email värde-objekt
 * 
 * Ett värde-objekt som representerar en e-postadress med valideringsregler.
 */
export class Email extends ValueObject<EmailProps> {
  private static readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  private constructor(props: EmailProps) {
    super(props);
  }
  
  /**
   * Skapar ett nytt Email-objekt
   * @param email E-postadressen
   * @returns Result med Email eller felmeddelande
   */
  public static create(email: string): Result<Email, string> {
    // Trimma och omvandla e-postadressen till gemener
    const processedEmail = email.trim().toLowerCase();
    
    // Validera e-postadressen
    const validation = this.validate<string>(processedEmail, [
      [processedEmail.length > 0, 'E-postadressen får inte vara tom'],
      [this.EMAIL_REGEX.test(processedEmail), 'Ogiltig e-postadress. Måste vara på formatet namn@domän.com'],
    ]);
    
    if (validation.isErr()) {
      return err(validation.error);
    }
    
    return ok(new Email({ value: processedEmail }));
  }
  
  /**
   * Returnerar e-postadressen som en sträng
   */
  public get value(): string {
    return this.props.value;
  }
  
  /**
   * Returnerar domändelen av e-postadressen
   */
  public get domain(): string {
    return this.props.value.split('@')[1];
  }
  
  /**
   * Representerar Email som en sträng
   */
  public toString(): string {
    return this.props.value;
  }

  public equals(other: Email): boolean {
    return this.value === other.value;
  }
} 