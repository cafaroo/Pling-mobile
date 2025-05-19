/**
 * SubscriptionTier (PlanTier)
 * 
 * Värde-objekt som representerar prenumerationsnivåer i systemet.
 */

import { ValueObject } from '@/shared/core/ValueObject';
import { Result, ok, err } from '@/shared/core/Result';

// Bakåtkompatibel enum/typer
export type PlanTierType = 'basic' | 'pro' | 'enterprise';

// Enum för interna referenser
export enum SubscriptionTierEnum {
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

// Interface för SubscriptionTier properties
export interface SubscriptionTierProps {
  value: string;
}

/**
 * SubscriptionTier är ett värde-objekt som representerar en prenumerationsnivå
 */
export class SubscriptionTier extends ValueObject<SubscriptionTierProps> {
  
  private constructor(props: SubscriptionTierProps) {
    super(props);
  }
  
  /**
   * Skapar ett nytt SubscriptionTier-värdesobjekt
   */
  public static create(tierValue: string): Result<SubscriptionTier, string> {
    // Kontrollera att nivån är en av de tillåtna värdena
    const normalizedTier = tierValue.toLowerCase();
    
    if (!Object.values(SubscriptionTierEnum).includes(normalizedTier as SubscriptionTierEnum)) {
      return err(`"${tierValue}" är inte en giltig prenumerationsnivå. Giltiga värden är: ${Object.values(SubscriptionTierEnum).join(', ')}`);
    }
    
    return ok(new SubscriptionTier({ value: normalizedTier }));
  }
  
  /**
   * Färdigdefinierade nivåer
   */
  public static readonly BASIC: SubscriptionTier = new SubscriptionTier({ value: SubscriptionTierEnum.BASIC });
  public static readonly PRO: SubscriptionTier = new SubscriptionTier({ value: SubscriptionTierEnum.PRO });
  public static readonly ENTERPRISE: SubscriptionTier = new SubscriptionTier({ value: SubscriptionTierEnum.ENTERPRISE });
  
  /**
   * Hämtar nivåvärdet
   */
  get value(): string {
    return this.props.value;
  }
  
  /**
   * Jämför om detta SubscriptionTier-objekt är samma som en annan nivå
   * Implementerar ValueObject.equals
   */
  public equals(vo?: ValueObject<SubscriptionTierProps>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    
    if (!(vo instanceof SubscriptionTier)) {
      return false;
    }
    
    return this.props.value === vo.props.value;
  }
  
  /**
   * Jämför om detta SubscriptionTier-objekt är samma som ett nivåvärde (string eller SubscriptionTier)
   */
  public equalsValue(tier?: SubscriptionTier | string): boolean {
    if (tier === null || tier === undefined) {
      return false;
    }
    
    if (typeof tier === 'string') {
      return this.props.value === tier.toLowerCase();
    }
    
    return this.props.value === tier.props.value;
  }
  
  /**
   * Kontrollera om denna nivå är högre än eller lika med en annan nivå
   */
  public isEqualOrHigherThan(tier: SubscriptionTier): boolean {
    const tierOrder = {
      [SubscriptionTierEnum.BASIC]: 1,
      [SubscriptionTierEnum.PRO]: 2,
      [SubscriptionTierEnum.ENTERPRISE]: 3
    };
    
    return tierOrder[this.props.value as SubscriptionTierEnum] >= tierOrder[tier.props.value as SubscriptionTierEnum];
  }
  
  /**
   * Returnerar displayName för nivån
   */
  public getDisplayName(): string {
    switch (this.props.value) {
      case SubscriptionTierEnum.BASIC:
        return 'Basic';
      case SubscriptionTierEnum.PRO:
        return 'Pro';
      case SubscriptionTierEnum.ENTERPRISE:
        return 'Enterprise';
      default:
        return 'Okänd';
    }
  }
  
  /**
   * Returnerar strängreprentation av nivån
   */
  toString(): string {
    return this.props.value;
  }
  
  /**
   * Hämtar nivåvärdet (för bakåtkompatibilitet)
   */
  getValue(): string {
    return this.props.value;
  }
  
  /**
   * Konvertera till PlanTier typ (för bakåtkompatibilitet)
   */
  toPlanTier(): PlanTierType {
    return this.props.value as PlanTierType;
  }
}

// Bakåtkompatibla hjälpfunktioner

/**
 * Konverterar en sträng till SubscriptionTier om möjligt
 * 
 * @param tier Sträng eller SubscriptionTier att konvertera
 * @returns SubscriptionTier-objekt via Result-pattern
 */
export function parseSubscriptionTier(tier: string | SubscriptionTier): Result<SubscriptionTier, string> {
  if (typeof tier === 'string') {
    // Om nivån är en sträng, försök skapa ett SubscriptionTier-objekt
    const normalizedTier = tier.toLowerCase();
    
    // Översätt strängen till motsvarande SubscriptionTier-instans
    switch (normalizedTier) {
      case SubscriptionTierEnum.BASIC:
        return ok(SubscriptionTier.BASIC);
      case SubscriptionTierEnum.PRO:
        return ok(SubscriptionTier.PRO);
      case SubscriptionTierEnum.ENTERPRISE:
        return ok(SubscriptionTier.ENTERPRISE);
      default:
        return err(`Ogiltig prenumerationsnivå: ${tier}`);
    }
  }
  
  // Om det redan är ett SubscriptionTier-värde
  return ok(tier);
}

/**
 * Räknar ut om en funktion är tillgänglig för en viss nivå
 * 
 * @param featureTier Nivån som funktionen kräver
 * @param currentTier Användarens nuvarande nivå
 * @returns true om funktionen är tillgänglig
 */
export function isFeatureAvailableForTier(
  featureTier: SubscriptionTier | string,
  currentTier: SubscriptionTier | string
): boolean {
  // Konvertera till SubscriptionTier om de är strängar
  const featureTierResult = typeof featureTier === 'string' 
    ? parseSubscriptionTier(featureTier)
    : ok(featureTier);
    
  const currentTierResult = typeof currentTier === 'string'
    ? parseSubscriptionTier(currentTier)
    : ok(currentTier);
  
  // Om någon konvertering misslyckades, returnera false
  if (featureTierResult.isErr() || currentTierResult.isErr()) {
    return false;
  }
  
  // Jämför nivåerna
  return currentTierResult.value.isEqualOrHigherThan(featureTierResult.value);
}

// Bakåtkompatibel exportering
export { SubscriptionTierEnum as PlanTier }; 