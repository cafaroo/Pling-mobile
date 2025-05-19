/**
 * UserStatus
 * 
 * Värde-objekt som representerar de olika statusvärden en användare kan ha i systemet.
 */

import { ValueObject } from '@/shared/core/ValueObject';
import { Result, ok, err } from '@/shared/core/Result';

// Bakåtkompatibel enum för UserStatus
export enum UserStatusEnum {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

// Interface för UserStatus properties
export interface UserStatusProps {
  value: string;
}

/**
 * UserStatus är ett värde-objekt som representerar en användares status i systemet
 */
export class UserStatus extends ValueObject<UserStatusProps> {
  
  private constructor(props: UserStatusProps) {
    super(props);
  }
  
  /**
   * Skapar ett nytt UserStatus-värdesobjekt
   */
  public static create(statusValue: string): Result<UserStatus, string> {
    // Kontrollera att statusen är en av de tillåtna värdena
    const normalizedStatus = statusValue.toLowerCase();
    
    if (!Object.values(UserStatusEnum).includes(normalizedStatus as UserStatusEnum)) {
      return err(`"${statusValue}" är inte en giltig användarstatus. Giltiga värden är: ${Object.values(UserStatusEnum).join(', ')}`);
    }
    
    return ok(new UserStatus({ value: normalizedStatus }));
  }
  
  /**
   * Färdigdefinierade statusar
   */
  public static readonly PENDING: UserStatus = new UserStatus({ value: UserStatusEnum.PENDING });
  public static readonly ACTIVE: UserStatus = new UserStatus({ value: UserStatusEnum.ACTIVE });
  public static readonly INACTIVE: UserStatus = new UserStatus({ value: UserStatusEnum.INACTIVE });
  public static readonly BLOCKED: UserStatus = new UserStatus({ value: UserStatusEnum.BLOCKED });
  
  /**
   * Hämtar statusvärdet
   */
  get value(): string {
    return this.props.value;
  }
  
  /**
   * Jämför om detta UserStatus-objekt är samma som en annan status
   * Implementerar ValueObject.equals
   */
  public equals(vo?: ValueObject<UserStatusProps>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    
    if (!(vo instanceof UserStatus)) {
      return false;
    }
    
    return this.props.value === vo.props.value;
  }
  
  /**
   * Jämför om detta UserStatus-objekt är samma som ett statusvärde (string eller UserStatus)
   */
  public equalsValue(status?: UserStatus | string): boolean {
    if (status === null || status === undefined) {
      return false;
    }
    
    if (typeof status === 'string') {
      return this.props.value === status.toLowerCase();
    }
    
    return this.props.value === status.props.value;
  }
  
  /**
   * Returnerar strängreprentation av statusen
   */
  toString(): string {
    return this.props.value;
  }
  
  /**
   * Hämtar statusvärdet (för bakåtkompatibilitet)
   */
  getValue(): string {
    return this.props.value;
  }
}

// Bakåtkompatibla hjälpfunktioner

/**
 * Validerar om en sträng är en giltig UserStatus
 * 
 * @param status Status som ska valideras
 * @returns true om statusen är giltig, annars false
 */
export function isValidUserStatus(status: string): boolean {
  return Object.values(UserStatusEnum).includes(status as UserStatusEnum);
}

/**
 * Returnerar alla tillgängliga användarstatusar
 * 
 * @returns Array med alla giltiga statusvärden
 */
export function getAllUserStatuses(): string[] {
  return Object.values(UserStatusEnum);
}

/**
 * Konverterar en sträng till UserStatus om möjligt
 * 
 * @param status Sträng att konvertera
 * @returns UserStatus-objekt via Result-pattern
 */
export function parseUserStatus(status: string | UserStatus): Result<UserStatus, string> {
  if (typeof status === 'string') {
    // Om statusen är en sträng, försök skapa ett UserStatus-objekt
    const normalizedStatus = status.toLowerCase();
    
    // Översätt strängen till motsvarande UserStatus-instans
    switch (normalizedStatus) {
      case UserStatusEnum.PENDING:
        return ok(UserStatus.PENDING);
      case UserStatusEnum.ACTIVE:
        return ok(UserStatus.ACTIVE);
      case UserStatusEnum.INACTIVE:
        return ok(UserStatus.INACTIVE);
      case UserStatusEnum.BLOCKED:
        return ok(UserStatus.BLOCKED);
      default:
        return err(`Ogiltig användarstatus: ${status}`);
    }
  }
  
  // Om det redan är ett UserStatus-värde
  return ok(status);
}

// Bakåtkompatibel exportering för att stödja legacy-kod som använder den gamla enumen
export { UserStatusEnum as UserStatus }; 