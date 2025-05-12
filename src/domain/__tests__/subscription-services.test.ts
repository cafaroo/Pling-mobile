/**
 * Tester för prenumerationstjänster i Pling App
 */
import { DefaultSubscriptionService } from '../subscription/services/DefaultSubscriptionService';
import { StripeIntegrationService } from '../subscription/services/StripeIntegrationService';
import { StripeWebhookHandler } from '../subscription/services/StripeWebhookHandler';
import { SubscriptionSchedulerService } from '../subscription/services/SubscriptionSchedulerService';
import { mockResultOk, mockResultErr } from '@/test-utils';
import { DomainEventTestHelper } from '@/test-utils/DomainEventTestHelper';
import { expectResultOk, expectResultErr } from '@/test-utils/error-helpers';

// Mockade repositories
const mockSupabaseSubscriptionRepository = {
  getSubscriptionById: jest.fn(),
  getSubscriptionByStripeId: jest.fn(),
  saveSubscription: jest.fn(),
  getSubscriptionUsageHistory: jest.fn(),
  updateSubscriptionStatus: jest.fn(),
  getSubscriptionsByStatus: jest.fn(),
  getSubscriptionsExpiringInDays: jest.fn(),
  getSubscriptionUsage: jest.fn(),
  recordSubscriptionUsage: jest.fn(),
  getUpcomingRenewals: jest.fn(),
  getExpiredSubscriptions: jest.fn(),
  getSubscriptionsWithFailedPayments: jest.fn(),
};

// Mockad Stripe API-klient
const mockStripeClient = {
  customers: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
  },
  subscriptions: {
    create: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn(),
    retrieve: jest.fn(),
  },
  paymentMethods: {
    retrieve: jest.fn(),
    attach: jest.fn(),
    detach: jest.fn(),
    list: jest.fn(),
  },
  invoices: {
    list: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

// Mockad notifikationstjänst
const mockNotificationService = {
  sendNotification: jest.fn().mockResolvedValue(true),
};

// Mockad eventbus
const eventBus = DomainEventTestHelper.createMockEventBus();

describe('DefaultSubscriptionService', () => {
  let subscriptionService: DefaultSubscriptionService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    subscriptionService = new DefaultSubscriptionService({
      subscriptionRepository: mockSupabaseSubscriptionRepository,
      eventBus,
    });
  });
  
  describe('getTeamSubscription', () => {
    it('ska returnera en prenumeration för ett team', async () => {
      const mockSubscription = { 
        id: 'sub-123', 
        organizationId: 'org-123', 
        status: 'active',
        plan: { type: 'pro' },
      };
      
      mockSupabaseSubscriptionRepository.getSubscriptionById.mockResolvedValue(
        mockResultOk(mockSubscription)
      );
      
      const result = await subscriptionService.getTeamSubscription('org-123');
      
      expect(mockSupabaseSubscriptionRepository.getSubscriptionById).toHaveBeenCalledWith('org-123');
      const subscription = expectResultOk(result, 'getTeamSubscription');
      expect(subscription).toEqual(mockSubscription);
    });
    
    it('ska returnera fel om teamet inte har någon prenumeration', async () => {
      mockSupabaseSubscriptionRepository.getSubscriptionById.mockResolvedValue(
        mockResultErr('SUBSCRIPTION_NOT_FOUND')
      );
      
      const result = await subscriptionService.getTeamSubscription('org-123');
      
      expect(mockSupabaseSubscriptionRepository.getSubscriptionById).toHaveBeenCalledWith('org-123');
      expectResultErr(result, 'SUBSCRIPTION_NOT_FOUND', 'getTeamSubscription');
    });
  });
  
  describe('checkFeatureAccess', () => {
    it('ska ge tillgång till funktioner baserat på prenumerationsplan', async () => {
      // Setup: organisationen har en pro-plan
      const mockSubscription = { 
        id: 'sub-123', 
        organizationId: 'org-123', 
        status: 'active',
        plan: { type: 'pro' },
      };
      
      mockSupabaseSubscriptionRepository.getSubscriptionById.mockResolvedValue(
        mockResultOk(mockSubscription)
      );
      
      // Testa access till grundläggande och pro-funktioner
      const basicFeatureResult = await subscriptionService.checkFeatureAccess('org-123', 'basicFeature');
      const proFeatureResult = await subscriptionService.checkFeatureAccess('org-123', 'proFeature');
      const enterpriseFeatureResult = await subscriptionService.checkFeatureAccess('org-123', 'enterpriseFeature');
      
      // Kontrollera resultaten
      expect(expectResultOk(basicFeatureResult, 'checkBasicFeature')).toBe(true);
      expect(expectResultOk(proFeatureResult, 'checkProFeature')).toBe(true);
      expect(expectResultOk(enterpriseFeatureResult, 'checkEnterpriseFeature')).toBe(false);
    });
    
    it('ska neka åtkomst om prenumerationen inte är aktiv', async () => {
      // Setup: organisationen har en inaktiv prenumeration
      const mockSubscription = { 
        id: 'sub-123', 
        organizationId: 'org-123', 
        status: 'past_due', // Inaktiv prenumeration
        plan: { type: 'pro' },
      };
      
      mockSupabaseSubscriptionRepository.getSubscriptionById.mockResolvedValue(
        mockResultOk(mockSubscription)
      );
      
      // Testa access till pro-funktion
      const proFeatureResult = await subscriptionService.checkFeatureAccess('org-123', 'proFeature');
      
      // Förvänta oss åtkomst nekad
      expectResultErr(proFeatureResult, 'SUBSCRIPTION_INACTIVE', 'checkFeatureAccess');
    });
  });
  
  describe('recordUsage', () => {
    it('ska registrera användning av en funktion', async () => {
      mockSupabaseSubscriptionRepository.recordSubscriptionUsage.mockResolvedValue(
        mockResultOk({ id: 'usage-123' })
      );
      
      const result = await subscriptionService.recordUsage('org-123', 'apiCalls', 1);
      
      expect(mockSupabaseSubscriptionRepository.recordSubscriptionUsage).toHaveBeenCalledWith(
        'org-123', 'apiCalls', 1
      );
      expectResultOk(result, 'recordUsage');
    });
  });
});

