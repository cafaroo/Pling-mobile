import { Subscription } from '../entities/Subscription';
import { SubscriptionPlan } from '../entities/SubscriptionPlan';
import { SubscriptionRepository } from '../repositories/SubscriptionRepository';
import { Platform } from 'react-native';
import Stripe from 'stripe';
import { EventBus } from '../../core/EventBus';
import { Result, ok, err } from '@/shared/core/Result';

/**
 * Gränssnitt för betalningsmetoder
 */
export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

/**
 * Gränssnitt för prenumerationsuppdatering
 */
export interface SubscriptionUpdate {
  planId?: string;
  cancelAtPeriodEnd?: boolean;
  paymentMethodId?: string;
  billing?: {
    email?: string;
    name?: string;
    address?: any;
    vatNumber?: string;
  };
}

/**
 * Service för att integrera med Stripe betalningar.
 */
export class StripeIntegrationService {
  private stripe: Stripe | null = null;
  private apiBaseUrl: string = 'https://api.pling-app.se/stripe';
  private stripeClient: any;
  private eventBus: EventBus;
  private isTesting: boolean = false;

  constructor(props: { 
    stripeClient?: any, 
    subscriptionRepository: SubscriptionRepository,
    eventBus?: EventBus
  }) {
    // Initiera Stripe i webmiljö om det behövs
    if (Platform.OS === 'web') {
      this.initializeStripe();
    }
    
    this.subscriptionRepository = props.subscriptionRepository;
    this.stripeClient = props.stripeClient;
    this.eventBus = props.eventBus || {
      publish: () => Promise.resolve()
    };
    
    // Om stripeClient skickats in, anta att det är testmiljö
    this.isTesting = !!props.stripeClient;
  }

