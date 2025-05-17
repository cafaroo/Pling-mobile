/**
 * Integrationstester för Stripe webhook-flödet
 */
import { StripeWebhookHandler } from '../subscription/services/StripeWebhookHandler';
import { SupabaseSubscriptionRepository } from '../subscription/repositories/SupabaseSubscriptionRepository';
import { mockResultOk, mockResultErr } from '@/test-utils';
import { DomainEventTestHelper } from '@/test-utils/DomainEventTestHelper';
import { 
  createMockStripeSubscription, 
  createMockStripeCheckoutSession, 
  createMockStripeInvoice 
} from '@/test-utils/mocks/mockStripeObjects';

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
  getSubscriptionByStripeId: jest.fn().mockResolvedValue(
    mockResultErr('NOT_FOUND')
  ),
  saveSubscription: jest.fn().mockResolvedValue(
    mockResultOk({ 
      id: 'db-sub-123', 
      stripeSubscriptionId: 'sub_123',
      status: 'active',
      organizationId: 'org-123'
    })
  ),
  updateSubscription: jest.fn().mockResolvedValue(
    mockResultOk({})
  ),
  createSubscriptionHistoryEntry: jest.fn().mockResolvedValue(
    mockResultOk({ id: 'hist-123' })
  ),
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
    
    // Konfigurera mock-återvändningsvärden
    mockStripeClient.subscriptions.retrieve.mockResolvedValue(
      createMockStripeSubscription()
    );
  });
  
  describe('Webhook-hantering', () => {
    it('ska hantera checkout.session.completed utan att kasta fel', async () => {
      // Skapa en mock checkout session
      const sessionEvent = createMockStripeCheckoutSession();
      
      // Registrera event-lyssnare
      const eventListener = jest.fn();
      eventBus.subscribe('subscription.created', eventListener);
      
      // Utför och verifiera att testet inte kastar fel
      await expect(
        webhookHandler.handleCheckoutSessionCompleted(sessionEvent)
      ).resolves.not.toThrow();
      
      // Simpel verifiering att något publicerades via eventBus
      expect(eventListener).toHaveBeenCalled();
    });
  });
}); 