describe('StripeIntegrationService', () => {
  let stripeService: StripeIntegrationService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    stripeService = new StripeIntegrationService({
      stripeClient: mockStripeClient as any,
      subscriptionRepository: mockSupabaseSubscriptionRepository,
      eventBus,
    });
  });
  
  describe('createSubscription', () => {
    it('ska skapa en ny prenumeration i Stripe', async () => {
      // Setup: Stripe returnerar en ny prenumeration
      const mockStripeSubscription = {
        id: 'stripe-sub-123',
        customer: 'cus-123',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 dagar framåt
        cancel_at_period_end: false,
      };
      
      mockStripeClient.customers.create.mockResolvedValue({ id: 'cus-123' });
      mockStripeClient.subscriptions.create.mockResolvedValue(mockStripeSubscription);
      
      mockSupabaseSubscriptionRepository.saveSubscription.mockResolvedValue(
        mockResultOk({ id: 'sub-123', stripeSubscriptionId: 'stripe-sub-123' })
      );
      
      const subscriptionData = {
        organizationId: 'org-123',
        planId: 'plan-pro',
        paymentMethodId: 'pm-123',
        billingEmail: 'test@example.com',
        billingName: 'Test User',
        billingAddress: { country: 'SE', line1: 'Test St', city: 'Stockholm', postal_code: '12345' },
      };
      
      const result = await stripeService.createSubscription(subscriptionData);
      
      // Verifiera anrop till Stripe API
      expect(mockStripeClient.customers.create).toHaveBeenCalled();
      expect(mockStripeClient.subscriptions.create).toHaveBeenCalled();
      
      // Verifiera att prenumerationen sparats
      expect(mockSupabaseSubscriptionRepository.saveSubscription).toHaveBeenCalled();
      
      // Verifiera att eventet publicerats
      expect(eventBus.publishEvent).toHaveBeenCalled();
      
      // Verifiera resultatet
      const subscription = expectResultOk(result, 'createSubscription');
      expect(subscription.stripeSubscriptionId).toBe('stripe-sub-123');
    });
    
    it('ska returnera fel om Stripe API misslyckas', async () => {
      // Setup: Stripe API kastar ett fel
      mockStripeClient.customers.create.mockRejectedValue(
        new Error('Invalid payment method')
      );
      
      const subscriptionData = {
        organizationId: 'org-123',
        planId: 'plan-pro',
        paymentMethodId: 'pm-123',
        billingEmail: 'test@example.com',
        billingName: 'Test User',
        billingAddress: { country: 'SE', line1: 'Test St', city: 'Stockholm', postal_code: '12345' },
      };
      
      const result = await stripeService.createSubscription(subscriptionData);
      
      // Verifiera att fel returneras
      expectResultErr(result, 'PAYMENT_ERROR', 'createSubscription');
      
      // Verifiera att inget sparas
      expect(mockSupabaseSubscriptionRepository.saveSubscription).not.toHaveBeenCalled();
      
      // Verifiera att inget event publiceras
      expect(eventBus.publishEvent).not.toHaveBeenCalled();
    });
  });
  
  describe('updateSubscription', () => {
    it('ska uppdatera en befintlig prenumeration', async () => {
      // Setup: befintlig prenumeration
      const existingSubscription = {
        id: 'sub-123',
        stripeSubscriptionId: 'stripe-sub-123',
        stripeCustomerId: 'cus-123',
        status: 'active',
        planId: 'plan-basic',
      };
      
      mockSupabaseSubscriptionRepository.getSubscriptionById.mockResolvedValue(
        mockResultOk(existingSubscription)
      );
      
      mockStripeClient.subscriptions.update.mockResolvedValue({
        id: 'stripe-sub-123',
        status: 'active',
        items: { data: [{ price: 'price-pro' }] },
      });
      
      mockSupabaseSubscriptionRepository.saveSubscription.mockResolvedValue(
        mockResultOk({ ...existingSubscription, planId: 'plan-pro' })
      );
      
      const result = await stripeService.updateSubscription('sub-123', {
        planId: 'plan-pro',
      });
      
      // Verifiera anrop till Stripe API
      expect(mockStripeClient.subscriptions.update).toHaveBeenCalledWith(
        'stripe-sub-123',
        expect.any(Object)
      );
      
      // Verifiera resultatet
      const updatedSubscription = expectResultOk(result, 'updateSubscription');
      expect(updatedSubscription.planId).toBe('plan-pro');
    });
  });
});

