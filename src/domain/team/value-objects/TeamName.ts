import { ValueObject } from '@/shared/domain/ValueObject';
import { Result, ok, err } from '@/shared/core/Result';

interface TeamNameProps {
  value: string;
}

/**
 * TeamName värde-objekt
 * 
 * Ett värde-objekt som representerar ett teamnamn med valideringsregler.
 */
export class TeamName extends ValueObject<TeamNameProps> {
  private static readonly MIN_LENGTH = 2;
  private static readonly MAX_LENGTH = 100;
  
  private constructor(props: TeamNameProps) {
    super(props);
  }
  
  /**
   * Skapar ett nytt TeamName-objekt
   * @param name Teamets namn
   * @returns Result med TeamName eller felmeddelande
   */
  public static create(name: string): Result<TeamName, string> {
    // Trimma namnet för att undvika extra mellanslag
    const trimmedName = name.trim();
    
    // Validera namnet
    const validation = this.validate<string>(trimmedName, [
      [trimmedName.length >= this.MIN_LENGTH, `Teamnamn måste vara minst ${this.MIN_LENGTH} tecken`],
      [trimmedName.length <= this.MAX_LENGTH, `Teamnamn får inte vara längre än ${this.MAX_LENGTH} tecken`],
      [!/[^\w\såäöÅÄÖ.-]/g.test(trimmedName), 'Teamnamn får endast innehålla bokstäver, siffror, mellanslag och vissa specialtecken (.-_)'],
    ]);
    
    if (validation.isErr()) {
      return err(validation.error);
    }
    
    return ok(new TeamName({ value: trimmedName }));
  }
  
  /**
   * Returnerar teamets namn som en sträng
   */
  public get value(): string {
    return this.props.value;
  }
  
  /**
   * Representerar TeamName som en sträng
   */
  public toString(): string {
    return this.props.value;
  }
} 