import { UniqueId as CoreUniqueId } from '../core/UniqueId';

/**
 * @deprecated Använd @/shared/core/UniqueId istället. 
 * Denna implementationen finns endast för bakåtkompatibilitet och kommer att tas bort i framtiden.
 * 
 * Varför: Vi standardiserar på en enda UniqueId-implementation för att undvika typkonfliktproblem.
 * 
 * Se docs/standardization/unique-id-standardization.md för migreringsguide.
 */
export class UniqueId extends CoreUniqueId {
  constructor(id?: string) {
    super(id);
    
    // Kommentera ut denna rad under utveckling om varningar blir för många
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Deprecated: Använd @/shared/core/UniqueId istället av UniqueId från shared/domain'
      );
    }
  }

  /**
   * @deprecated Använd den standardiserade equals-metoden istället
   */
  public equals(id?: UniqueId): boolean {
    return super.equals(id);
  }

  /**
   * @deprecated Använd den standardiserade toString-metoden istället
   */
  public toString(): string {
    return super.toString();
  }
  
  /**
   * Hjälpmetod för bakåtkompatibilitet med kod som förväntar sig ValueObject-mönster
   * @deprecated Använd toString istället
   */
  public getValue(): string {
    return this.toString();
  }
} 