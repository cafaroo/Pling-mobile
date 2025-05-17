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
 * Fallback logger som används om ingen logger injiceras
 */
const defaultLogger: Logger = {
  info: (message: string, meta?: any) => console.info(message, meta),
  warn: (message: string, meta?: any) => console.warn(message, meta),
  error: (message: string, meta?: any) => console.error(message, meta),
  debug: (message: string, meta?: any) => console.debug(message, meta)
};

/**
 * Stripe Webhook Handler
 * 
 * OBS: Detta är bara ett skal för att kunna mocka i testerna
 */
export class StripeWebhookHandler {
  private logger: Logger;

  constructor(private readonly props: {
    stripeClient: any;
    subscriptionRepository: SubscriptionRepository;
    notificationService: any;
    eventBus: EventBus;
    logger?: Logger;
  }) {
    // Använd den injicerade loggern eller fallback till defaultLogger
    this.logger = props.logger || defaultLogger;
  }

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
   * Hanterar en checkout.session.completed händelse från Stripe
   */
  private async handleCheckoutSessionCompleted(eventData: any): Promise<void> {
    const session = eventData || {};
    
    if (!session || session.mode !== 'subscription') {
      this.logger.info('Ignorerar icke-prenumerations checkout session');
      return;
    }

    try {
      // Hämta kund-ID och prenumeration-ID från checkout session
      const subscriptionId = session.subscription;
      
      if (!subscriptionId) {
        throw new Error('Subscription ID saknas i checkout session');
      }
      
      // Hämta metadata som inkluderar organization_id och plan_id
      const metadata = session.metadata || {};
      const organizationId = metadata.organization_id;
      
      if (!organizationId) {
        throw new Error('organization_id saknas i checkout session metadata');
      }

      // Uppdatera eller skapa prenumeration i databasen
      const subscriptionResult = await this.fetchSubscriptionFromStripe(subscriptionId);
      
      if (subscriptionResult.isErr()) {
        throw new Error(`Kunde inte hämta prenumeration från Stripe: ${subscriptionResult.error}`);
      }
      
      const subscriptionData = {
        ...subscriptionResult.value,
        organizationId
      };
      
      // Spara i databasen
      const saveResult = await this.props.subscriptionRepository.saveSubscription(subscriptionData);
      
      if (saveResult.isErr()) {
        throw new Error(`Kunde inte spara prenumeration: ${saveResult.error}`);
      }
      
      const savedSubscription = saveResult.value;
      
      // Skapa historik-post
      await this.props.subscriptionRepository.createSubscriptionHistoryEntry({
        subscriptionId: savedSubscription.id,
        event: 'created',
        timestamp: new Date(),
        data: {
          stripeSessionId: session.id,
          planId: subscriptionData.planId
        }
      });
      
      // Publicera händelse
      this.props.eventBus.publish('subscription.created', {
        organizationId,
        subscriptionId: savedSubscription.id,
        planId: subscriptionData.planId,
      });
      
      this.logger.info(`Ny prenumeration skapad för organisation: ${organizationId}`);
    } catch (error) {
      this.logger.error('Fel vid hantering av checkout.session.completed:', error);
      throw error;
    }
  }

  /**
   * Hanterar en invoice.payment_succeeded händelse från Stripe
   */
  private async handleInvoicePaymentSucceeded(eventData: any): Promise<void> {
    const invoice = eventData || {};
    const subscriptionId = invoice.subscription;
    
    if (!subscriptionId) {
      this.logger.info('Ignorerar icke-prenumerations faktura');
      return;
    }

    try {
      // Hämta prenumerationen från vår databas
      const subscriptionResult = await this.props.subscriptionRepository.getSubscriptionByStripeId(subscriptionId);
      
      if (subscriptionResult.isErr()) {
        this.logger.warn(`Kunde inte hitta prenumeration för Stripe ID: ${subscriptionId}`, {
          error: subscriptionResult.error
        });
        return;
      }

      const subscription = subscriptionResult.value;

      // Uppdatera prenumerationens status och datum
      const updated: Partial<Subscription> = {
        status: 'active',
        currentPeriodStart: new Date(invoice.period_start * 1000),
        currentPeriodEnd: new Date(invoice.period_end * 1000),
        updatedAt: new Date(),
      };
      
      const updateResult = await this.props.subscriptionRepository.updateSubscription(subscription.id, updated);
      
      if (updateResult.isErr()) {
        throw new Error(`Kunde inte uppdatera prenumerationsstatus: ${updateResult.error}`);
      }
      
      // Skapa historik-post
      await this.props.subscriptionRepository.createSubscriptionHistoryEntry({
        subscriptionId: subscription.id,
        event: 'payment_succeeded',
        timestamp: new Date(),
        data: {
          invoiceId: invoice.id,
          amount: invoice.total
        }
      });
      
      // Publicera händelse
      this.props.eventBus.publish('subscription.renewed', {
        organizationId: subscription.organizationId,
        subscriptionId: subscription.id,
        invoiceId: invoice.id,
        amount: invoice.total,
      });
      
      this.logger.info(`Prenumeration förnyad för: ${subscription.id}`);
    } catch (error) {
      this.logger.error('Fel vid hantering av invoice.payment_succeeded:', error);
      throw error;
    }
  }