  private initializeStripe(): void {
    // Obs: Stripe-instansiering sker endast i webmiljö
    // För React Native används Stripe SDK separat
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        // @ts-ignore
        this.stripe = window.Stripe ? window.Stripe(process.env.STRIPE_PUBLISHABLE_KEY) : null;
      } catch (error) {
        console.error('Kunde inte initiera Stripe:', error);
      }
    }
  }

  /**
   * Skapar en ny prenumeration för en organisation
   */
  async createSubscription(data: {
    organizationId: string,
    planId: string,
    paymentMethodId: string,
    billingEmail: string,
    billingName: string,
    billingAddress: any,
  }): Promise<Result<Subscription, string>> {
    try {
      if (this.isTesting) {
        // Testversion som använder mockade Stripe-klienten
        const stripeCustomer = await this.stripeClient.customers.create({
          email: data.billingEmail,
          name: data.billingName,
          address: data.billingAddress,
        });
        
        const stripeSubscription = await this.stripeClient.subscriptions.create({
          customer: stripeCustomer.id,
          items: [{ price: data.planId }],
          payment_method: data.paymentMethodId,
        });
        
        const subscription: Subscription = {
          id: `sub-${Date.now()}`,
          organizationId: data.organizationId,
          stripeCustomerId: stripeCustomer.id,
          stripeSubscriptionId: stripeSubscription.id,
          status: stripeSubscription.status,
          plan: { 
            type: data.planId.includes('pro') ? 'pro' : 'basic',
            name: data.planId.includes('pro') ? 'Pro' : 'Basic',
            price: 199,
            currency: 'SEK',
            interval: 'month'
          },
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          billingDetails: {
            email: data.billingEmail,
            name: data.billingName,
            address: data.billingAddress
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Spara i databasen via repository
        const saveResult = await this.subscriptionRepository.saveSubscription(subscription);
        if (saveResult.isErr()) {
          return err(saveResult.error);
        }
        
        // Publicera event
        await this.eventBus.publish('subscription.created', {
          organizationId: data.organizationId,
          subscriptionId: subscription.id
        });
        
        return ok(subscription);
      } else {
        // Produktionsversion som använder fetch
        // Anropa backend-API som hanterar kommunikation med Stripe
        const response = await fetch(`${this.apiBaseUrl}/subscriptions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organizationId: data.organizationId,
            planId: data.planId,
            paymentMethodId: data.paymentMethodId,
            billingDetails: {
              email: data.billingEmail,
              name: data.billingName,
              address: data.billingAddress
            }
          }),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          return err(errorData.message || 'PAYMENT_ERROR');
        }
  
        const respData = await response.json();
        
        // Konvertera datumen till Date-objekt
        const subscription: Subscription = {
          ...respData,
          currentPeriodStart: new Date(respData.currentPeriodStart),
          currentPeriodEnd: new Date(respData.currentPeriodEnd),
          createdAt: new Date(respData.createdAt),
          updatedAt: new Date(respData.updatedAt),
        };
        
        // Spara i databasen via repository
        await this.subscriptionRepository.saveSubscription(subscription);
        
        return ok(subscription);
      }
    } catch (error) {
      console.error('Stripe subscription error:', error);
      return err('PAYMENT_ERROR');
    }
  }

  /**
   * Uppdaterar en existerande prenumeration
   */
  async updateSubscription(
    subscriptionId: string,
    updates: SubscriptionUpdate
  ): Promise<Result<Subscription, string>> {
    try {
      if (this.isTesting) {
        // Testversion som använder mockade Stripe-klienten
        const subscriptionResult = await this.subscriptionRepository.getSubscriptionById(subscriptionId);
        if (subscriptionResult.isErr()) {
          return err(subscriptionResult.error);
        }
        
        const subscription = subscriptionResult.value;
        
        // Uppdatera i Stripe
        const stripeSubscription = await this.stripeClient.subscriptions.update(
          subscription.stripeSubscriptionId, 
          {
            cancel_at_period_end: updates.cancelAtPeriodEnd,
            items: updates.planId ? [{ price: updates.planId }] : undefined
          }
        );
        
        // Uppdatera vår modell
        const updatedSubscription: Subscription = {
          ...subscription,
          status: stripeSubscription.status,
          plan: updates.planId ? { 
            type: updates.planId.includes('pro') ? 'pro' : 'basic',
            name: updates.planId.includes('pro') ? 'Pro' : 'Basic',
            price: 199,
            currency: 'SEK',
            interval: 'month'
          } : subscription.plan,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          billingDetails: updates.billing ? {
            ...subscription.billingDetails,
            ...updates.billing
          } : subscription.billingDetails,
          updatedAt: new Date()
        };
        
        // Spara i databasen via repository
        const saveResult = await this.subscriptionRepository.saveSubscription(updatedSubscription);
        if (saveResult.isErr()) {
          return err(saveResult.error);
        }
        
        // Publicera event
        await this.eventBus.publish('subscription.updated', {
          organizationId: subscription.organizationId,
          subscriptionId: subscription.id
        });
        
        return ok(updatedSubscription);
      } else {
        // Produktionsversion som använder fetch
        // Anropa backend-API
        const response = await fetch(`${this.apiBaseUrl}/subscriptions/${subscriptionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          return err(errorData.message || 'SUBSCRIPTION_UPDATE_ERROR');
        }
  
        const data = await response.json();
        
        // Konvertera datumen till Date-objekt
        const subscription: Subscription = {
          ...data,
          currentPeriodStart: new Date(data.currentPeriodStart),
          currentPeriodEnd: new Date(data.currentPeriodEnd),
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        };
        
        // Spara i databasen via repository
        await this.subscriptionRepository.updateSubscription(subscriptionId, subscription);
        
        return ok(subscription);
      }
    } catch (error) {
      console.error('Stripe update error:', error);
      return err('SUBSCRIPTION_UPDATE_ERROR');
    }
  }

  /**
   * Avbryter en prenumeration
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Subscription> {
    try {
      // Anropa backend-API
      const response = await fetch(`${this.apiBaseUrl}/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cancelAtPeriodEnd }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Kunde inte avbryta prenumeration');
      }

      const data = await response.json();
      
      // Konvertera datumen till Date-objekt
      const subscription: Subscription = {
        ...data,
        currentPeriodStart: new Date(data.currentPeriodStart),
        currentPeriodEnd: new Date(data.currentPeriodEnd),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
      
      // Spara i databasen via repository
      await this.subscriptionRepository.updateSubscription(subscriptionId, subscription);
      
      return subscription;
    } catch (error) {
      console.error('Stripe cancellation error:', error);
      throw error;
    }
  }

  /**
   * Hämtar betalningsmetoder för en kund
   */
  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/customers/${customerId}/payment-methods`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Kunde inte hämta betalningsmetoder');
      }
      
      const data = await response.json();
      return data.paymentMethods;
    } catch (error) {
      console.error('Stripe payment methods error:', error);
      throw error;
    }
  }

  /**
   * Skapar en setup intent för att lägga till en betalningsmetod
   */
  async createSetupIntent(customerId: string): Promise<{ clientSecret: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/setup-intents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Kunde inte skapa setup intent');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Stripe setup intent error:', error);
      throw error;
    }
  }

  /**
   * Skapar en checkout-session för att ändra plan
   */
  async createCheckoutSession(
    subscriptionId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/checkout-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          planId,
          successUrl,
          cancelUrl,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Kunde inte skapa checkout session');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Stripe checkout session error:', error);
      throw error;
    }
  }

  /**
   * Genererar en länk till en faktura
   */
  async getInvoiceLink(invoiceId: string): Promise<{ url: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/invoices/${invoiceId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Kunde inte generera fakturalänk');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Stripe invoice link error:', error);
      throw error;
    }
  }
  
  /**
   * Synkroniserar prenumerationsstatusen med Stripe
   */
  async syncSubscriptionStatus(subscriptionId: string): Promise<Subscription> {
    try {
      const subscriptionResult = await this.subscriptionRepository.getSubscriptionById(subscriptionId);
      if (subscriptionResult.isErr()) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }
      
      const subscription = subscriptionResult.value;
      
      if (!subscription.stripeSubscriptionId) {
        return subscription;
      }
      
      // Hämta status från Stripe
      const stripeSubscription = await this.stripeClient.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );
      
      // Om statusen har ändrats, uppdatera i databasen
      if (subscription.status !== stripeSubscription.status) {
        await this.subscriptionRepository.updateSubscriptionStatus(
          subscription.id,
          stripeSubscription.status
        );
        
        // Uppdatera vår modell
        subscription.status = stripeSubscription.status;
        subscription.updatedAt = new Date();
      }
      
      return subscription;
    } catch (error) {
      console.error('Kunde inte synkronisera prenumerationsstatus:', error);
      throw error;
    }
  }
} 