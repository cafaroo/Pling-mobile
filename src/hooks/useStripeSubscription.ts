import { useState, useCallback, useEffect } from 'react';
import { StripeIntegrationService, PaymentMethod } from '../domain/subscription/services/StripeIntegrationService';
import { SubscriptionPlan } from '../domain/subscription/entities/SubscriptionPlan';
import { Subscription } from '../domain/subscription/entities/Subscription';
import { SupabaseSubscriptionRepository } from '../infrastructure/supabase/repositories/subscription/SupabaseSubscriptionRepository';
import { supabase } from '../lib/supabase';
import { EventBus } from '../domain/core/EventBus';

/**
 * Hook för att hantera prenumerationsbetalningar via Stripe.
 */
export const useStripeSubscription = (subscriptionId?: string) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stripeService] = useState(() => 
    new StripeIntegrationService(new SupabaseSubscriptionRepository(supabase, new EventBus()))
  );

  // Ladda prenumerationen om ett ID finns
  useEffect(() => {
    if (subscriptionId) {
      loadSubscription(subscriptionId);
    }
  }, [subscriptionId]);

  // Ladda prenumerationsplaner
  useEffect(() => {
    loadAvailablePlans();
  }, []);

  /**
   * Laddar befintlig prenumeration
   */
  const loadSubscription = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      // Synka status med Stripe för att säkerställa att vi har senaste informationen
      const syncedSubscription = await stripeService.syncSubscriptionStatus(id);
      setSubscription(syncedSubscription);
      
      // Ladda även fakturor om vi har en prenumeration
      if (syncedSubscription && syncedSubscription.payment?.customerId) {
        loadInvoices(syncedSubscription.payment.customerId);
      }
      
      return syncedSubscription;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunde inte ladda prenumeration';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [stripeService]);
  
  /**
   * Laddar tillgängliga prenumerationsplaner
   */
  const loadAvailablePlans = useCallback(async () => {
    setLoading(true);
    try {
      const repository = new SupabaseSubscriptionRepository(supabase, new EventBus());
      const plans = await repository.getAllSubscriptionPlans();
      setAvailablePlans(plans);
    } catch (err) {
      console.error('Fel vid laddning av prenumerationsplaner:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Laddar fakturahistorik för en kund
   */
  const loadInvoices = useCallback(async (customerId: string) => {
    try {
      const response = await fetch(`https://api.pling-app.se/stripe/customers/${customerId}/invoices`);
      
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error('Fel vid laddning av fakturor:', err);
    }
  }, []);

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
      setSubscription(subscription);
      return subscription;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Det gick inte att skapa prenumerationen';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [stripeService]);

  /**
   * Uppdaterar en existerande prenumeration.
   */
  const updateSubscription = useCallback(async (
    subId: string,
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
        subId,
        updates
      );
      setSubscription(subscription);
      return subscription;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Det gick inte att uppdatera prenumerationen';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [stripeService]);

  /**
   * Aktiverar eller inaktiverar automatisk förnyelse
   */
  const toggleAutoRenewal = useCallback(async (
    enableAutoRenewal: boolean
  ): Promise<Subscription | null> => {
    if (!subscription) {
      setError('Ingen aktiv prenumeration hittades');
      return null;
    }
    
    return updateSubscription(
      subscription.id, 
      { cancelAtPeriodEnd: !enableAutoRenewal }
    );
  }, [subscription, updateSubscription]);

  /**
   * Avbryter en prenumeration.
   */
  const cancelSubscription = useCallback(async (
    subId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Subscription | null> => {
    setLoading(true);
    setError(null);

    try {
      const subscription = await stripeService.cancelSubscription(
        subId,
        cancelAtPeriodEnd
      );
      setSubscription(subscription);
      return subscription;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Det gick inte att avbryta prenumerationen';
      setError(message);
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
      const message = err instanceof Error ? err.message : 'Det gick inte att hämta betalningsmetoder';
      setError(message);
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
      const message = err instanceof Error ? err.message : 'Det gick inte att skapa setup intent';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [stripeService]);

  /**
   * Skapar en checkout-session för att ändra plan.
   */
  const createCheckoutSession = useCallback(async (
    subId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string } | null> => {
    setLoading(true);
    setError(null);

    try {
      const session = await stripeService.createCheckoutSession(
        subId,
        planId,
        successUrl,
        cancelUrl
      );
      return session;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Det gick inte att skapa checkout session';
      setError(message);
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
      const message = err instanceof Error ? err.message : 'Det gick inte att generera fakturalänk';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [stripeService]);

  /**
   * Hanterar en misslyckad betalning genom att uppdatera betalningsmetod
   */
  const handleFailedPayment = useCallback(async (
    paymentIntentId: string, 
    newPaymentMethodId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://api.pling-app.se/stripe/payment-intents/${paymentIntentId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentMethodId: newPaymentMethodId }),
      });
      
      if (!response.ok) {
        throw new Error('Betalningen kunde inte behandlas');
      }
      
      // Om prenumerationen finns, uppdatera informationen
      if (subscription) {
        await loadSubscription(subscription.id);
      }
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Det gick inte att hantera den misslyckade betalningen';
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [subscription, loadSubscription]);

  /**
   * Rensar eventuella fel.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    subscription,
    availablePlans,
    invoices,
    clearError,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    toggleAutoRenewal,
    getPaymentMethods,
    createSetupIntent,
    createCheckoutSession,
    getInvoiceLink,
    handleFailedPayment,
    loadSubscription,
    loadInvoices,
  };
}; 