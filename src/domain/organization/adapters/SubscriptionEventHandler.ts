/**
 * Hanterare för prenumerationshändelser i Organization-domänen
 * 
 * Denna klass ansvarar för att lyssna på händelser från Subscription-domänen
 * och uppdatera Organisation-entiteterna i enlighet med dessa händelser.
 */

import { OrganizationRepository } from '../repositories/OrganizationRepository';
import { Result } from '@/shared/core/Result';

// Import av händelsetyperna från Subscription-domänen
import {
  SubscriptionCreatedEvent,
  SubscriptionStatusChangedEvent,
  SubscriptionPlanChangedEvent,
  SubscriptionCancelledEvent
} from '@/domain/subscription/events';

/**
 * Hanterare för prenumerationshändelser
 */
export class SubscriptionEventHandler {
  private organizationRepo: OrganizationRepository;

  constructor(organizationRepo: OrganizationRepository) {
    this.organizationRepo = organizationRepo;
  }

  /**
   * Hanterar händelsen när en ny prenumeration skapas
   */
  async handleSubscriptionCreated(event: SubscriptionCreatedEvent): Promise<Result<void>> {
    try {
      console.log(`[SubscriptionEventHandler] Hanterar SubscriptionCreatedEvent för org ${event.payload.organizationId}`);
      
      // Hämta organisationen som prenumerationen tillhör
      const orgResult = await this.organizationRepo.findById(event.payload.organizationId);
      
      if (orgResult.isErr()) {
        console.error(`[SubscriptionEventHandler] Kunde inte hitta organisation ${event.payload.organizationId}`);
        return Result.err(orgResult.error);
      }
      
      const organization = orgResult.value;
      
      // Uppdatera organisationens planId baserat på den nya prenumerationen
      organization.updatePlan(event.payload.planId);
      
      // Spara de uppdaterade uppgifterna
      const saveResult = await this.organizationRepo.save(organization);
      
      if (saveResult.isErr()) {
        console.error(`[SubscriptionEventHandler] Kunde inte spara uppdaterad organisation: ${saveResult.error}`);
        return Result.err(saveResult.error);
      }
      
      console.log(`[SubscriptionEventHandler] Organisation ${event.payload.organizationId} uppdaterad med plan ${event.payload.planId}`);
      return Result.ok(undefined);
    } catch (error) {
      console.error(`[SubscriptionEventHandler] Fel vid hantering av SubscriptionCreatedEvent: ${error}`);
      return Result.err(error.message);
    }
  }

  /**
   * Hanterar händelsen när en prenumerations status ändras
   */
  async handleSubscriptionStatusChanged(event: SubscriptionStatusChangedEvent): Promise<Result<void>> {
    try {
      console.log(`[SubscriptionEventHandler] Hanterar SubscriptionStatusChangedEvent för prenumeration ${event.payload.subscriptionId}`);
      
      // Hämta organisationen som prenumerationen tillhör
      const orgResult = await this.organizationRepo.findById(event.payload.organizationId);
      
      if (orgResult.isErr()) {
        console.error(`[SubscriptionEventHandler] Kunde inte hitta organisation ${event.payload.organizationId}`);
        return Result.err(orgResult.error);
      }
      
      const organization = orgResult.value;
      
      // Uppdatera organisationens status baserat på prenumerationsstatusen
      // Mappa prenumerationsstatus till organisationsstatus
      let orgStatus = 'ACTIVE';
      
      switch (event.payload.newStatus) {
        case 'ACTIVE':
          orgStatus = 'ACTIVE';
          break;
        case 'PAUSED':
          orgStatus = 'PAUSED';
          break;
        case 'CANCELED':
          orgStatus = 'INACTIVE';
          break;
        case 'EXPIRED':
          orgStatus = 'INACTIVE';
          break;
        default:
          orgStatus = 'ACTIVE';
      }
      
      organization.updateStatus(orgStatus);
      
      // Spara de uppdaterade uppgifterna
      const saveResult = await this.organizationRepo.save(organization);
      
      if (saveResult.isErr()) {
        console.error(`[SubscriptionEventHandler] Kunde inte spara uppdaterad organisation: ${saveResult.error}`);
        return Result.err(saveResult.error);
      }
      
      console.log(`[SubscriptionEventHandler] Organisation ${event.payload.organizationId} status uppdaterad till ${orgStatus}`);
      return Result.ok(undefined);
    } catch (error) {
      console.error(`[SubscriptionEventHandler] Fel vid hantering av SubscriptionStatusChangedEvent: ${error}`);
      return Result.err(error.message);
    }
  }

