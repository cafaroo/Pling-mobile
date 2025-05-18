import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { OrganizationRole } from '../value-objects/OrganizationRole';

/**
 * OrganizationMemberRoleChangedEvent
 * 
 * Domänhändelse som publiceras när en medlems roll ändras i en organisation.
 */
export class OrganizationMemberRoleChangedEvent extends DomainEvent {
  public readonly organizationId: UniqueId;
  public readonly userId: UniqueId;
  public readonly oldRole: OrganizationRole;
  public readonly newRole: OrganizationRole;

  /**
   * Skapar en ny OrganizationMemberRoleChangedEvent
   * 
   * @param organizationId - ID för organisationen
   * @param userId - ID för användaren vars roll ändrats
   * @param oldRole - Tidigare roll
   * @param newRole - Ny roll
   */
  constructor(
    organizationId: UniqueId,
    userId: UniqueId,
    oldRole: OrganizationRole,
    newRole: OrganizationRole
  ) {
    super({
      name: 'OrganizationMemberRoleChangedEvent',
      payload: {
        organizationId: organizationId.toString(),
        userId: userId.toString(),
        oldRole,
        newRole
      }
    });
    
    // Spara properties direkt på event-objektet för enklare åtkomst
    this.organizationId = organizationId;
    this.userId = userId;
    this.oldRole = oldRole;
    this.newRole = newRole;
  }
} 