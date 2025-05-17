/**
 * Mockade Stripe-objekt för testning
 * 
 * Detta är mockade versioner av objekt som returneras från Stripe API 
 * för att användas i tester.
 */

/**
 * Mockad Stripe subscription struktur
 * 
 * Detta matchar formatet på ett subscription-objekt från Stripe API:
 * https://stripe.com/docs/api/subscriptions/object
 */
export const createMockStripeSubscription = (overrides = {}) => ({
  id: 'sub_123',
  object: 'subscription',
  status: 'active',
  customer: 'cus_123',
  current_period_start: Math.floor(Date.now() / 1000) - 86400,
  current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
  created: Math.floor(Date.now() / 1000) - 86400,
  cancel_at_period_end: false,
  items: {
    object: 'list',
    data: [
      {
        id: 'si_123',
        object: 'subscription_item',
        price: {
          id: 'price_123',
          object: 'price',
          active: true,
          product: 'prod_123', // Detta är planId som används i testerna
          nickname: 'Pro Plan Monthly',
          recurring: {
            interval: 'month'
          }
        },
        quantity: 1
      }
    ],
    has_more: false,
    total_count: 1
  },
  metadata: {
    organization_id: 'org-123'
  },
  trial_end: null,
  ...overrides
});

/**
 * Mockad Stripe checkout session struktur
 * 
 * Detta matchar formatet på ett checkout.session-objekt från Stripe API:
 * https://stripe.com/docs/api/checkout/sessions/object
 */
export const createMockStripeCheckoutSession = (overrides = {}) => ({
  id: 'cs_123',
  object: 'checkout.session',
  customer: 'cus_123',
  subscription: 'sub_123',
  mode: 'subscription',
  status: 'complete',
  metadata: { 
    organization_id: 'org-123', 
    plan_id: 'plan-pro' 
  },
  created: Math.floor(Date.now() / 1000) - 3600,
  ...overrides
});

/**
 * Mockad Stripe invoice struktur
 * 
 * Detta matchar formatet på ett invoice-objekt från Stripe API:
 * https://stripe.com/docs/api/invoices/object
 */
export const createMockStripeInvoice = (overrides = {}) => ({
  id: 'in_123',
  object: 'invoice',
  customer: 'cus_123',
  subscription: 'sub_123',
  status: 'paid',
  amount_due: 2000,
  amount_paid: 2000,
  amount_remaining: 0,
  total: 2000,
  currency: 'sek',
  period_start: Math.floor(Date.now() / 1000) - 30 * 86400,
  period_end: Math.floor(Date.now() / 1000),
  billing_reason: 'subscription_cycle',
  next_payment_attempt: null,
  attempt_count: 1,
  ...overrides
});

/**
 * Mockad Stripe customer struktur
 * 
 * Detta matchar formatet på ett customer-objekt från Stripe API:
 * https://stripe.com/docs/api/customers/object
 */
export const createMockStripeCustomer = (overrides = {}) => ({
  id: 'cus_123',
  object: 'customer',
  name: 'Test Customer',
  email: 'test@example.com',
  metadata: {
    organization_id: 'org-123'
  },
  created: Math.floor(Date.now() / 1000) - 86400 * 30,
  ...overrides
});

/**
 * Mockad Stripe price struktur
 * 
 * Detta matchar formatet på ett price-objekt från Stripe API:
 * https://stripe.com/docs/api/prices/object
 */
export const createMockStripePrice = (overrides = {}) => ({
  id: 'price_123',
  object: 'price',
  active: true,
  product: 'prod_123',
  nickname: 'Pro Plan Monthly',
  unit_amount: 2000,
  currency: 'sek',
  type: 'recurring',
  recurring: {
    interval: 'month',
    interval_count: 1,
    usage_type: 'licensed'
  },
  ...overrides
});

/**
 * Mockad Stripe product struktur
 * 
 * Detta matchar formatet på ett product-objekt från Stripe API:
 * https://stripe.com/docs/api/products/object
 */
export const createMockStripeProduct = (overrides = {}) => ({
  id: 'prod_123',
  object: 'product',
  active: true,
  name: 'Pro Plan',
  description: 'Professional plan with all features',
  metadata: {
    plan_type: 'pro',
    limits: JSON.stringify({
      maxTeams: 10,
      maxMembersPerTeam: 50,
      maxStorage: 50 // GB
    })
  },
  ...overrides
});

/**
 * Mockad Stripe webhook event struktur
 */
export const createMockStripeEvent = (type, data, overrides = {}) => ({
  id: 'evt_123',
  object: 'event',
  api_version: '2020-08-27',
  created: Math.floor(Date.now() / 1000),
  type,
  data: {
    object: data
  },
  ...overrides
}); 