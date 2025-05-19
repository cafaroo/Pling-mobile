import { v4 as uuidv4 } from 'uuid';

/**
 * Standardiserad UniqueId för hela systemet.
 * Detta är den officiella implementationen som ska användas överallt.
 * 
 * Alla entiteter, värde-objekt och tjänster ska använda denna implementation 
 * för att undvika typkonfliktproblem mellan olika versioner av UniqueId.
 * 
 * @example
 * // Skapa ett nytt ID
 * const id1 = new UniqueId(); // Autogenererat ID
 * const id2 = new UniqueId('existing-uuid'); // Från befintligt värde
 * 
 * // Använda statiska hjälpmetoder
 * const id3 = UniqueId.create(); // Autogenererat
 * const id4 = UniqueId.fromString('existing-uuid'); // Från string
 * 
 * // Jämföra IDs
 * id1.equals(id2); // false
 * id2.equals(UniqueId.fromString(id2.toString())); // true
 */
export class UniqueId {
  private readonly id: string;

  /**
   * Skapar en ny UniqueId instans
   * @param id Valfritt ID att använda, om inget anges genereras ett nytt UUID
   */
  constructor(id?: string) {
    this.id = id || uuidv4();
  }

  /**
   * Jämför två UniqueId-objekt för att se om de representerar samma ID
   * @param id ID att jämföra med
   * @returns true om IDs är lika, annars false
   */
  public equals(id?: UniqueId): boolean {
    if (id === null || id === undefined) {
      return false;
    }
    
    if (typeof id === 'object' && 'toString' in id) {
      return this.toString() === id.toString();
    }
    
    return false;
  }

  /**
   * Konverterar ID till string-format
   * @returns string representation av ID
   */
  public toString(): string {
    return this.id;
  }

  /**
   * Skapar ett nytt UniqueId-objekt från en string
   * @param id String-värde att konvertera från
   * @returns Nytt UniqueId-objekt med det angivna ID-värdet
   */
  public static fromString(id: string): UniqueId {
    return new UniqueId(id);
  }

  /**
   * Skapar ett nytt UniqueId med ett unikt genererat UUID
   * @returns Nytt UniqueId-objekt med genererat UUID
   */
  public static create(): UniqueId {
    return new UniqueId();
  }

  /**
   * Kontrollerar om ett värde är ett giltigt UniqueId-objekt
   * @param obj Objekt att kontrollera
   * @returns true om objektet är ett UniqueId, annars false
   */
  public static isUniqueId(obj: any): obj is UniqueId {
    return obj instanceof UniqueId;
  }
  
  /**
   * Konverterar från en string eller UniqueId till UniqueId
   * Hjälpmetod för att hantera blandade typer av parametrar
   * @param id String eller UniqueId att konvertera 
   * @returns Nytt eller befintligt UniqueId-objekt
   */
  public static from(id: string | UniqueId): UniqueId {
    if (UniqueId.isUniqueId(id)) {
      return id;
    }
    return new UniqueId(id);
  }
  
  /**
   * Validerar om en string är ett giltigt UUID format
   * @param id String att validera
   * @returns true om stringen är ett giltigt UUID, annars false
   */
  public static isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }
  
  /**
   * För interoperabilitet med kod som förväntar sig ett getValue-mönster
   * @deprecated Använd toString() istället
   * @returns string representation av ID
   */
  public getValue(): string {
    return this.toString();
  }
  
  /**
   * För interoperabilitet med kod som förväntar sig ett toValue-mönster
   * @deprecated Använd toString() istället
   * @returns string representation av ID
   */
  public toValue(): string {
    return this.toString();
  }
} 