  /**
   * Hanterar en invoice.payment_failed händelse från Stripe
   */
  private async handleInvoicePaymentFailed(eventData: any): Promise<void> {
    const invoice = eventData || {};
    const subscriptionId = invoice.subscription;
    
    if (!subscriptionId) {
      this.logger.info('Ignorerar icke-prenumerations faktura');
      return;
    }

    try {
      // Hämta prenumerationen från databasen
      const subscriptionResult = await this.props.subscriptionRepository.getSubscriptionByStripeId(subscriptionId);
      
      if (subscriptionResult.isErr()) {
        this.logger.warn(`Kunde inte hitta prenumeration för Stripe ID: ${subscriptionId}`, {
          error: subscriptionResult.error
        });
        return;
      }

      const subscription = subscriptionResult.value;

      // Uppdatera prenumerationens status
      const updated: Partial<Subscription> = {
        status: 'past_due',
        updatedAt: new Date(),
      };
      
      const updateResult = await this.props.subscriptionRepository.updateSubscription(subscription.id, updated);
      
      if (updateResult.isErr()) {
        throw new Error(`Kunde inte uppdatera prenumerationsstatus: ${updateResult.error}`);
      }
      
      // Skapa historik-post
      await this.props.subscriptionRepository.createSubscriptionHistoryEntry({
        subscriptionId: subscription.id,
        event: 'payment_failed',
        timestamp: new Date(),
        data: {
          invoiceId: invoice.id,
          attemptCount: invoice.attempt_count,
          nextPaymentAttempt: invoice.next_payment_attempt 
            ? new Date(invoice.next_payment_attempt * 1000) 
            : null
        }
      });
      
      // Skicka notifikation
      this.props.notificationService.sendNotification({
        type: 'payment_failed',
        recipientId: subscription.organizationId,
        data: {
          subscriptionId: subscription.id,
          nextAttempt: invoice.next_payment_attempt
            ? new Date(invoice.next_payment_attempt * 1000)
            : null
        }
      });
      
      // Publicera händelse
      this.props.eventBus.publish('subscription.payment_failed', {
        organizationId: subscription.organizationId,
        subscriptionId: subscription.id,
        invoiceId: invoice.id,
        amount: invoice.total,
        nextPaymentAttempt: invoice.next_payment_attempt
          ? new Date(invoice.next_payment_attempt * 1000)
          : null,
      });
      
      this.logger.warn(`Betalning misslyckades för prenumeration: ${subscription.id}`);
    } catch (error) {
      this.logger.error('Fel vid hantering av invoice.payment_failed:', error);
      throw error;
    }
  }

