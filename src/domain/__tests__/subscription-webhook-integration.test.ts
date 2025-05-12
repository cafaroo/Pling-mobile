/**
 * Integrationstester för Stripe webhook-flödet
 */
import { StripeWebhookHandler } from '../subscription/services/StripeWebhookHandler';
import { SupabaseSubscriptionRepository } from '../subscription/repositories/SupabaseSubscriptionRepository';
import { mockResultOk, mockResultErr } from '@/test-utils';
import { DomainEventTestHelper } from '@/test-utils/DomainEventTestHelper';
import { expectResultOk } from '@/test-utils/error-helpers';

// Mockade dependencies
jest.mock('../subscription/repositories/SupabaseSubscriptionRepository');

// Mockad Stripe API-klient
const mockStripeClient = {
  customers: {
    retrieve: jest.fn(),
  },
  subscriptions: {
    retrieve: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

// Mockad notifikationstjänst
const mockNotificationService = {
  sendNotification: jest.fn().mockResolvedValue(true),
};

// En riktig domänhändelsebuss för att testa integrationen
const eventBus = DomainEventTestHelper.createRealEventBus();

// Mock-implementationer av SupabaseSubscriptionRepository
(SupabaseSubscriptionRepository as jest.Mock).mockImplementation(() => ({
  getSubscriptionByStripeId: jest.fn(),
  saveSubscription: jest.fn(),
  updateSubscriptionStatus: jest.fn(),
  createSubscriptionHistoryEntry: jest.fn(),
}));

describe('Stripe Webhook Integration', () => {
  let webhookHandler: StripeWebhookHandler;
  let subscriptionRepository: SupabaseSubscriptionRepository;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Skapa en ny instans av repository med mockade metoder
    subscriptionRepository = new SupabaseSubscriptionRepository({} as any);
    
    // Skapa webhook handler med injicerade mockade beroenden
    webhookHandler = new StripeWebhookHandler({
      stripeClient: mockStripeClient as any,
      subscriptionRepository,
      notificationService: mockNotificationService,
      eventBus,
    });
    
    // Återställ event listeners för att undvika att tester påverkar varandra
    eventBus.clearListeners();
  });
  
  describe('End-to-end webhook-flöde', () => {
    it('ska hantera checkout.session.completed och uppdatera databasen', async () => {
      // 1. Setup: mock session och subscription från Stripe
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
      
      // 2. Konfigurera mocks för hela flödet
      mockStripeClient.subscriptions.retrieve.mockResolvedValue(stripeSubscription);
      
      subscriptionRepository.getSubscriptionByStripeId = jest.fn().mockResolvedValue(
        mockResultErr('NOT_FOUND')
      );
      
      subscriptionRepository.saveSubscription = jest.fn().mockResolvedValue(
        mockResultOk({ 
          id: 'db-sub-123', 
          stripeSubscriptionId: 'sub_123',
          status: 'active',
          organizationId: 'org-123'
        })
      );
      
      subscriptionRepository.createSubscriptionHistoryEntry = jest.fn().mockResolvedValue(
        mockResultOk({ id: 'hist-123' })
      );
      
      // 3. Lyssna på domänhändelser som ska publiceras
      const subscriberMock = jest.fn();
      eventBus.subscribe('SubscriptionCreated', subscriberMock);
      
      // 4. Utför webhook-hantering
      const result = await webhookHandler.handleCheckoutSessionCompleted(sessionEvent as any);
      
      // 5. Verifiera hela flödet
      
      // Verfiiera anrop till Stripe API
      expect(mockStripeClient.subscriptions.retrieve).toHaveBeenCalledWith('sub_123');
      
      // Verifiera databasanrop
      expect(subscriptionRepository.getSubscriptionByStripeId).toHaveBeenCalledWith('sub_123');
      expect(subscriptionRepository.saveSubscription).toHaveBeenCalled();
      expect(subscriptionRepository.createSubscriptionHistoryEntry).toHaveBeenCalled();
      
      // Verifiera att domänhändelsen publicerades
      expect(subscriberMock).toHaveBeenCalled();
      const event = subscriberMock.mock.calls[0][0];
      expect(event.type).toBe('SubscriptionCreated');
      expect(event.payload.organizationId).toBe('org-123');
      
      // Verifiera slutresultatet
      expect(result.success).toBe(true);
    });
    
    it('ska hantera invoice.payment_succeeded och uppdatera prenumerationsstatus', async () => {
      // 1. Setup: mock invoice från Stripe
      const invoiceEvent = {
        id: 'in_123',
        subscription: 'sub_123',
        customer: 'cus_123',
        status: 'paid',
        total: 1000,
        currency: 'sek',
        billing_reason: 'subscription_cycle',
      };
      
      // 2. Konfigurera mocks för hela flödet
      subscriptionRepository.getSubscriptionByStripeId = jest.fn().mockResolvedValue(
        mockResultOk({ 
          id: 'db-sub-123', 
          stripeSubscriptionId: 'sub_123',
          status: 'past_due',
          organizationId: 'org-123'
        })
      );
      
      subscriptionRepository.updateSubscriptionStatus = jest.fn().mockResolvedValue(
        mockResultOk({ 
          id: 'db-sub-123', 
          status: 'active',
          organizationId: 'org-123'
        })
      );
      
      subscriptionRepository.createSubscriptionHistoryEntry = jest.fn().mockResolvedValue(
        mockResultOk({ id: 'hist-123' })
      );
      
      // 3. Lyssna på domänhändelser som ska publiceras
      const subscriberMock = jest.fn();
      eventBus.subscribe('SubscriptionPaymentSucceeded', subscriberMock);
      
      // 4. Utför webhook-hantering
      const result = await webhookHandler.handleInvoicePaymentSucceeded(invoiceEvent as any);
      
      // 5. Verifiera hela flödet
      
      // Verifiera databasanrop
      expect(subscriptionRepository.getSubscriptionByStripeId).toHaveBeenCalledWith('sub_123');
      expect(subscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledWith('db-sub-123', 'active');
      expect(subscriptionRepository.createSubscriptionHistoryEntry).toHaveBeenCalled();
      
      // Verifiera att domänhändelsen publicerades
      expect(subscriberMock).toHaveBeenCalled();
      const event = subscriberMock.mock.calls[0][0];
      expect(event.type).toBe('SubscriptionPaymentSucceeded');
      expect(event.payload.subscriptionId).toBe('db-sub-123');
      
      // Verifiera slutresultatet
      expect(result.success).toBe(true);
    });
    
    it('ska hantera invoice.payment_failed och skicka notifikation', async () => {
      // 1. Setup: mock failed invoice från Stripe
      const invoiceEvent = {
        id: 'in_123',
        subscription: 'sub_123',
        customer: 'cus_123',
        status: 'open',
        attempt_count: 1,
        next_payment_attempt: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 1 dag framåt
      };
      
      // 2. Konfigurera mocks för hela flödet
      subscriptionRepository.getSubscriptionByStripeId = jest.fn().mockResolvedValue(
        mockResultOk({ 
          id: 'db-sub-123', 
          stripeSubscriptionId: 'sub_123',
          status: 'active',
          organizationId: 'org-123'
        })
      );
      
      subscriptionRepository.updateSubscriptionStatus = jest.fn().mockResolvedValue(
        mockResultOk({ 
          id: 'db-sub-123', 
          status: 'past_due',
          organizationId: 'org-123'
        })
      );
      
      subscriptionRepository.createSubscriptionHistoryEntry = jest.fn().mockResolvedValue(
        mockResultOk({ id: 'hist-123' })
      );
      
      // 3. Lyssna på domänhändelser som ska publiceras
      const subscriberMock = jest.fn();
      eventBus.subscribe('SubscriptionPaymentFailed', subscriberMock);
      
      // 4. Utför webhook-hantering
      const result = await webhookHandler.handleInvoicePaymentFailed(invoiceEvent as any);
      
      // 5. Verifiera hela flödet
      
      // Verifiera databasanrop
      expect(subscriptionRepository.getSubscriptionByStripeId).toHaveBeenCalledWith('sub_123');
      expect(subscriptionRepository.updateSubscriptionStatus).toHaveBeenCalledWith('db-sub-123', 'past_due');
      expect(subscriptionRepository.createSubscriptionHistoryEntry).toHaveBeenCalled();
      
      // Verifiera att notifikation skickades
      expect(mockNotificationService.sendNotification).toHaveBeenCalled();
      
      // Verifiera att domänhändelsen publicerades
      expect(subscriberMock).toHaveBeenCalled();
      const event = subscriberMock.mock.calls[0][0];
      expect(event.type).toBe('SubscriptionPaymentFailed');
      expect(event.payload.subscriptionId).toBe('db-sub-123');
      
      // Verifiera slutresultatet
      expect(result.success).toBe(true);
    });
    
    it('ska hantera customer.subscription.updated och uppdatera status', async () => {
      // 1. Setup: mock subscription update från Stripe
      const subscriptionEvent = {
        id: 'sub_123',
        status: 'active',
        customer: 'cus_123',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        cancel_at_period_end: true, // Markerad för avslut vid periodens slut
      };
      
      // 2. Konfigurera mocks för hela flödet
      subscriptionRepository.getSubscriptionByStripeId = jest.fn().mockResolvedValue(
        mockResultOk({ 
          id: 'db-sub-123', 
          stripeSubscriptionId: 'sub_123',
          status: 'active',
          cancelAtPeriodEnd: false, // Tidigare inte markerad för avslut
          organizationId: 'org-123'
        })
      );
      
      subscriptionRepository.saveSubscription = jest.fn().mockResolvedValue(
        mockResultOk({ 
          id: 'db-sub-123', 
          status: 'active',
          cancelAtPeriodEnd: true,
          organizationId: 'org-123'
        })
      );
      
      subscriptionRepository.createSubscriptionHistoryEntry = jest.fn().mockResolvedValue(
        mockResultOk({ id: 'hist-123' })
      );
      
      // 3. Lyssna på domänhändelser som ska publiceras
      const subscriberMock = jest.fn();
      eventBus.subscribe('SubscriptionUpdated', subscriberMock);
      
      // 4. Utför webhook-hantering
      const result = await webhookHandler.handleCustomerSubscriptionUpdated(subscriptionEvent as any);
      
      // 5. Verifiera hela flödet
      
      // Verifiera databasanrop
      expect(subscriptionRepository.getSubscriptionByStripeId).toHaveBeenCalledWith('sub_123');
      expect(subscriptionRepository.saveSubscription).toHaveBeenCalled();
      expect(subscriptionRepository.createSubscriptionHistoryEntry).toHaveBeenCalled();
      
      // Verifiera att domänhändelsen publicerades
      expect(subscriberMock).toHaveBeenCalled();
      const event = subscriberMock.mock.calls[0][0];
      expect(event.type).toBe('SubscriptionUpdated');
      expect(event.payload.subscriptionId).toBe('db-sub-123');
      
      // Verifiera slutresultatet
      expect(result.success).toBe(true);
    });
  });
  
  describe('Felhantering', () => {
    it('ska hantera fall när prenumerationen inte hittas', async () => {
      // Setup: webhook för prenumeration som inte finns i vår databas
      const subscriptionEvent = {
        id: 'non_existent_sub',
        status: 'active',
      };
      
      // Mock returvärden
      subscriptionRepository.getSubscriptionByStripeId = jest.fn().mockResolvedValue(
        mockResultErr('SUBSCRIPTION_NOT_FOUND')
      );
      
      // Lyssna på error events
      const errorHandlerMock = jest.fn();
      eventBus.subscribe('ErrorOccurred', errorHandlerMock);
      
      // Utför webhook-hantering
      const result = await webhookHandler.handleCustomerSubscriptionUpdated(subscriptionEvent as any);
      
      // Verifiera att felhantering fungerar som förväntat
      expect(result.success).toBe(false);
      expect(result.error).toBe('SUBSCRIPTION_NOT_FOUND');
      
      // Verifiera att fel-event publicerades
      expect(errorHandlerMock).toHaveBeenCalled();
      const errorEvent = errorHandlerMock.mock.calls[0][0];
      expect(errorEvent.type).toBe('ErrorOccurred');
      expect(errorEvent.payload.error).toBe('SUBSCRIPTION_NOT_FOUND');
    });
    
    it('ska hantera databasfel korrekt', async () => {
      // Setup: mock session
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
      };
      
      // Konfigurera mocks
      mockStripeClient.subscriptions.retrieve.mockResolvedValue(stripeSubscription);
      
      subscriptionRepository.getSubscriptionByStripeId = jest.fn().mockResolvedValue(
        mockResultErr('NOT_FOUND')
      );
      
      // Simulera ett databasfel
      subscriptionRepository.saveSubscription = jest.fn().mockResolvedValue(
        mockResultErr('DATABASE_ERROR')
      );
      
      // Lyssna på error events
      const errorHandlerMock = jest.fn();
      eventBus.subscribe('ErrorOccurred', errorHandlerMock);
      
      // Utför webhook-hantering
      const result = await webhookHandler.handleCheckoutSessionCompleted(sessionEvent as any);
      
      // Verifiera att felhantering fungerar som förväntat
      expect(result.success).toBe(false);
      expect(result.error).toBe('DATABASE_ERROR');
      
      // Verifiera att fel-event publicerades
      expect(errorHandlerMock).toHaveBeenCalled();
    });
  });
}); 