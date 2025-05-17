/**
 * Mock för Supabase Subscription Repository
 */
import { mockResultOk, mockResultErr } from '@/test-utils';

export const mockSupabaseSubscriptionRepository = {
  getSubscriptionById: jest.fn().mockImplementation((id) => {
    return mockResultOk({
      id,
      organizationId: 'org-123',
      status: 'active',
      plan: { type: 'pro' },
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }),

  getSubscriptionByStripeId: jest.fn(),
  saveSubscription: jest.fn().mockImplementation((subscription) => {
    return mockResultOk({
      id: subscription.id || 'sub-123',
      ...subscription
    });
  }),

  updateSubscription: jest.fn().mockImplementation((id, data) => {
    return mockResultOk({
      id,
      ...data,
      updatedAt: new Date()
    });
  }),

  updateSubscriptionStatus: jest.fn().mockImplementation((id, status) => {
    return mockResultOk({
      id,
      status,
      updatedAt: new Date()
    });
  }),

  deleteSubscription: jest.fn().mockResolvedValue(mockResultOk(true)),

  getActiveSubscriptions: jest.fn().mockResolvedValue(mockResultOk([
    {
      id: 'sub-1',
      organizationId: 'org-1',
      status: 'active',
      stripeSubscriptionId: 'stripe-sub-1',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  ])),

  getSubscriptionsByStatus: jest.fn().mockImplementation((status) => {
    return mockResultOk([
      {
        id: 'sub-1',
        organizationId: 'org-1',
        status,
        stripeSubscriptionId: 'stripe-sub-1'
      },
      {
        id: 'sub-2',
        organizationId: 'org-2',
        status,
        stripeSubscriptionId: 'stripe-sub-2'
      }
    ]);
  }),

  getExpiredSubscriptions: jest.fn().mockResolvedValue(mockResultOk([
    {
      id: 'sub-1',
      organizationId: 'org-1',
      status: 'active',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date(Date.now() - 1000)
    }
  ])),

  getUpcomingRenewals: jest.fn().mockResolvedValue(mockResultOk([
    {
      id: 'sub-1',
      organizationId: 'org-1',
      currentPeriodEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    }
  ])),

  getSubscriptionsWithFailedPayments: jest.fn().mockResolvedValue(mockResultOk([
    {
      id: 'sub-1',
      organizationId: 'org-1',
      status: 'past_due'
    }
  ])),

  getSubscriptionsRenewingBetween: jest.fn().mockImplementation((startDate, endDate) => {
    return mockResultOk([
      {
        id: 'sub-1',
        organizationId: 'org-1',
        currentPeriodEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false
      }
    ]);
  }),

  recordSubscriptionUsage: jest.fn().mockImplementation((orgId, featureKey, amount) => {
    return mockResultOk({
      id: 'usage-123',
      organizationId: orgId,
      feature: featureKey,
      amount,
      recordedAt: new Date()
    });
  }),
};

export default mockSupabaseSubscriptionRepository; 