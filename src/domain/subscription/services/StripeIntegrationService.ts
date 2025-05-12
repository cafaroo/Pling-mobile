import { Subscription } from '../entities/Subscription';
import { SubscriptionPlan } from '../entities/SubscriptionPlan';
import { SubscriptionRepository } from '../repositories/SubscriptionRepository';

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
 * 
 * Detta är en dummy-implementation som simulerar Stripe-anrop 
 * utan att faktiskt anropa Stripe-API:et. I en riktig implementation 
 * skulle denna service anropa Stripe API och hantera webhooks.
 */
export class StripeIntegrationService {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository
  ) {}

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
    // Hämta plan för att få pris
    const plan = await this.subscriptionRepository.getSubscriptionPlan(planId);
    
    if (!plan) {
      throw new Error('Prenumerationsplan kunde inte hittas');
    }
    
    // Simulera Stripe-anrop
    console.log(`STRIPE SIMULATION: Creating subscription for org ${organizationId} with plan ${plan.name}`);
    
    // Skapa en ny prenumeration
    const now = new Date();
    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    
    const subscription: Subscription = {
      id: `sub_${Math.random().toString(36).substring(2, 15)}`,
      organizationId,
      planId,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: oneMonthLater,
      cancelAtPeriodEnd: false,
      payment: {
        provider: 'stripe',
        customerId: `cus_${Math.random().toString(36).substring(2, 15)}`,
        subscriptionId: `sub_${Math.random().toString(36).substring(2, 15)}`,
        paymentMethodId,
      },
      billing: {
        email: billingDetails.email,
        name: billingDetails.name,
        address: billingDetails.address,
        vatNumber: billingDetails.vatNumber,
      },
      usage: {
        teamMembers: 0,
        mediaStorage: 0,
        lastUpdated: now,
      },
      createdAt: now,
      updatedAt: now,
    };
    
    // Spara i databasen
    await this.subscriptionRepository.saveSubscription(subscription);
    
    return subscription;
  }

  /**
   * Uppdaterar en existerande prenumeration
   */
  async updateSubscription(
    subscriptionId: string,
    updates: SubscriptionUpdate
  ): Promise<Subscription> {
    // Hämta aktuell prenumeration
    const subscription = await this.subscriptionRepository.getById(subscriptionId);
    
    if (!subscription) {
      throw new Error('Prenumeration kunde inte hittas');
    }
    
    // Simulera Stripe-anrop
    console.log(`STRIPE SIMULATION: Updating subscription ${subscriptionId}`);
    
    // Skapa uppdaterad prenumeration
    const updatedSubscription: Subscription = {
      ...subscription,
      planId: updates.planId || subscription.planId,
      cancelAtPeriodEnd: updates.cancelAtPeriodEnd !== undefined 
        ? updates.cancelAtPeriodEnd 
        : subscription.cancelAtPeriodEnd,
      payment: {
        ...subscription.payment,
        paymentMethodId: updates.paymentMethodId || subscription.payment.paymentMethodId,
      },
      billing: {
        ...subscription.billing,
        ...(updates.billing || {}),
      },
      updatedAt: new Date(),
    };
    
    // Spara i databasen
    await this.subscriptionRepository.updateSubscription(subscriptionId, updatedSubscription);
    
    return updatedSubscription;
  }

  /**
   * Avbryter en prenumeration
   */
  async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Subscription> {
    // Hämta aktuell prenumeration
    const subscription = await this.subscriptionRepository.getById(subscriptionId);
    
    if (!subscription) {
      throw new Error('Prenumeration kunde inte hittas');
    }
    
    // Simulera Stripe-anrop
    console.log(`STRIPE SIMULATION: Cancelling subscription ${subscriptionId}`);
    
    // Uppdatera prenumeration
    const updatedSubscription: Subscription = {
      ...subscription,
      status: cancelAtPeriodEnd ? 'active' : 'canceled',
      cancelAtPeriodEnd,
      updatedAt: new Date(),
    };
    
    // Spara i databasen
    await this.subscriptionRepository.updateSubscription(subscriptionId, updatedSubscription);
    
    return updatedSubscription;
  }

  /**
   * Hämtar betalningsmetoder för en kund
   */
  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    // Simulera Stripe-anrop
    console.log(`STRIPE SIMULATION: Fetching payment methods for customer ${customerId}`);
    
    // Returnera dummy-data
    return [
      {
        id: 'pm_123456789',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          expMonth: 12,
          expYear: 2025,
        },
      },
    ];
  }

  /**
   * Skapar en checkout-session för att lägga till en betalningsmetod
   */
  async createSetupIntent(customerId: string): Promise<{ clientSecret: string }> {
    // Simulera Stripe-anrop
    console.log(`STRIPE SIMULATION: Creating setup intent for customer ${customerId}`);
    
    // Returnera dummy-data
    return {
      clientSecret: `seti_${Math.random().toString(36).substring(2, 15)}_secret_${Math.random().toString(36).substring(2, 15)}`,
    };
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
    // Simulera Stripe-anrop
    console.log(`STRIPE SIMULATION: Creating checkout session for subscription ${subscriptionId} to plan ${planId}`);
    
    // Returnera dummy-data
    return {
      sessionId: `cs_${Math.random().toString(36).substring(2, 15)}`,
    };
  }

  /**
   * Genererar en länk till en faktura
   */
  async getInvoiceLink(invoiceId: string): Promise<{ url: string }> {
    // Simulera Stripe-anrop
    console.log(`STRIPE SIMULATION: Generating invoice link for invoice ${invoiceId}`);
    
    // Returnera dummy-data
    return {
      url: `https://example.com/invoice/${invoiceId}`,
    };
  }
} 