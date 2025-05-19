import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId as CoreUniqueId } from '@/shared/core/UniqueId';

/**
 * @deprecated Använd @/shared/core/UniqueId istället.
 * Denna implementationen finns endast för bakåtkompatibilitet.
 * 
 * Varför: Vi standardiserar på en enda UniqueId-implementation för att undvika typkonfliktproblem.
 * 
 * Se docs/standardization/unique-id-standardization.md för migreringsguide.
 */
export class UniqueId {
  private readonly coreId: CoreUniqueId;

  private constructor(id?: string) {
    this.coreId = new CoreUniqueId(id);
    
    // Kommentera ut denna rad under utveckling om varningar blir för många
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Deprecated: Använd @/shared/core/UniqueId istället av UniqueId från domain/core'
      );
    }
  }

  /**
   * Skapar en ny UniqueId instans med Result-mönster
   * 
   * @param id Valfritt ID att använda, om inget anges genereras ett nytt UUID
   * @returns Result med UniqueId vid framgång, annars felmeddelande
   */
  static create(id?: string): Result<UniqueId, string> {
    if (id && !CoreUniqueId.isValidUUID(id)) {
      return err('Ogiltigt UUID format');
    }
    return ok(new UniqueId(id));
  }

  /**
   * Jämför två UniqueId
   * 
   * @param other UniqueId att jämföra med
   * @returns true om IDs är lika, annars false
   */
  equals(other: UniqueId | CoreUniqueId): boolean {
    if (other instanceof UniqueId) {
      return this.toString() === other.toString();
    }
    return this.toString() === other.toString();
  }

  /**
   * Konverterar till string
   * 
   * @returns string representation av ID
   */
  toString(): string {
    return this.coreId.toString();
  }

  /**
   * Konverterar till string (för bakåtkompatibilitet)
   * 
   * @deprecated Använd toString istället 
   * @returns string representation av ID
   */
  toValue(): string {
    return this.coreId.toString();
  }
  
  /**
   * Konverterar till CoreUniqueId
   * 
   * @returns CoreUniqueId-instans
   */
  toCoreUniqueId(): CoreUniqueId {
    return new CoreUniqueId(this.toString());
  }
  
  /**
   * Statisk metod för att konvertera domain/core/UniqueId till shared/core/UniqueId
   * 
   * @param id UniqueId att konvertera
   * @returns CoreUniqueId
   */
  static toCoreUniqueId(id: UniqueId): CoreUniqueId {
    return new CoreUniqueId(id.toString());
  }
  
  /**
   * Statisk metod för att konvertera shared/core/UniqueId till domain/core/UniqueId med Result-API
   * 
   * @param id CoreUniqueId att konvertera
   * @returns Result med UniqueId
   */
  static fromCoreUniqueId(id: CoreUniqueId): Result<UniqueId, string> {
    return this.create(id.toString());
  }
} 