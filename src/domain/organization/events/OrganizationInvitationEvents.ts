/**
 * OrganizationInvitationEvents.ts
 * Klasser för händelser relaterade till organisationsinbjudningar
 */

import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { UniqueEntityID } from '@/domain/core/UniqueEntityID';

/**
 * MemberInvitedToOrganization - Händelse som utlöses när en medlem bjuds in till en organisation
 */
export class MemberInvitedToOrganization implements IDomainEvent {
  public readonly name: string = 'MemberInvitedToOrganization';
  public readonly eventName: string = 'MemberInvitedToOrganization';
  public readonly dateTimeOccurred: Date;
  public readonly payload: {
    organizationId: string;
    userId: string;
    invitedBy: string;
    role?: string;
    expiresAt?: Date;
  };

  constructor(
    organizationId: UniqueEntityID, 
    userId: UniqueEntityID, 
    invitedBy: UniqueEntityID, 
    role?: string,
    expiresAt?: Date
  ) {
    this.dateTimeOccurred = new Date();
    this.payload = {
      organizationId: organizationId.toString(),
      userId: userId.toString(),
      invitedBy: invitedBy.toString()
    };
    
    if (role) this.payload.role = role;
    if (expiresAt) this.payload.expiresAt = expiresAt;
  }

  get aggregateId(): string {
    return this.payload.organizationId;
  }
}

/**
 * OrganizationInvitationAccepted - Händelse som utlöses när en inbjudan till en organisation accepteras
 */
export class OrganizationInvitationAccepted implements IDomainEvent {
  public readonly name: string = 'OrganizationInvitationAccepted';
  public readonly eventName: string = 'OrganizationInvitationAccepted';
  public readonly dateTimeOccurred: Date;
  public readonly payload: {
    organizationId: string;
    invitationId: string;
    userId: string;
  };

  constructor(
    organizationId: UniqueEntityID, 
    invitationId: UniqueEntityID, 
    userId: UniqueEntityID
  ) {
    this.dateTimeOccurred = new Date();
    this.payload = {
      organizationId: organizationId.toString(),
      invitationId: invitationId.toString(),
      userId: userId.toString()
    };
  }

  get aggregateId(): string {
    return this.payload.organizationId;
  }
}

/**
 * OrganizationInvitationDeclined - Händelse som utlöses när en inbjudan till en organisation avböjs
 */
export class OrganizationInvitationDeclined implements IDomainEvent {
  public readonly name: string = 'OrganizationInvitationDeclined';
  public readonly eventName: string = 'OrganizationInvitationDeclined';
  public readonly dateTimeOccurred: Date;
  public readonly payload: {
    organizationId: string;
    invitationId: string;
    userId: string;
    reason?: string;
  };

  constructor(
    organizationId: UniqueEntityID, 
    invitationId: UniqueEntityID, 
    userId: UniqueEntityID,
    reason?: string
  ) {
    this.dateTimeOccurred = new Date();
    this.payload = {
      organizationId: organizationId.toString(),
      invitationId: invitationId.toString(),
      userId: userId.toString()
    };
    
    if (reason) this.payload.reason = reason;
  }

  get aggregateId(): string {
    return this.payload.organizationId;
  }
} 