describe('StripeWebhookHandler', () => {
  let webhookHandler: StripeWebhookHandler;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    webhookHandler = new StripeWebhookHandler({
      stripeClient: mockStripeClient as any,
      subscriptionRepository: mockSupabaseSubscriptionRepository,
      notificationService: mockNotificationService,
      eventBus,
    });
  });
  
  describe('handleCheckoutSessionCompleted', () => {
    it('ska skapa en ny prenumeration när checkout slutförs', async () => {
      // Setup: mock session och subscription
      const sessionEvent = {
        id: 'cs_123',
        customer: 'cus_123',
        subscription: 'sub_123',
        metadata: { organization_id: 'org-123', plan_id: 'plan-pro' },
      };
      
      const stripeSubscription = {
        id: 'sub_123',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        cancel_at_period_end: false,
      };
      
      mockStripeClient.subscriptions.retrieve.mockResolvedValue(stripeSubscription);
      mockSupabaseSubscriptionRepository.getSubscriptionByStripeId.mockResolvedValue(
        mockResultErr('NOT_FOUND')
      );
      mockSupabaseSubscriptionRepository.saveSubscription.mockResolvedValue(
        mockResultOk({ id: 'sub-123', stripeSubscriptionId: 'sub_123' })
      );
      
      const result = await webhookHandler.handleCheckoutSessionCompleted(sessionEvent as any);
      
      // Verifiera databassparning
      expect(mockSupabaseSubscriptionRepository.saveSubscription).toHaveBeenCalled();
      
      // Verifiera eventemission
      expect(eventBus.publishEvent).toHaveBeenCalled();
      
      // Verifiera resultatet
      expect(result.success).toBe(true);
    });
  });
  
  describe('handleInvoicePaymentSucceeded', () => {
    it('ska uppdatera prenumerationsstatus när betalning lyckas', async () => {
      // Setup
      const invoiceEvent = {
        id: 'in_123',
        subscription: 'sub_123',
        customer: 'cus_123',
        status: 'paid',
      };
      
      mockSupabaseSubscriptionRepository.getSubscriptionByStripeId.mockResolvedValue(
        mockResultOk({ id: 'sub-123', stripeSubscriptionId: 'sub_123', status: 'past_due' })
      );
      
      mockSupabaseSubscriptionRepository.updateSubscriptionStatus.mockResolvedValue(
        mockResultOk({ id: 'sub-123', status: 'active' })
      );
      
      const result = await webhookHandler.handleInvoicePaymentSucceeded(invoiceEvent as any);
      
      // Verifiera statusuppdatering
      expect(mockSupabaseSubscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'sub-123', 'active'
      );
      
      // Verifiera eventemission
      expect(eventBus.publishEvent).toHaveBeenCalled();
      
      // Verifiera resultatet
      expect(result.success).toBe(true);
    });
  });
  
  describe('handleInvoicePaymentFailed', () => {
    it('ska uppdatera prenumerationsstatus och skicka notifikation när betalning misslyckas', async () => {
      // Setup
      const invoiceEvent = {
        id: 'in_123',
        subscription: 'sub_123',
        customer: 'cus_123',
        status: 'open',
        attempt_count: 1,
      };
      
      mockSupabaseSubscriptionRepository.getSubscriptionByStripeId.mockResolvedValue(
        mockResultOk({
          id: 'sub-123',
          stripeSubscriptionId: 'sub_123',
          status: 'active',
          organizationId: 'org-123',
        })
      );
      
      mockSupabaseSubscriptionRepository.updateSubscriptionStatus.mockResolvedValue(
        mockResultOk({ id: 'sub-123', status: 'past_due' })
      );
      
      const result = await webhookHandler.handleInvoicePaymentFailed(invoiceEvent as any);
      
      // Verifiera statusuppdatering
      expect(mockSupabaseSubscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'sub-123', 'past_due'
      );
      
      // Verifiera notifikation
      expect(mockNotificationService.sendNotification).toHaveBeenCalled();
      
      // Verifiera eventemission
      expect(eventBus.publishEvent).toHaveBeenCalled();
      
      // Verifiera resultatet
      expect(result.success).toBe(true);
    });
  });
});

