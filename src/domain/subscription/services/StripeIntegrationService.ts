import { Subscription } from '../entities/Subscription';
import { SubscriptionPlan } from '../entities/SubscriptionPlan';
import { SubscriptionRepository } from '../repositories/SubscriptionRepository';
import { Platform } from 'react-native';
import Stripe from 'stripe';

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

  constructor(
    private readonly subscriptionRepository: SubscriptionRepository
  ) {
    // Initiera Stripe i webmiljö om det behövs
    if (Platform.OS === 'web') {
      this.initializeStripe();
    }
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
  async createSubscription(
    organizationId: string,
    planId: string,
    paymentMethodId: string,
    billingDetails: {
      email: string;
      name: string;
      address: any;
      vatNumber?: string;
    }
  ): Promise<Subscription> {
    try {
      // Anropa backend-API som hanterar kommunikation med Stripe
      const response = await fetch(`${this.apiBaseUrl}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          planId,
          paymentMethodId,
          billingDetails
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Kunde inte skapa prenumeration');
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
      await this.subscriptionRepository.saveSubscription(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Stripe subscription error:', error);
      throw error;
    }
  }

  /**
   * Uppdaterar en existerande prenumeration
   */
  async updateSubscription(
    subscriptionId: string,
    updates: SubscriptionUpdate
  ): Promise<Subscription> {
    try {
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
        throw new Error(errorData.message || 'Kunde inte uppdatera prenumeration');
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
      console.error('Stripe update error:', error);
      throw error;
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
   * Synkroniserar prenumerationsstatus från Stripe
   */
  async syncSubscriptionStatus(subscriptionId: string): Promise<Subscription> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/subscriptions/${subscriptionId}/sync`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Kunde inte synkronisera prenumerationsstatus');
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
      console.error('Stripe sync error:', error);
      throw error;
    }
  }
} 