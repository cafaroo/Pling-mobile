import { DomainEvent } from '@/shared/core/DomainEvent';
import { UniqueId } from '@/shared/core/UniqueId';

/**
 * OrganizationMemberLeftEvent
 * 
 * Domänhändelse som publiceras när en medlem lämnar en organisation.
 */
export class OrganizationMemberLeftEvent extends DomainEvent {
  public readonly organizationId: UniqueId;
  public readonly userId: UniqueId;

  /**
   * Skapar en ny OrganizationMemberLeftEvent
   * 
   * @param organizationId - ID för organisationen
   * @param userId - ID för användaren som lämnade
   */
  constructor(organizationId: UniqueId, userId: UniqueId) {
    super({
      name: 'OrganizationMemberLeftEvent',
      payload: {
        organizationId: organizationId.toString(),
        userId: userId.toString()
      }
    });
    
    // Spara properties direkt på event-objektet för enklare åtkomst
    this.organizationId = organizationId;
    this.userId = userId;
  }
} 