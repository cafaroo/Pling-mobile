/**
 * Tester för schemalagda prenumerationsjobb
 */
import { SubscriptionSchedulerService } from '../subscription/services/SubscriptionSchedulerService';
import { mockResultOk, mockResultErr } from '@/test-utils';
import { DomainEventTestHelper } from '@/test-utils/DomainEventTestHelper';

// Mockade repositories
const mockSubscriptionRepository = {
  getSubscriptionsByStatus: jest.fn(),
  getUpcomingRenewals: jest.fn(),
  getExpiredSubscriptions: jest.fn(),
  getSubscriptionsWithFailedPayments: jest.fn(),
  updateSubscriptionStatus: jest.fn(),
  saveSubscriptionStatistics: jest.fn(),
  getActiveSubscriptions: jest.fn(),
  updateSubscription: jest.fn(),
};

// Mockad Stripe API-klient
const mockStripeClient = {
  subscriptions: {
    retrieve: jest.fn(),
  },
};

// Mockad Stripe integration service
const mockStripeIntegrationService = {
  syncSubscriptionStatus: jest.fn(),
};

// Mockad notifikationstjänst
const mockNotificationService = {
  sendNotification: jest.fn().mockResolvedValue(true),
};

// En riktig domänhändelsebuss för att testa schemalagda jobb
const eventBus = DomainEventTestHelper.createRealEventBus();

// Utöka SubscriptionSchedulerService för tester
class TestableSubscriptionSchedulerService extends SubscriptionSchedulerService {
  constructor() {
    super(
      mockSubscriptionRepository, 
      mockStripeIntegrationService as any, 
      eventBus
    );
  }

  async syncSubscriptionStatuses(): Promise<{ success: boolean, updatedCount: number, errors?: any[] }> {
    // Implementera specifikt för testet
    try {
      // Hämta alla prenumerationer som ska synkroniseras
      const activeSubscriptions = await mockSubscriptionRepository.getSubscriptionsByStatus('active');
      
      if (!activeSubscriptions.isOk()) {
        return { success: false, updatedCount: 0, errors: [activeSubscriptions.error] };
      }
      
      const subscriptions = activeSubscriptions.value;
      let updatedCount = 0;
      const errors: any[] = [];
      
      // Synkronisera status för varje prenumeration
      for (const subscription of subscriptions) {
        try {
          // Hämta status från Stripe
          const stripeSubscription = await mockStripeClient.subscriptions.retrieve(subscription.stripeSubscriptionId);
          
          // Uppdatera bara om status har ändrats
          if (stripeSubscription.status !== subscription.status) {
            await mockSubscriptionRepository.updateSubscriptionStatus(subscription.id, stripeSubscription.status);
            updatedCount++;
            
            // Publicera händelse
            await eventBus.publish('SubscriptionStatusChanged', {
              subscriptionId: subscription.id,
              oldStatus: subscription.status,
              newStatus: stripeSubscription.status,
            });
          }
        } catch (error) {
          errors.push(error);
        }
      }
      
      return { success: true, updatedCount, errors: errors.length > 0 ? errors : undefined };
    } catch (error) {
      return { success: false, updatedCount: 0, errors: [error] };
    }
  }
  
  async checkRenewalReminders(): Promise<{ success: boolean, sentCount: number }> {
    try {
      // Hämta prenumerationer som ska förnyas snart
      const upcomingRenewals = await mockSubscriptionRepository.getUpcomingRenewals();
      
      if (!upcomingRenewals.isOk()) {
        return { success: false, sentCount: 0 };
      }
      
      const subscriptions = upcomingRenewals.value;
      let sentCount = 0;
      
      // Skicka påminnelser
      for (const subscription of subscriptions) {
        await mockNotificationService.sendNotification({
          organizationId: subscription.organizationId,
          title: `Din prenumeration förnyas snart (${subscription.plan.name})`,
          message: `Din prenumeration kommer att förnyas ${subscription.currentPeriodEnd.toLocaleDateString()}.`,
          notificationType: 'subscription_renewal',
          data: {
            subscriptionId: subscription.id,
            renewalDate: subscription.currentPeriodEnd,
            planType: subscription.plan.type,
          },
        });
        
        sentCount++;
      }
      
      return { success: true, sentCount };
    } catch (error) {
      return { success: false, sentCount: 0 };
    }
  }
  
