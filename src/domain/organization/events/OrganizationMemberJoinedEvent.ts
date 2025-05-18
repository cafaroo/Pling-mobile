import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';
import { OrganizationRole } from '../value-objects/OrganizationRole';

/**
 * OrganizationMemberJoinedEvent
 * 
 * Domänhändelse som publiceras när en medlem går med i en organisation.
 */
export class OrganizationMemberJoinedEvent extends DomainEvent {
  public readonly organizationId: UniqueId;
  public readonly userId: UniqueId;
  public readonly role: OrganizationRole;

  /**
   * Skapar en ny OrganizationMemberJoinedEvent
   * 
   * @param organizationId - ID för organisationen
   * @param userId - ID för användaren som gick med
   * @param role - Användarens roll i organisationen
   */
  constructor(organizationId: UniqueId, userId: UniqueId, role: OrganizationRole) {
    super({
      name: 'OrganizationMemberJoinedEvent',
      payload: {
        organizationId: organizationId.toString(),
        userId: userId.toString(),
        role
      }
    });
    
    // Spara properties direkt på event-objektet för enklare åtkomst
    this.organizationId = organizationId;
    this.userId = userId;
    this.role = role;
  }
} 