  /**
   * Hanterar en customer.subscription.updated händelse från Stripe
   */
  private async handleCustomerSubscriptionUpdated(eventData: any): Promise<void> {
    try {
      // Hämta Stripe subscription objekt
      const stripeSubscription = eventData.object || {};
      const subscriptionId = stripeSubscription.id;
      
      if (!subscriptionId) {
        this.logger.warn('Ogiltig subscription updated-händelse (saknar ID)');
        return;
      }

      // Hämta prenumerationen från vår databas
      const subscriptionResult = await this.props.subscriptionRepository.getSubscriptionByStripeId(subscriptionId);
      
      if (subscriptionResult.isErr()) {
        this.logger.warn(`Kunde inte hitta prenumeration för Stripe ID: ${subscriptionId}`, {
          error: subscriptionResult.error
        });
        return;
      }

      const subscription = subscriptionResult.value;
      
      // Skapa uppdateringsobjekt baserat på Stripe-data
      const updated: Partial<Subscription> = {
        status: this.mapStripeStatusToInternal(stripeSubscription.status),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end === true,
        updatedAt: new Date()
      };
      
      // Om planen har ändrats, uppdatera plan-ID
      if (stripeSubscription.items && stripeSubscription.items.data && stripeSubscription.items.data.length > 0) {
        const priceInfo = stripeSubscription.items.data[0].price;
        if (priceInfo && priceInfo.product) {
          const planId = priceInfo.product;
          updated.planId = planId;
        }
      }
      
      // Uppdatera i databasen
      const updateResult = await this.props.subscriptionRepository.updateSubscription(subscription.id, updated);
      
      if (updateResult.isErr()) {
        throw new Error(`Kunde inte uppdatera prenumeration: ${updateResult.error}`);
      }
      
      // Publicera händelse om statusändring
      this.props.eventBus.publish('subscription.updated', {
        organizationId: subscription.organizationId,
        subscriptionId: subscription.id,
        status: updated.status,
        cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
        planId: updated.planId
      });
      
      this.logger.info(`Prenumeration uppdaterad: ${subscription.id}`, {
        status: updated.status,
        cancelAtPeriodEnd: updated.cancelAtPeriodEnd
      });
      
    } catch (error) {
      this.logger.error('Fel vid hantering av customer.subscription.updated:', error);
      throw error;
    }
  }

  /**
   * Hanterar en customer.subscription.deleted händelse från Stripe
   */
  private async handleCustomerSubscriptionDeleted(eventData: any): Promise<void> {
    try {
      // Hämta Stripe subscription objekt
      const stripeSubscription = eventData.object || {};
      const subscriptionId = stripeSubscription.id;
      
      if (!subscriptionId) {
        this.logger.warn('Ogiltig subscription deleted-händelse (saknar ID)');
        return;
      }

      // Hämta prenumerationen från vår databas
      const subscriptionResult = await this.props.subscriptionRepository.getSubscriptionByStripeId(subscriptionId);
      
      if (subscriptionResult.isErr()) {
        this.logger.warn(`Kunde inte hitta prenumeration för Stripe ID: ${subscriptionId}`, {
          error: subscriptionResult.error
        });
        return;
      }

      const subscription = subscriptionResult.value;
      
      // Uppdatera status till cancelled
      const updated: Partial<Subscription> = {
        status: 'canceled',
        updatedAt: new Date(),
        canceledAt: new Date()
      };
      
      // Uppdatera i databasen
      const updateResult = await this.props.subscriptionRepository.updateSubscription(subscription.id, updated);
      
      if (updateResult.isErr()) {
        throw new Error(`Kunde inte avsluta prenumeration: ${updateResult.error}`);
      }
      
      // Publicera händelse
      this.props.eventBus.publish('subscription.cancelled', {
        organizationId: subscription.organizationId,
        subscriptionId: subscription.id
      });
      
      this.logger.info(`Prenumeration avslutad: ${subscription.id}`);
      
    } catch (error) {
      this.logger.error('Fel vid hantering av customer.subscription.deleted:', error);
      throw error;
    }
  }

  /**
   * Hämtar information om en prenumeration från Stripe
   */
  private async fetchSubscriptionFromStripe(stripeSubscriptionId: string): Promise<Result<Subscription, string>> {
    try {
      // Hämta prenumerationen från Stripe API
      const stripeSubscription = await this.props.stripeClient.subscriptions.retrieve(stripeSubscriptionId);
      
      if (!stripeSubscription) {
        return err(`Kunde inte hitta prenumeration i Stripe: ${stripeSubscriptionId}`);
      }
      
      // Mappa från Stripe-data till vår domänmodell
      let planId = '';
      
      // Försök att hitta plan-ID från items
      if (stripeSubscription.items && 
          stripeSubscription.items.data && 
          stripeSubscription.items.data.length > 0 && 
          stripeSubscription.items.data[0].price && 
          stripeSubscription.items.data[0].price.product) {
        planId = stripeSubscription.items.data[0].price.product;
      }
      
      // Skapa subscription-objekt
      const subscription: Subscription = {
        id: '', // Kommer att sättas av databasen
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: stripeSubscription.customer,
        status: this.mapStripeStatusToInternal(stripeSubscription.status),
        planId,
        trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : null,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end === true,
        createdAt: new Date(),
        updatedAt: new Date(),
        organizationId: '' // Kommer att sättas av anroparen
      };
      
      return ok(subscription);
    } catch (error) {
      this.logger.error('Fel vid hämtning av prenumeration från Stripe:', error);
      return err(error instanceof Error ? error.message : 'Okänt fel');
    }
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