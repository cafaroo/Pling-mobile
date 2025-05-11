import { UniqueId } from '@/shared/core/UniqueId';
import { Organization } from '../entities/Organization';
import { OrganizationPermission } from '../value-objects/OrganizationPermission';

/**
 * Kontrollerar om en användare har en specifik behörighet i en organisation
 * 
 * @param organization Organisationen att kontrollera behörighet i
 * @param userId Användarens ID
 * @param permission Behörigheten att kontrollera
 * @returns True om användaren har behörigheten, annars false
 */
export function hasOrganizationPermission(
  organization: Organization,
  userId: UniqueId,
  permission: OrganizationPermission
): boolean {
  return organization.hasMemberPermission(userId, permission);
}

/**
 * Kontrollerar om en användare är medlem i en organisation
 * 
 * @param organization Organisationen att kontrollera medlemskap i
 * @param userId Användarens ID
 * @returns True om användaren är medlem, annars false
 */
export function isOrganizationMember(
  organization: Organization,
  userId: UniqueId
): boolean {
  return organization.members.some(member => member.userId.equals(userId));
}

/**
 * Kontrollerar om en användare är ägare av en organisation
 * 
 * @param organization Organisationen att kontrollera ägarskap för
 * @param userId Användarens ID
 * @returns True om användaren är ägare, annars false
 */
export function isOrganizationOwner(
  organization: Organization,
  userId: UniqueId
): boolean {
  return organization.ownerId.equals(userId);
}

/**
 * Kontrollerar om en användare kan hantera medlemmar i en organisation
 * 
 * @param organization Organisationen att kontrollera behörighet i
 * @param userId Användarens ID
 * @returns True om användaren kan hantera medlemmar, annars false
 */
export function canManageOrganizationMembers(
  organization: Organization,
  userId: UniqueId
): boolean {
  return hasOrganizationPermission(organization, userId, OrganizationPermission.MANAGE_MEMBERS);
}

/**
 * Kontrollerar om en användare kan hantera team i en organisation
 * 
 * @param organization Organisationen att kontrollera behörighet i
 * @param userId Användarens ID
 * @returns True om användaren kan hantera team, annars false
 */
export function canManageOrganizationTeams(
  organization: Organization,
  userId: UniqueId
): boolean {
  return hasOrganizationPermission(organization, userId, OrganizationPermission.MANAGE_TEAMS);
}

/**
 * Policy för om organization features är tillgängliga baserat på prenumeration
 * Detta är en placeholder - i verklig implementation ska detta delegeras till subscription-domänen
 */
export function isFeatureAvailable(
  organization: Organization,
  featureName: string
): boolean {
  // Detta är en placeholder - i verklig implementation ska detta delegeras till subscription-domänen
  return organization.hasActiveSubscription();
} 