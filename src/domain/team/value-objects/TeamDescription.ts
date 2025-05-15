import { ValueObject } from '@/shared/domain/ValueObject';
import { Result, ok, err } from '@/shared/core/Result';

interface TeamDescriptionProps {
  value: string;
}

/**
 * TeamDescription värde-objekt
 * 
 * Ett värde-objekt som representerar beskrivningen av ett team med valideringsregler.
 */
export class TeamDescription extends ValueObject<TeamDescriptionProps> {
  private static readonly MAX_LENGTH = 500;
  
  private constructor(props: TeamDescriptionProps) {
    super(props);
  }
  
  /**
   * Skapar ett nytt TeamDescription-objekt
   * @param description Teamets beskrivning
   * @returns Result med TeamDescription eller felmeddelande
   */
  public static create(description?: string): Result<TeamDescription, string> {
    // Om beskrivningen är tom eller undefined, använd tom sträng
    const processedDescription = description?.trim() || '';
    
    // Validera beskrivningen
    const validation = this.validate<string>(processedDescription, [
      [processedDescription.length <= this.MAX_LENGTH, `Beskrivningen får inte vara längre än ${this.MAX_LENGTH} tecken`],
    ]);
    
    if (validation.isErr()) {
      return err(validation.error);
    }
    
    return ok(new TeamDescription({ value: processedDescription }));
  }
  
  /**
   * Returnerar teamets beskrivning som en sträng
   */
  public get value(): string {
    return this.props.value;
  }
  
  /**
   * Kontrollerar om beskrivningen är tom
   */
  public isEmpty(): boolean {
    return this.props.value.length === 0;
  }
  
  /**
   * Representerar TeamDescription som en sträng
   */
  public toString(): string {
    return this.props.value;
  }
} 