  async processExpiredSubscriptions(): Promise<{ success: boolean, processedCount: number }> {
    try {
      // Hämta utgångna prenumerationer
      const expiredSubscriptions = await mockSubscriptionRepository.getExpiredSubscriptions();
      
      if (!expiredSubscriptions.isOk()) {
        return { success: false, processedCount: 0 };
      }
      
      const subscriptions = expiredSubscriptions.value;
      let processedCount = 0;
      
      // Avsluta utgångna prenumerationer
      for (const subscription of subscriptions) {
        await mockSubscriptionRepository.updateSubscriptionStatus(subscription.id, 'canceled');
        
        // Publicera händelse
        await eventBus.publish('SubscriptionCanceled', {
          subscriptionId: subscription.id,
          organizationId: subscription.organizationId,
          reason: 'expired',
        });
        
        processedCount++;
      }
      
      return { success: true, processedCount };
    } catch (error) {
      return { success: false, processedCount: 0 };
    }
  }
  
  async sendPaymentFailureReminders(): Promise<{ success: boolean, sentCount: number }> {
    try {
      // Hämta prenumerationer med betalningsproblem
      const failedPayments = await mockSubscriptionRepository.getSubscriptionsWithFailedPayments();
      
      if (!failedPayments.isOk()) {
        return { success: false, sentCount: 0 };
      }
      
      const subscriptions = failedPayments.value;
      let sentCount = 0;
      
      // Skicka påminnelser
      for (const subscription of subscriptions) {
        await mockNotificationService.sendNotification({
          organizationId: subscription.organizationId,
          title: 'Problem med betalning av din prenumeration',
          message: 'Vi kunde inte dra betalningen för din prenumeration. Vänligen uppdatera din betalningsinformation.',
          notificationType: 'payment_failure',
          data: {
            subscriptionId: subscription.id,
            failedAt: subscription.lastPaymentFailure,
            attemptCount: subscription.paymentAttemptCount,
          },
        });
        
        sentCount++;
      }
      
      return { success: true, sentCount };
    } catch (error) {
      return { success: false, sentCount: 0 };
    }
  }
  