describe('SubscriptionSchedulerService', () => {
  let schedulerService: SubscriptionSchedulerService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    schedulerService = new SubscriptionSchedulerService({
      subscriptionRepository: mockSupabaseSubscriptionRepository,
      stripeClient: mockStripeClient as any,
      notificationService: mockNotificationService,
      eventBus,
    });
  });
  
  describe('syncSubscriptionStatuses', () => {
    it('ska synkronisera prenumerationsstatusarna med Stripe', async () => {
      // Setup: prenumerationer att synkronisera
      const subscriptions = [
        { id: 'sub-1', stripeSubscriptionId: 'stripe-sub-1', status: 'active' },
        { id: 'sub-2', stripeSubscriptionId: 'stripe-sub-2', status: 'past_due' },
      ];
      
      mockSupabaseSubscriptionRepository.getSubscriptionsByStatus.mockResolvedValue(
        mockResultOk(subscriptions)
      );
      
      // Mock Stripe-svar för varje prenumeration
      mockStripeClient.subscriptions.retrieve
        .mockResolvedValueOnce({ id: 'stripe-sub-1', status: 'active' })
        .mockResolvedValueOnce({ id: 'stripe-sub-2', status: 'canceled' });
      
      mockSupabaseSubscriptionRepository.updateSubscriptionStatus.mockResolvedValue(
        mockResultOk({ id: 'sub-2', status: 'canceled' })
      );
      
      const result = await schedulerService.syncSubscriptionStatuses();
      
      // Verifiera att statuskontroller utförts
      expect(mockStripeClient.subscriptions.retrieve).toHaveBeenCalledTimes(2);
      
      // Verifiera uppdatering endast för ändrade statusar
      expect(mockSupabaseSubscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledTimes(1);
      expect(mockSupabaseSubscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'sub-2', 'canceled'
      );
      
      // Verifiera resultatet
      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(1);
    });
  });
  
  describe('checkRenewalReminders', () => {
    it('ska skicka påminnelser om kommande förnyelser', async () => {
      // Setup: prenumerationer som snart förnyas
      const subscriptions = [
        { 
          id: 'sub-1', 
          organizationId: 'org-1', 
          currentPeriodEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 dagar framåt
        },
      ];
      
      mockSupabaseSubscriptionRepository.getUpcomingRenewals.mockResolvedValue(
        mockResultOk(subscriptions)
      );
      
      const result = await schedulerService.checkRenewalReminders();
      
      // Verifiera notifikation
      expect(mockNotificationService.sendNotification).toHaveBeenCalled();
      
      // Verifiera resultatet
      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(1);
    });
  });
  
  describe('processExpiredSubscriptions', () => {
    it('ska hantera utgångna prenumerationer', async () => {
      // Setup: utgångna prenumerationer
      const expiredSubscriptions = [
        { id: 'sub-1', organizationId: 'org-1', status: 'active', cancelAtPeriodEnd: true, currentPeriodEnd: new Date(Date.now() - 1000) },
      ];
      
      mockSupabaseSubscriptionRepository.getExpiredSubscriptions.mockResolvedValue(
        mockResultOk(expiredSubscriptions)
      );
      
      mockSupabaseSubscriptionRepository.updateSubscriptionStatus.mockResolvedValue(
        mockResultOk({ id: 'sub-1', status: 'canceled' })
      );
      
      const result = await schedulerService.processExpiredSubscriptions();
      
      // Verifiera statusuppdatering
      expect(mockSupabaseSubscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledWith(
        'sub-1', 'canceled'
      );
      
      // Verifiera eventemission
      expect(eventBus.publishEvent).toHaveBeenCalled();
      
      // Verifiera resultatet
      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(1);
    });
  });
  
  describe('sendPaymentFailureReminders', () => {
    it('ska skicka påminnelser om misslyckade betalningar', async () => {
      // Setup: prenumerationer med misslyckade betalningar
      const failedPaymentSubscriptions = [
        { id: 'sub-1', organizationId: 'org-1', status: 'past_due' },
      ];
      
      mockSupabaseSubscriptionRepository.getSubscriptionsWithFailedPayments.mockResolvedValue(
        mockResultOk(failedPaymentSubscriptions)
      );
      
      const result = await schedulerService.sendPaymentFailureReminders();
      
      // Verifiera notifikation
      expect(mockNotificationService.sendNotification).toHaveBeenCalled();
      
      // Verifiera resultatet
      expect(result.success).toBe(true);
      expect(result.sentCount).toBe(1);
    });
  });
}); 