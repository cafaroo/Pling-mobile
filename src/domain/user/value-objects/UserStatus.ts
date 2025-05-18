/**
 * UserStatus
 * 
 * Enum som representerar de olika statusvärden en användare kan ha i systemet.
 */
export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked'
}

/**
 * Validerar om en sträng är en giltig UserStatus
 * 
 * @param status Status som ska valideras
 * @returns true om statusen är giltig, annars false
 */
export function isValidUserStatus(status: string): boolean {
  return Object.values(UserStatus).includes(status as UserStatus);
}

/**
 * Returnerar alla tillgängliga användarstatusar
 * 
 * @returns Array med alla giltiga statusvärden
 */
export function getAllUserStatuses(): string[] {
  return Object.values(UserStatus);
}

/**
 * Konverterar en sträng till UserStatus om möjligt
 * 
 * @param status Sträng att konvertera
 * @returns UserStatus-enum eller undefined om ogiltig
 */
export function toUserStatus(status: string): UserStatus | undefined {
  if (isValidUserStatus(status)) {
    return status as UserStatus;
  }
  return undefined;
} 