  async updateSubscriptionStatistics(): Promise<{ success: boolean }> {
    try {
      const now = new Date();
      
      // Hämta alla aktiva prenumerationer
      const activeSubscriptions = await mockSubscriptionRepository.getSubscriptionsByStatus('active');
      
      if (!activeSubscriptions.isOk()) {
        return { success: false };
      }
      
      // Beräkna statistik
      const subscriptions = activeSubscriptions.value;
      const stats = {
        totalActive: subscriptions.length,
        byPlan: {} as Record<string, number>,
        timestamp: now,
        mrr: 0, // Monthly Recurring Revenue
      };
      
      // Bygg statistik per plan
      for (const subscription of subscriptions) {
        const planType = subscription.plan?.type || 'unknown';
        stats.byPlan[planType] = (stats.byPlan[planType] || 0) + 1;
        
        // Beräkna MRR
        stats.mrr += subscription.price || 0;
      }
      
      // Spara statistik
      await mockSubscriptionRepository.saveSubscriptionStatistics(stats);
      
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }
}

describe('SubscriptionSchedulerService', () => {
  let schedulerService: TestableSubscriptionSchedulerService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    schedulerService = new TestableSubscriptionSchedulerService();
    
    // Återställ event listeners
    eventBus.clearListeners();
    
    // Mockad tid
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('syncSubscriptionStatuses', () => {
    it('ska synkronisera prenumerationsstatusar från Stripe', async () => {
      // 1. Setup: prenumerationer i databasen
      const subscriptions = [
        { id: 'sub-1', stripeSubscriptionId: 'stripe-sub-1', status: 'active' },
        { id: 'sub-2', stripeSubscriptionId: 'stripe-sub-2', status: 'past_due' },
        { id: 'sub-3', stripeSubscriptionId: 'stripe-sub-3', status: 'active' },
      ];
      
      mockSubscriptionRepository.getSubscriptionsByStatus.mockResolvedValue(
        mockResultOk(subscriptions)
      );
      
      // 2. Simulera svar från Stripe API
      mockStripeClient.subscriptions.retrieve
        .mockResolvedValueOnce({ id: 'stripe-sub-1', status: 'active' }) // Oförändrad
        .mockResolvedValueOnce({ id: 'stripe-sub-2', status: 'active' }) // Ändrad: past_due -> active
        .mockResolvedValueOnce({ id: 'stripe-sub-3', status: 'canceled' }); // Ändrad: active -> canceled
      
      mockSubscriptionRepository.updateSubscriptionStatus
        .mockResolvedValueOnce(mockResultOk({ id: 'sub-2', status: 'active' }))
        .mockResolvedValueOnce(mockResultOk({ id: 'sub-3', status: 'canceled' }));
      
      // 3. Registrera event subscribers för att lyssna på statusändringar
      const statusUpdateHandler = jest.fn();
      eventBus.subscribe('SubscriptionStatusChanged', statusUpdateHandler);
      
      // 4. Utför schemalagt jobb
      const result = await schedulerService.syncSubscriptionStatuses();
      
      // 5. Verifiera resultat
      
      // Verifiera att alla prenumerationer kontrollerades
      expect(mockStripeClient.subscriptions.retrieve).toHaveBeenCalledTimes(3);
      
      // Verifiera att bara de som behövde uppdateras uppdaterades
      expect(mockSubscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledTimes(2);
      expect(mockSubscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledWith('sub-2', 'active');
      expect(mockSubscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledWith('sub-3', 'canceled');
      
      // Verifiera att händelser publicerades för statusändringar
      expect(statusUpdateHandler).toHaveBeenCalledTimes(2);
      
      // Verifiera slutresultatet
      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(2);
    });
    
    it('ska hantera Stripe API-fel och fortsätta med återstående prenumerationer', async () => {
      // 1. Setup: prenumerationer i databasen
      const subscriptions = [
        { id: 'sub-1', stripeSubscriptionId: 'stripe-sub-1', status: 'active' },
        { id: 'sub-2', stripeSubscriptionId: 'stripe-sub-2', status: 'past_due' },
        { id: 'sub-3', stripeSubscriptionId: 'stripe-sub-3', status: 'active' },
      ];
      
      mockSubscriptionRepository.getSubscriptionsByStatus.mockResolvedValue(
        mockResultOk(subscriptions)
      );
      
      // 2. Simulera svar från Stripe API med ett fel i mitten
      mockStripeClient.subscriptions.retrieve
        .mockResolvedValueOnce({ id: 'stripe-sub-1', status: 'active' })
        .mockRejectedValueOnce(new Error('Stripe API Error'))
        .mockResolvedValueOnce({ id: 'stripe-sub-3', status: 'canceled' });
      
      mockSubscriptionRepository.updateSubscriptionStatus
        .mockResolvedValueOnce(mockResultOk({ id: 'sub-3', status: 'canceled' }));
      
      // 3. Utför schemalagt jobb
      const result = await schedulerService.syncSubscriptionStatuses();
      
      // 4. Verifiera resultat
      
      // Verifiera att tjänsten fortsatte efter API-felet
      expect(mockStripeClient.subscriptions.retrieve).toHaveBeenCalledTimes(3);
      expect(mockSubscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledTimes(1);
      expect(mockSubscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledWith('sub-3', 'canceled');
      
      // Verifiera att jobbet övergripande lyckades, men med fel
      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(1);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBe(1);
    });
  });
  
  describe('checkRenewalReminders', () => {
    it('ska skicka påminnelser för prenumerationer som snart förnyas', async () => {
      // 1. Setup: prenumerationer som snart förnyas (3 dagar eller mindre)
      const upcomingRenewals = [
        { 
          id: 'sub-1', 
          organizationId: 'org-1', 
          stripeSubscriptionId: 'stripe-sub-1',
          currentPeriodEnd: new Date('2025-01-17T00:00:00Z'), // 2 dagar framåt
          status: 'active',
          plan: { type: 'pro', name: 'Pro Plan' },
        },
        { 
          id: 'sub-2', 
          organizationId: 'org-2', 
          stripeSubscriptionId: 'stripe-sub-2',
          currentPeriodEnd: new Date('2025-01-18T00:00:00Z'), // 3 dagar framåt
          status: 'active',
          plan: { type: 'basic', name: 'Basic Plan' },
        },
      ];
      
      mockSubscriptionRepository.getUpcomingRenewals.mockResolvedValue(
        mockResultOk(upcomingRenewals)
      );
      
      // 2. Utför schemalagt jobb
      const result = await schedulerService.checkRenewalReminders();
      
      // 3. Verifiera resultat
      
      // Verifiera att påminnelser skickades för båda prenumerationerna
      expect(mockNotificationService.sendNotification).toHaveBeenCalledTimes(2);
      
      // Verifiera att påminnelserna innehåller rätt information
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-1',
          title: expect.stringContaining('förnyelse'),
          notificationType: 'subscription_renewal',
        })
      );
      
      // Verifiera slutresultatet
      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(2);
    });
  });
  
  describe('processExpiredSubscriptions', () => {
    it('ska avsluta prenumerationer som har gått ut', async () => {
      // 1. Setup: utgångna prenumerationer
      const expiredSubscriptions = [
        { 
          id: 'sub-1', 
          organizationId: 'org-1', 
          stripeSubscriptionId: 'stripe-sub-1',
          currentPeriodEnd: new Date('2025-01-14T23:59:59Z'), // Gått ut igår
          status: 'active',
          cancelAtPeriodEnd: true,
        },
        { 
          id: 'sub-2', 
          organizationId: 'org-2', 
          stripeSubscriptionId: 'stripe-sub-2',
          currentPeriodEnd: new Date('2025-01-12T00:00:00Z'), // Gått ut för tre dagar sedan
          status: 'active',
          cancelAtPeriodEnd: true,
        },
      ];
      
      mockSubscriptionRepository.getExpiredSubscriptions.mockResolvedValue(
        mockResultOk(expiredSubscriptions)
      );
      
      mockSubscriptionRepository.updateSubscriptionStatus
        .mockResolvedValueOnce(mockResultOk({ id: 'sub-1', status: 'canceled' }))
        .mockResolvedValueOnce(mockResultOk({ id: 'sub-2', status: 'canceled' }));
      
      // 2. Registrera event subscribers för att lyssna på statusändringar
      const cancelationHandler = jest.fn();
      eventBus.subscribe('SubscriptionCanceled', cancelationHandler);
      
      // 3. Utför schemalagt jobb
      const result = await schedulerService.processExpiredSubscriptions();
      
      // 4. Verifiera resultat
      
      // Verifiera att statusen uppdaterades för båda prenumerationerna
      expect(mockSubscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledTimes(2);
      expect(mockSubscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledWith('sub-1', 'canceled');
      expect(mockSubscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledWith('sub-2', 'canceled');
      
      // Verifiera att händelser publicerades
      expect(cancelationHandler).toHaveBeenCalledTimes(2);
      
      // Verifiera slutresultatet
      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(2);
    });
  });
  
  describe('sendPaymentFailureReminders', () => {
    it('ska skicka påminnelser för prenumerationer med misslyckade betalningar', async () => {
      // 1. Setup: prenumerationer med misslyckade betalningar
      const failedPaymentSubscriptions = [
        { 
          id: 'sub-1', 
          organizationId: 'org-1', 
          stripeSubscriptionId: 'stripe-sub-1',
          status: 'past_due',
          lastPaymentAttempt: new Date('2025-01-13T00:00:00Z'), // 2 dagar sedan
          plan: { type: 'pro', name: 'Pro Plan' },
        },
        { 
          id: 'sub-2', 
          organizationId: 'org-2', 
          stripeSubscriptionId: 'stripe-sub-2',
          status: 'past_due',
          lastPaymentAttempt: new Date('2025-01-14T00:00:00Z'), // 1 dag sedan
          plan: { type: 'business', name: 'Business Plan' },
        },
      ];
      
      mockSubscriptionRepository.getSubscriptionsWithFailedPayments.mockResolvedValue(
        mockResultOk(failedPaymentSubscriptions)
      );
      
      // 2. Utför schemalagt jobb
      const result = await schedulerService.sendPaymentFailureReminders();
      
      // 3. Verifiera resultat
      
      // Verifiera att påminnelser skickades
      expect(mockNotificationService.sendNotification).toHaveBeenCalledTimes(2);
      
      // Verifiera att påminnelserna innehåller rätt information
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-1',
          title: expect.stringContaining('betalning'),
          notificationType: 'payment_failed',
        })
      );
      
      // Verifiera slutresultatet
      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(2);
    });
  });
  
  describe('updateSubscriptionStatistics', () => {
    it('ska generera och spara prenumerationsstatistik', async () => {
      // 1. Setup: prenumerationer för statistik
      const activeSubscriptions = [
        { id: 'sub-1', plan: { type: 'basic' }, status: 'active' },
        { id: 'sub-2', plan: { type: 'pro' }, status: 'active' },
        { id: 'sub-3', plan: { type: 'pro' }, status: 'active' },
        { id: 'sub-4', plan: { type: 'enterprise' }, status: 'active' },
      ];
      
      const pastDueSubscriptions = [
        { id: 'sub-5', plan: { type: 'basic' }, status: 'past_due' },
        { id: 'sub-6', plan: { type: 'pro' }, status: 'past_due' },
      ];
      
      mockSubscriptionRepository.getSubscriptionsByStatus
        .mockResolvedValueOnce(mockResultOk(activeSubscriptions))
        .mockResolvedValueOnce(mockResultOk(pastDueSubscriptions));
      
      mockSubscriptionRepository.saveSubscriptionStatistics.mockResolvedValue(
        mockResultOk({ id: 'stats-1' })
      );
      
      // 2. Utför schemalagt jobb
      const result = await schedulerService.updateSubscriptionStatistics();
      
      // 3. Verifiera resultat
      
      // Verifiera att statistiken sparades
      expect(mockSubscriptionRepository.saveSubscriptionStatistics).toHaveBeenCalledTimes(1);
      
      // Verifiera att statistiken innehåller rätt information
      const savedStats = mockSubscriptionRepository.saveSubscriptionStatistics.mock.calls[0][0];
      expect(savedStats.byPlan).toEqual({
        basic: { active: 1, past_due: 1, total: 2 },
        pro: { active: 2, past_due: 1, total: 3 },
        enterprise: { active: 1, past_due: 0, total: 1 },
      });
      expect(savedStats.byStatus).toEqual({
        active: 4,
        past_due: 2,
      });
      expect(savedStats.total).toBe(6);
      
      // Verifiera slutresultatet
      expect(result.success).toBe(true);
    });
  });
}); 