  /**
   * Hanterar händelsen när en prenumerationsplan ändras
   */
  async handleSubscriptionPlanChanged(event: SubscriptionPlanChangedEvent): Promise<Result<void>> {
    try {
      console.log(`[SubscriptionEventHandler] Hanterar SubscriptionPlanChangedEvent för prenumeration ${event.payload.subscriptionId}`);
      
      // Hämta organisationen som prenumerationen tillhör
      const orgResult = await this.organizationRepo.findById(event.payload.organizationId);
      
      if (orgResult.isErr()) {
        console.error(`[SubscriptionEventHandler] Kunde inte hitta organisation ${event.payload.organizationId}`);
        return Result.err(orgResult.error);
      }
      
      const organization = orgResult.value;
      
      // Uppdatera organisationens plan baserat på den nya prenumerationsplanen
      organization.updatePlan(event.payload.newPlanId);
      
      // Spara prenumerationsförändringen i historiken
      organization.addPlanHistoryEntry({
        planId: event.payload.newPlanId,
        changedAt: new Date(event.timestamp),
        previousPlanId: event.payload.oldPlanId
      });
      
      // Spara de uppdaterade uppgifterna
      const saveResult = await this.organizationRepo.save(organization);
      
      if (saveResult.isErr()) {
        console.error(`[SubscriptionEventHandler] Kunde inte spara uppdaterad organisation: ${saveResult.error}`);
        return Result.err(saveResult.error);
      }
      
      console.log(`[SubscriptionEventHandler] Organisation ${event.payload.organizationId} plan uppdaterad från ${event.payload.oldPlanId} till ${event.payload.newPlanId}`);
      return Result.ok(undefined);
    } catch (error) {
      console.error(`[SubscriptionEventHandler] Fel vid hantering av SubscriptionPlanChangedEvent: ${error}`);
      return Result.err(error.message);
    }
  }

  /**
   * Hanterar händelsen när en prenumeration avbryts
   */
  async handleSubscriptionCancelled(event: SubscriptionCancelledEvent): Promise<Result<void>> {
    try {
      console.log(`[SubscriptionEventHandler] Hanterar SubscriptionCancelledEvent för prenumeration ${event.payload.subscriptionId}`);
      
      // Hämta organisationen som prenumerationen tillhör
      const orgResult = await this.organizationRepo.findById(event.payload.organizationId);
      
      if (orgResult.isErr()) {
        console.error(`[SubscriptionEventHandler] Kunde inte hitta organisation ${event.payload.organizationId}`);
        return Result.err(orgResult.error);
      }
      
      const organization = orgResult.value;
      
      // Uppdatera organisationens status till inaktiv
      organization.updateStatus('INACTIVE');
      
      // Återställ till gratisplanen
      organization.updatePlan('free');
      
      // Registrera avbrottet i prenumerationshistoriken
      organization.addPlanHistoryEntry({
        planId: 'free',
        changedAt: new Date(event.timestamp),
        previousPlanId: organization.planId,
        reason: event.payload.reason
      });
      
      // Spara de uppdaterade uppgifterna
      const saveResult = await this.organizationRepo.save(organization);
      
      if (saveResult.isErr()) {
        console.error(`[SubscriptionEventHandler] Kunde inte spara uppdaterad organisation: ${saveResult.error}`);
        return Result.err(saveResult.error);
      }
      
      console.log(`[SubscriptionEventHandler] Organisation ${event.payload.organizationId} markerad som inaktiv och återställd till gratisplan`);
      return Result.ok(undefined);
    } catch (error) {
      console.error(`[SubscriptionEventHandler] Fel vid hantering av SubscriptionCancelledEvent: ${error}`);
      return Result.err(error.message);
    }
  }
} 