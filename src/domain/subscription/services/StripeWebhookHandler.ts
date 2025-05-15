import { Subscription } from '../entities/Subscription';
import { SubscriptionRepository } from '../repositories/SubscriptionRepository';
import { EventBus } from '../../core/EventBus';
import { Logger } from '../../../infrastructure/logger/Logger';
import { Result, ok, err } from '@/shared/core/Result';

/**
 * Händelsetyper från Stripe webhooks som vi hanterar
 */
export enum StripeWebhookEventType {
  CHECKOUT_SESSION_COMPLETED = 'checkout.session.completed',
  INVOICE_PAYMENT_SUCCEEDED = 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED = 'invoice.payment_failed',
  CUSTOMER_SUBSCRIPTION_UPDATED = 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED = 'customer.subscription.deleted',
}

/**
 * Stripe Webhook Handler
 * 
 * OBS: Detta är bara ett skal för att kunna mocka i testerna
 */
export class StripeWebhookHandler {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly eventBus: EventBus,
    private readonly logger: Logger
  ) {}

  /**
   * Verifierar webhook-signaturen från Stripe
   */
  async verifyWebhookSignature(
    payload: string,
    signature: string,
    webhookSecret: string
  ): Promise<boolean> {
    try {
      // Obs: I en riktig implementation skulle vi använda Stripe SDK:s verifieringsmetod
      // För demo-ändamål simulerar vi en framgångsrik verifiering
      this.logger.info('Verifierar Stripe webhook-signatur');
      return true;
    } catch (error) {
      this.logger.error('Fel vid verifiering av webhook-signatur:', error);
      return false;
    }
  }

  /**
   * Hanterar en webhook från Stripe
   * @param body Raw webhook body
   * @param signature Stripe signature header
   */
  async handleWebhook(body: string, signature: string): Promise<Result<any, string>> {
    try {
      // Detta är bara en stub för tester
      return ok({ processed: true });
    } catch (error) {
      return err(`Failed to process Stripe webhook: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Bearbetar en webhook-händelse från Stripe
   */
  async handleWebhookEvent(
    eventType: string,
    eventData: any
  ): Promise<void> {
    this.logger.info(`Bearbetar Stripe webhook event: ${eventType}`);

    try {
      switch (eventType) {
        case StripeWebhookEventType.CHECKOUT_SESSION_COMPLETED:
          await this.handleCheckoutSessionCompleted(eventData);
          break;
        case StripeWebhookEventType.INVOICE_PAYMENT_SUCCEEDED:
          await this.handleInvoicePaymentSucceeded(eventData);
          break;
        case StripeWebhookEventType.INVOICE_PAYMENT_FAILED:
          await this.handleInvoicePaymentFailed(eventData);
          break;
        case StripeWebhookEventType.CUSTOMER_SUBSCRIPTION_UPDATED:
          await this.handleCustomerSubscriptionUpdated(eventData);
          break;
        case StripeWebhookEventType.CUSTOMER_SUBSCRIPTION_DELETED:
          await this.handleCustomerSubscriptionDeleted(eventData);
          break;
        default:
          this.logger.info(`Obehandlad webhook event typ: ${eventType}`);
      }
    } catch (error) {
      this.logger.error(`Fel vid bearbetning av ${eventType} webhook:`, error);
      throw error;
    }
  }

  /**
   * Hanterar slutförda checkout-sessioner (nya prenumerationer)
   */
  private async handleCheckoutSessionCompleted(eventData: any): Promise<void> {
    const session = eventData.object;
    
    if (session.mode !== 'subscription') {
      this.logger.info('Ignorerar icke-prenumerations checkout session');
      return;
    }

    try {
      // Hämta kund-ID och prenumeration-ID från checkout session
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      
      // Hämta metadata som inkluderar organization_id och plan_id
      const metadata = session.metadata || {};
      const organizationId = metadata.organization_id;
      
      if (!organizationId) {
        throw new Error('organization_id saknas i checkout session metadata');
      }

      // Uppdatera eller skapa prenumeration i databasen
      const subscriptionData = await this.fetchSubscriptionFromStripe(subscriptionId);
      
      // Spara i databasen
      await this.subscriptionRepository.saveSubscription(subscriptionData);
      
      // Publicera händelse
      this.eventBus.publish('subscription.created', {
        organizationId,
        subscriptionId,
        planId: subscriptionData.planId,
      });
      
      this.logger.info(`Ny prenumeration skapad för organisation: ${organizationId}`);
    } catch (error) {
      this.logger.error('Fel vid hantering av checkout.session.completed:', error);
      throw error;
    }
  }

  /**
   * Hanterar lyckade fakturabetalningar
   */
  private async handleInvoicePaymentSucceeded(eventData: any): Promise<void> {
    const invoice = eventData.object;
    const subscriptionId = invoice.subscription;
    
    if (!subscriptionId) {
      this.logger.info('Ignorerar icke-prenumerations faktura');
      return;
    }

    try {
      // Hämta prenumerationen från vår databas
      const subscription = await this.subscriptionRepository.getSubscriptionByStripeId(subscriptionId);
      
      if (!subscription) {
        this.logger.warn(`Kunde inte hitta prenumeration för Stripe ID: ${subscriptionId}`);
        return;
      }

      // Uppdatera prenumerationens status och datum
      const updated: Partial<Subscription> = {
        status: 'active',
        currentPeriodStart: new Date(invoice.period_start * 1000),
        currentPeriodEnd: new Date(invoice.period_end * 1000),
        updatedAt: new Date(),
      };
      
      await this.subscriptionRepository.updateSubscription(subscription.id, updated);
      
      // Publicera händelse
      this.eventBus.publish('subscription.renewed', {
        organizationId: subscription.organizationId,
        subscriptionId: subscription.id,
        invoiceId: invoice.id,
        amount: invoice.total,
      });
      
      this.logger.info(`Prenumeration förnyad för: ${subscription.organizationId}`);
    } catch (error) {
      this.logger.error('Fel vid hantering av invoice.payment_succeeded:', error);
      throw error;
    }
  }

  /**
   * Hanterar misslyckade fakturabetalningar
   */
  private async handleInvoicePaymentFailed(eventData: any): Promise<void> {
    const invoice = eventData.object;
    const subscriptionId = invoice.subscription;
    
    if (!subscriptionId) {
      return;
    }

    try {
      // Hämta prenumerationen från databasen
      const subscription = await this.subscriptionRepository.getSubscriptionByStripeId(subscriptionId);
      
      if (!subscription) {
        this.logger.warn(`Kunde inte hitta prenumeration för Stripe ID: ${subscriptionId}`);
        return;
      }

      // Uppdatera prenumerationens status
      const updated: Partial<Subscription> = {
        status: 'past_due',
        updatedAt: new Date(),
      };
      
      await this.subscriptionRepository.updateSubscription(subscription.id, updated);
      
      // Publicera händelse för att notifiera kunden
      this.eventBus.publish('subscription.payment_failed', {
        organizationId: subscription.organizationId,
        subscriptionId: subscription.id,
        invoiceId: invoice.id,
        amount: invoice.total,
        nextPaymentAttempt: new Date(invoice.next_payment_attempt * 1000),
      });
      
      this.logger.warn(`Betalning misslyckades för prenumeration: ${subscription.id}`);
    } catch (error) {
      this.logger.error('Fel vid hantering av invoice.payment_failed:', error);
      throw error;
    }
  }

  /**
   * Hanterar uppdateringar av prenumerationer
   */
  private async handleCustomerSubscriptionUpdated(eventData: any): Promise<void> {
    const stripeSubscription = eventData.object;
    const subscriptionId = stripeSubscription.id;

    try {
      // Hämta prenumerationen från vår databas
      const subscription = await this.subscriptionRepository.getSubscriptionByStripeId(subscriptionId);
      
      if (!subscription) {
        this.logger.warn(`Kunde inte hitta prenumeration för Stripe ID: ${subscriptionId}`);
        return;
      }

      // Uppdatera prenumerationens information
      const updated: Partial<Subscription> = {
        status: this.mapStripeStatusToInternal(stripeSubscription.status),
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        updatedAt: new Date(),
      };
      
      // Om planen har ändrats, uppdatera plan-ID
      if (stripeSubscription.items.data.length > 0) {
        const planId = stripeSubscription.items.data[0].price.product;
        updated.planId = planId;
      }
      
      await this.subscriptionRepository.updateSubscription(subscription.id, updated);
      
      // Publicera händelse
      this.eventBus.publish('subscription.updated', {
        organizationId: subscription.organizationId,
        subscriptionId: subscription.id,
        status: updated.status,
        cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      });
      
      this.logger.info(`Prenumeration uppdaterad för: ${subscription.organizationId}`);
    } catch (error) {
      this.logger.error('Fel vid hantering av customer.subscription.updated:', error);
      throw error;
    }
  }

  /**
   * Hanterar borttagna/avslutade prenumerationer
   */
  private async handleCustomerSubscriptionDeleted(eventData: any): Promise<void> {
    const stripeSubscription = eventData.object;
    const subscriptionId = stripeSubscription.id;

    try {
      // Hämta prenumerationen från vår databas
      const subscription = await this.subscriptionRepository.getSubscriptionByStripeId(subscriptionId);
      
      if (!subscription) {
        this.logger.warn(`Kunde inte hitta prenumeration för Stripe ID: ${subscriptionId}`);
        return;
      }

      // Uppdatera prenumerationens status
      const updated: Partial<Subscription> = {
        status: 'canceled',
        updatedAt: new Date(),
      };
      
      await this.subscriptionRepository.updateSubscription(subscription.id, updated);
      
      // Publicera händelse
      this.eventBus.publish('subscription.canceled', {
        organizationId: subscription.organizationId,
        subscriptionId: subscription.id,
      });
      
      this.logger.info(`Prenumeration avslutad för: ${subscription.organizationId}`);
    } catch (error) {
      this.logger.error('Fel vid hantering av customer.subscription.deleted:', error);
      throw error;
    }
  }

  /**
   * Hjälpmetod för att hämta prenumerationsdata från Stripe API
   */
  private async fetchSubscriptionFromStripe(stripeSubscriptionId: string): Promise<Subscription> {
    // Obs: I en verklig implementation skulle detta anropa Stripe API
    // För demo-syfte returnerar vi en mock-prenumeration
    this.logger.info(`Hämtar prenumerationsdata från Stripe för ID: ${stripeSubscriptionId}`);
    
    return {
      id: `sub_${Date.now()}`,
      organizationId: 'org_mock',
      planId: 'plan_mock',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dagar
      cancelAtPeriodEnd: false,
      payment: {
        provider: 'stripe',
        customerId: 'cus_mock',
        subscriptionId: stripeSubscriptionId,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Mappar Stripe's prenumerationsstatus till våra interna statusar
   */
  private mapStripeStatusToInternal(stripeStatus: string): string {
    switch (stripeStatus) {
      case 'active':
        return 'active';
      case 'past_due':
        return 'past_due';
      case 'unpaid':
        return 'past_due';
      case 'canceled':
        return 'canceled';
      case 'incomplete':
        return 'incomplete';
      case 'incomplete_expired':
        return 'canceled';
      case 'trialing':
        return 'active';
      default:
        return 'incomplete';
    }
  }
} 