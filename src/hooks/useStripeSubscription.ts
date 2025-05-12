import { useState, useCallback } from 'react';
import { StripeIntegrationService, PaymentMethod } from '../domain/subscription/services/StripeIntegrationService';
import { SubscriptionPlan } from '../domain/subscription/entities/SubscriptionPlan';
import { Subscription } from '../domain/subscription/entities/Subscription';
import { SupabaseSubscriptionRepository } from '../infrastructure/supabase/repositories/subscription/SupabaseSubscriptionRepository';

/**
 * Hook för att hantera prenumerationsbetalningar via Stripe.
 */
export const useStripeSubscription = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stripeService] = useState(() => 
    new StripeIntegrationService(new SupabaseSubscriptionRepository())
  );

  /**
   * Skapar en ny prenumeration för en organisation.
   */
  const createSubscription = useCallback(async (
    organizationId: string,
    planId: string,
    paymentMethodId: string,
    billingDetails: {
      email: string;
      name: string;
      address: any;
      vatNumber?: string;
    }
  ): Promise<Subscription | null> => {
    setLoading(true);
    setError(null);

    try {
      const subscription = await stripeService.createSubscription(
        organizationId,
        planId,
        paymentMethodId,
        billingDetails
      );
      return subscription;
    } catch (err) {
      setError(err.message || 'Det gick inte att skapa prenumerationen');
      return null;
    } finally {
      setLoading(false);
    }
  }, [stripeService]);

  /**
   * Uppdaterar en existerande prenumeration.
   */
  const updateSubscription = useCallback(async (
    subscriptionId: string,
    updates: {
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
  ): Promise<Subscription | null> => {
    setLoading(true);
    setError(null);

    try {
      const subscription = await stripeService.updateSubscription(
        subscriptionId,
        updates
      );
      return subscription;
    } catch (err) {
      setError(err.message || 'Det gick inte att uppdatera prenumerationen');
      return null;
    } finally {
      setLoading(false);
    }
  }, [stripeService]);

  /**
   * Avbryter en prenumeration.
   */
  const cancelSubscription = useCallback(async (
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Subscription | null> => {
    setLoading(true);
    setError(null);

    try {
      const subscription = await stripeService.cancelSubscription(
        subscriptionId,
        cancelAtPeriodEnd
      );
      return subscription;
    } catch (err) {
      setError(err.message || 'Det gick inte att avbryta prenumerationen');
      return null;
    } finally {
      setLoading(false);
    }
  }, [stripeService]);

  /**
   * Hämtar betalningsmetoder för en kund.
   */
  const getPaymentMethods = useCallback(async (
    customerId: string
  ): Promise<PaymentMethod[]> => {
    setLoading(true);
    setError(null);

    try {
      const paymentMethods = await stripeService.getPaymentMethods(customerId);
      return paymentMethods;
    } catch (err) {
      setError(err.message || 'Det gick inte att hämta betalningsmetoder');
      return [];
    } finally {
      setLoading(false);
    }
  }, [stripeService]);

  /**
   * Skapar en setup intent för att lägga till en betalningsmetod.
   */
  const createSetupIntent = useCallback(async (
    customerId: string
  ): Promise<{ clientSecret: string } | null> => {
    setLoading(true);
    setError(null);

    try {
      const setupIntent = await stripeService.createSetupIntent(customerId);
      return setupIntent;
    } catch (err) {
      setError(err.message || 'Det gick inte att skapa setup intent');
      return null;
    } finally {
      setLoading(false);
    }
  }, [stripeService]);

  /**
   * Skapar en checkout-session för att ändra plan.
   */
  const createCheckoutSession = useCallback(async (
    subscriptionId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string } | null> => {
    setLoading(true);
    setError(null);

    try {
      const session = await stripeService.createCheckoutSession(
        subscriptionId,
        planId,
        successUrl,
        cancelUrl
      );
      return session;
    } catch (err) {
      setError(err.message || 'Det gick inte att skapa checkout session');
      return null;
    } finally {
      setLoading(false);
    }
  }, [stripeService]);

  /**
   * Genererar en länk till en faktura.
   */
  const getInvoiceLink = useCallback(async (
    invoiceId: string
  ): Promise<{ url: string } | null> => {
    setLoading(true);
    setError(null);

    try {
      const invoiceLink = await stripeService.getInvoiceLink(invoiceId);
      return invoiceLink;
    } catch (err) {
      setError(err.message || 'Det gick inte att generera fakturalänk');
      return null;
    } finally {
      setLoading(false);
    }
  }, [stripeService]);

  /**
   * Rensar eventuella fel.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    clearError,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    getPaymentMethods,
    createSetupIntent,
    createCheckoutSession,
    getInvoiceLink,
  };
}; 