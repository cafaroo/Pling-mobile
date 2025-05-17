/**
 * Mock-implementation av User-händelser för testning
 * 
 * Dessa klasser är designade för att vara kompatibla med testerna som förväntar sig
 * både äldre händelsestrukturer (t.ex. med 'name' istället för 'eventType') och nyare
 * händelsestrukturer.
 */

import { UniqueId } from '@/shared/core/UniqueId';
import { User } from '@/domain/user/entities/User';

/**
 * Gemensam struktur för alla mockade användarhändelser
 */
class BaseMockUserEvent {
  public readonly eventId: UniqueId;
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly data: Record<string, any>;
  public readonly eventType: string;
  // För bakåtkompatibilitet med tester som förväntar sig name istället för eventType
  public readonly name: string;

  constructor(eventType: string, user: User | { id: UniqueId | string }, additionalData: Record<string, any> = {}) {
    this.eventId = new UniqueId();
    this.occurredAt = new Date();
    this.eventType = eventType;
    this.name = eventType.replace('Event', '');
    
    const userId = user instanceof User ? user.id : 
      (user.id instanceof UniqueId ? user.id : new UniqueId(user.id as string));
    
    this.aggregateId = userId.toString();
    this.data = {
      userId: userId.toString(),
      timestamp: this.occurredAt,
      ...additionalData
    };
  }
}

/**
 * Mockad implementation av UserCreatedEvent
 * För att stödja både nya och gamla testscenarion
 */
export class MockUserCreatedEvent extends BaseMockUserEvent {
  public readonly userId: UniqueId;
  public readonly email: string;
  public readonly name: string;
  
  constructor(user: User | { id: UniqueId | string }, email: string = 'test@example.com', userName: string = 'Test User') {
    super('UserCreated', user, { email, name: userName });
    
    // Direkta egenskaper för att stödja event.userId istället för event.data.userId
    const userId = user instanceof User ? user.id : 
      (user.id instanceof UniqueId ? user.id : new UniqueId(user.id as string));
    
    this.userId = userId;
    this.email = email;
    this.name = userName;
  }
}

/**
 * Mockad implementation av UserActivatedEvent
 */
export class MockUserActivatedEvent extends BaseMockUserEvent {
  public readonly activationReason: string;
  
  constructor(user: User | { id: UniqueId | string }, activationReason: string = '') {
    super('user.account.activated', user, { activationReason });
    this.activationReason = activationReason;
  }
}

/**
 * Mockad implementation av UserDeactivatedEvent
 */
export class MockUserDeactivatedEvent extends BaseMockUserEvent {
  public readonly deactivationReason: string;
  
  constructor(user: User | { id: UniqueId | string }, deactivationReason: string = '') {
    super('user.account.deactivated', user, { deactivationReason });
    this.deactivationReason = deactivationReason;
  }
}

/**
 * Mockad implementation av UserSecurityEvent
 */
export class MockUserSecurityEvent extends BaseMockUserEvent {
  public readonly securityEventType: string;
  
  constructor(user: User | { id: UniqueId | string }, securityEventType: string, metadata: Record<string, any> = {}) {
    super(securityEventType, user, metadata);
    this.securityEventType = securityEventType;
  }
}

/**
 * Mockad implementation av UserPrivacySettingsChanged
 */
export class MockUserPrivacySettingsChanged extends BaseMockUserEvent {
  public readonly privacy: Record<string, any>;
  
  constructor(user: User | { id: UniqueId | string }, privacy: Record<string, any>) {
    super('UserPrivacySettingsChanged', user, { privacy });
    this.privacy = privacy;
  }
}

/**
 * Mockad implementation av UserNotificationSettingsChanged
 */
export class MockUserNotificationSettingsChanged extends BaseMockUserEvent {
  public readonly notifications: Record<string, any>;
  
  constructor(user: User | { id: UniqueId | string }, notifications: Record<string, any>) {
    super('UserNotificationSettingsChanged', user, { notifications });
    this.notifications = notifications;
  }
} 