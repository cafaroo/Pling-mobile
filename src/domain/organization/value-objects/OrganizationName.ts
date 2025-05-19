import { ValueObject } from '@/shared/domain/ValueObject';
import { Result, ok, err } from '@/shared/core/Result';

/**
 * Interface för OrganizationName properties
 */
interface OrganizationNameProps {
  value: string;
}

/**
 * Värde-objekt för organisationsnamn
 */
export class OrganizationName extends ValueObject<OrganizationNameProps> {
  private constructor(props: OrganizationNameProps) {
    super(props);
  }

  /**
   * Returnerar namnvärdet
   */
  get value(): string {
    return this.props.value;
  }

  /**
   * Skapar ett nytt OrganizationName om namnet är giltigt
   * 
   * @param name Organisationsnamnet
   * @returns Ett Result med OrganizationName eller felmeddelande
   */
  public static create(name: string): Result<OrganizationName, string> {
    if (!name) {
      return err('Organisationsnamn får inte vara tomt');
    }

    if (name.trim().length < 2) {
      return err('Organisationsnamn måste vara minst 2 tecken');
    }

    if (name.trim().length > 50) {
      return err('Organisationsnamn får inte vara längre än 50 tecken');
    }

    return ok(new OrganizationName({ value: name.trim() }));
  }

  /**
   * Jämför med ett annat OrganizationName eller en sträng
   * 
   * @param valueToCompare OrganizationName eller sträng att jämföra med
   */
  public equals(valueToCompare: OrganizationName | string): boolean {
    if (valueToCompare instanceof OrganizationName) {
      return this.props.value === valueToCompare.props.value;
    }
    
    return this.props.value === valueToCompare;
  }

  /**
   * Konverterar till sträng
   */
  public toString(): string {
    return this.props.value;
  }
} 