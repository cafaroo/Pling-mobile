import { UniqueId } from '@/shared/core/UniqueId';
import { Subscription } from '../entities/Subscription';
import { BillingAddress, SubscriptionStatus } from '../entities/SubscriptionTypes';
import {
  SubscriptionCreatedEvent,
  SubscriptionStatusChangedEvent,
  SubscriptionPlanChangedEvent,
  SubscriptionCancelledEvent,
  SubscriptionPeriodUpdatedEvent,
  SubscriptionUsageUpdatedEvent,
  SubscriptionPaymentMethodUpdatedEvent,
  SubscriptionBillingUpdatedEvent,
  BillingInfo
} from '../events';

describe('Standardiserade Subscription Events', () => {
  let subscription: Subscription;
  let organizationId: UniqueId;
  let subscriptionId: UniqueId;
  
  beforeEach(() => {
    organizationId = new UniqueId();
    
    // Skapa en prenumeration för testning
    const result = Subscription.create({
      organizationId,
      planId: 'plan-premium',
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(2024, 0, 1), // 1 januari 2024
      endDate: new Date(2024, 1, 1),   // 1 februari 2024
    });
    
    expect(result.isOk()).toBe(true);
    subscription = result.value;
    subscriptionId = subscription.id;
    
    // Rensa events som skapats vid konstruktion
    subscription.flushEvents();
  });
  
  describe('SubscriptionCreatedEvent', () => {
    it('skapar korrekt event med parameterobjekt', () => {
      // Skapa direkt med props
      const eventProps = {
        subscriptionId,
        organizationId,
        planId: 'plan-premium',
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 1, 1),
      };
      
      const event = new SubscriptionCreatedEvent(eventProps);
      
      // Verifiera event-egenskaper
      expect(event.eventType).toBe('SubscriptionCreatedEvent');
      expect(event.subscriptionId.equals(subscriptionId)).toBe(true);
      expect(event.organizationId.equals(organizationId)).toBe(true);
      expect(event.planId.toString()).toBe('plan-premium');
      expect(event.status).toBe(SubscriptionStatus.ACTIVE);
      expect(event.aggregateId).toBe(subscriptionId.toString());
      
      // Verifiera payload
      expect(event.payload).toHaveProperty('subscriptionId', subscriptionId.toString());
      expect(event.payload).toHaveProperty('organizationId', organizationId.toString());
      expect(event.payload).toHaveProperty('status', SubscriptionStatus.ACTIVE);
    });
    
    it('accepterar både UniqueId och sträng för ID-egenskaper', () => {
      // Skapa med strängar istället för UniqueId-objekt
      const eventProps = {
        subscriptionId: subscriptionId.toString(),
        organizationId: organizationId.toString(),
        planId: 'plan-premium',
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 1, 1),
      };
      
      const event = new SubscriptionCreatedEvent(eventProps);
      
      // Verifiera att strängarna konverterades till UniqueId-objekt
      expect(event.subscriptionId).toBeInstanceOf(UniqueId);
      expect(event.organizationId).toBeInstanceOf(UniqueId);
      expect(event.planId).toBeInstanceOf(UniqueId);
      
      // Verifiera att värdena är korrekta
      expect(event.subscriptionId.toString()).toBe(subscriptionId.toString());
      expect(event.organizationId.toString()).toBe(organizationId.toString());
      expect(event.planId.toString()).toBe('plan-premium');
    });
  });
  
  describe('SubscriptionStatusChangedEvent', () => {
    it('genereras när status uppdateras', () => {
      // Uppdatera status
      subscription.updateStatus(SubscriptionStatus.PAST_DUE);
      
      // Hämta events
      const events = subscription.flushEvents();
      
      // Hitta det standardiserade eventet
      const statusEvent = events.find(e => e instanceof SubscriptionStatusChangedEvent) as SubscriptionStatusChangedEvent;
      
      // Verifiera att eventet skapades
      expect(statusEvent).toBeDefined();
      expect(statusEvent.eventType).toBe('SubscriptionStatusChangedEvent');
      expect(statusEvent.oldStatus).toBe(SubscriptionStatus.ACTIVE);
      expect(statusEvent.newStatus).toBe(SubscriptionStatus.PAST_DUE);
      expect(statusEvent.subscriptionId.equals(subscriptionId)).toBe(true);
      expect(statusEvent.organizationId.equals(organizationId)).toBe(true);
      
      // Verifiera att även det gamla event-formatet finns
      const legacyEvent = events.find(e => e.name === 'subscription.status_changed');
      expect(legacyEvent).toBeDefined();
    });
  });
  
  describe('SubscriptionPlanChangedEvent', () => {
    it('genereras när planen ändras', () => {
      // Ändra planen
      const newPlanId = new UniqueId('plan-enterprise');
      subscription.changePlan(newPlanId);
      
      // Hämta events
      const events = subscription.flushEvents();
      
      // Hitta det standardiserade eventet
      const planEvent = events.find(e => e instanceof SubscriptionPlanChangedEvent) as SubscriptionPlanChangedEvent;
      
      // Verifiera att eventet skapades
      expect(planEvent).toBeDefined();
      expect(planEvent.eventType).toBe('SubscriptionPlanChangedEvent');
      expect(planEvent.oldPlanId.toString()).toBe('plan-premium');
      expect(planEvent.newPlanId.equals(newPlanId)).toBe(true);
      expect(planEvent.subscriptionId.equals(subscriptionId)).toBe(true);
      expect(planEvent.organizationId.equals(organizationId)).toBe(true);
      
      // Verifiera att även det gamla event-formatet finns
      const legacyEvent = events.find(e => e.name === 'subscription.plan_changed');
      expect(legacyEvent).toBeDefined();
    });
  });
  
  describe('SubscriptionCancelledEvent', () => {
    it('genereras när prenumerationen avbryts', () => {
      // Avbryt prenumerationen
      subscription.cancel(true);
      
      // Hämta events
      const events = subscription.flushEvents();
      
      // Hitta det standardiserade eventet
      const cancelEvent = events.find(e => e instanceof SubscriptionCancelledEvent) as SubscriptionCancelledEvent;
      
      // Verifiera att eventet skapades
      expect(cancelEvent).toBeDefined();
      expect(cancelEvent.eventType).toBe('SubscriptionCancelledEvent');
      expect(cancelEvent.atPeriodEnd).toBe(true);
      expect(cancelEvent.subscriptionId.equals(subscriptionId)).toBe(true);
      expect(cancelEvent.organizationId.equals(organizationId)).toBe(true);
      
      // Verifiera att även det gamla event-formatet finns
      const legacyEvent = events.find(e => e.name === 'subscription.cancelled');
      expect(legacyEvent).toBeDefined();
      
      // Verifiera att prenumerationen nu är avbruten
      expect(subscription.status).toBe(SubscriptionStatus.CANCELED);
    });
  });
  
  describe('SubscriptionPeriodUpdatedEvent', () => {
    it('genereras när perioden uppdateras', () => {
      // Uppdatera perioden
      const newStartDate = new Date(2024, 2, 1); // 1 mars 2024
      const newEndDate = new Date(2024, 3, 1); // 1 april 2024
      subscription.updatePeriod(newStartDate, newEndDate);
      
      // Hämta events
      const events = subscription.flushEvents();
      
      // Hitta det standardiserade eventet
      const periodEvent = events.find(e => e instanceof SubscriptionPeriodUpdatedEvent) as SubscriptionPeriodUpdatedEvent;
      
      // Verifiera att eventet skapades
      expect(periodEvent).toBeDefined();
      expect(periodEvent.eventType).toBe('SubscriptionPeriodUpdatedEvent');
      expect(periodEvent.startDate).toEqual(newStartDate);
      expect(periodEvent.endDate).toEqual(newEndDate);
      expect(periodEvent.subscriptionId.equals(subscriptionId)).toBe(true);
      expect(periodEvent.organizationId.equals(organizationId)).toBe(true);
      
      // Verifiera att även det gamla event-formatet finns
      const legacyEvent = events.find(e => e.name === 'subscription.period_updated');
      expect(legacyEvent).toBeDefined();
      
      // Verifiera att prenumerationens egenskaper har uppdaterats
      expect(subscription.startDate).toEqual(newStartDate);
      expect(subscription.endDate).toEqual(newEndDate);
    });
    
    it('kastar ett fel om slutdatum är tidigare än startdatum', () => {
      // Försök uppdatera med ogiltiga datum
      const newStartDate = new Date(2024, 3, 1); // 1 april 2024
      const newEndDate = new Date(2024, 2, 1); // 1 mars 2024
      
      // Förvänta att ett fel kastas
      expect(() => {
        subscription.updatePeriod(newStartDate, newEndDate);
      }).toThrow('Slutdatum måste vara senare än startdatum');
    });
  });
  
  describe('SubscriptionUsageUpdatedEvent', () => {
    it('genereras när användningen uppdateras', () => {
      // Uppdatera användning
      const usage = {
        teamMembers: 5,
        mediaStorage: 1024, // 1GB
      };
      
      subscription.updateUsage(usage);
      
      // Hämta events
      const events = subscription.flushEvents();
      
      // Hitta det standardiserade eventet
      const usageEvent = events.find(e => e instanceof SubscriptionUsageUpdatedEvent) as SubscriptionUsageUpdatedEvent;
      
      // Verifiera att eventet skapades
      expect(usageEvent).toBeDefined();
      expect(usageEvent.eventType).toBe('SubscriptionUsageUpdatedEvent');
      expect(usageEvent.usage.teamMembers).toBe(5);
      expect(usageEvent.usage.mediaStorage).toBe(1024);
      expect(usageEvent.subscriptionId.equals(subscriptionId)).toBe(true);
      expect(usageEvent.organizationId.equals(organizationId)).toBe(true);
      
      // Verifiera att även det gamla event-formatet finns
      const legacyEvent = events.find(e => e.name === 'subscription.usage_updated');
      expect(legacyEvent).toBeDefined();
    });
  });
  
  describe('SubscriptionPaymentMethodUpdatedEvent', () => {
    it('genereras när betalningsmetoden uppdateras', () => {
      // Uppdatera betalningsmetod
      const paymentMethodId = 'pm_123456789';
      
      subscription.updatePaymentMethod(paymentMethodId);
      
      // Hämta events
      const events = subscription.flushEvents();
      
      // Hitta det standardiserade eventet
      const paymentEvent = events.find(e => e instanceof SubscriptionPaymentMethodUpdatedEvent) as SubscriptionPaymentMethodUpdatedEvent;
      
      // Verifiera att eventet skapades
      expect(paymentEvent).toBeDefined();
      expect(paymentEvent.eventType).toBe('SubscriptionPaymentMethodUpdatedEvent');
      expect(paymentEvent.paymentMethodId).toBe(paymentMethodId);
      expect(paymentEvent.subscriptionId.equals(subscriptionId)).toBe(true);
      expect(paymentEvent.organizationId.equals(organizationId)).toBe(true);
      
      // Verifiera att även det gamla event-formatet finns
      const legacyEvent = events.find(e => e.name === 'subscription.payment_method_updated');
      expect(legacyEvent).toBeDefined();
    });
  });
  
  describe('SubscriptionBillingUpdatedEvent', () => {
    it('genereras när faktureringsinformationen uppdateras', () => {
      // Uppdatera faktureringsinformation
      const billingUpdate = {
        email: 'invoice@example.com',
        name: 'Example AB',
        address: {
          street: 'Testgatan 123',
          city: 'Stockholm',
          postalCode: '12345',
          country: 'SE'
        },
        vatNumber: 'SE123456789'
      };
      
      subscription.updateBillingDetails(billingUpdate);
      
      // Hämta events
      const events = subscription.flushEvents();
      
      // Hitta det standardiserade eventet
      const billingEvent = events.find(e => e instanceof SubscriptionBillingUpdatedEvent) as SubscriptionBillingUpdatedEvent;
      
      // Verifiera att eventet skapades
      expect(billingEvent).toBeDefined();
      expect(billingEvent.eventType).toBe('SubscriptionBillingUpdatedEvent');
      expect(billingEvent.billing.email).toBe(billingUpdate.email);
      expect(billingEvent.billing.name).toBe(billingUpdate.name);
      expect(billingEvent.billing.address.street).toBe(billingUpdate.address.street);
      expect(billingEvent.billing.vatNumber).toBe(billingUpdate.vatNumber);
      expect(billingEvent.subscriptionId.equals(subscriptionId)).toBe(true);
      expect(billingEvent.organizationId.equals(organizationId)).toBe(true);
      
      // Verifiera att även det gamla event-formatet finns
      const legacyEvent = events.find(e => e.name === 'subscription.billing_updated');
      expect(legacyEvent).toBeDefined();
    });
    
    it('kan hantera partiella uppdateringar av faktureringsinformation', () => {
      // Uppdatera endast e-post
      subscription.updateBillingDetails({
        email: 'newinvoice@example.com'
      });
      
      // Hämta events
      const events = subscription.flushEvents();
      
      // Hitta det standardiserade eventet
      const billingEvent = events.find(e => e instanceof SubscriptionBillingUpdatedEvent) as SubscriptionBillingUpdatedEvent;
      
      // Verifiera att eventet skapades
      expect(billingEvent).toBeDefined();
      expect(billingEvent.billing.email).toBe('newinvoice@example.com');
      
      // Verifiera att övriga fält behållit standardvärden
      expect(billingEvent.billing.name).toBe('');
      expect(billingEvent.billing.address.country).toBe('');
    });
  });
}); 