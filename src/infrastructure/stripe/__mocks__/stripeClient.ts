/**
 * Mock för Stripe Client API
 */

// Simpel mock av Stripe-klienten med alla metoder som används i testerna 
export const mockStripeClient = {
  customers: {
    create: jest.fn().mockResolvedValue({ id: 'cus_123' }),
    retrieve: jest.fn().mockResolvedValue({ id: 'cus_123', name: 'Test Customer' }),
    update: jest.fn().mockResolvedValue({ id: 'cus_123', name: 'Updated Customer' }),
    listPaymentMethods: jest.fn().mockResolvedValue({
      data: [
        { 
          id: 'pm_123', 
          type: 'card',
          card: { 
            brand: 'visa', 
            last4: '4242', 
            exp_month: 12, 
            exp_year: 2025 
          } 
        }
      ]
    }),
  },
  subscriptions: {
    create: jest.fn().mockResolvedValue({
      id: 'sub_123',
      customer: 'cus_123',
      status: 'active',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      cancel_at_period_end: false,
      items: { data: [{ price: 'price_123' }] },
    }),
    retrieve: jest.fn().mockResolvedValue({
      id: 'sub_123',
      customer: 'cus_123',
      status: 'active',
    }),
    update: jest.fn().mockResolvedValue({
      id: 'sub_123',
      customer: 'cus_123',
      status: 'active',
      items: { data: [{ price: 'price_456' }] },
    }),
    del: jest.fn().mockResolvedValue({
      id: 'sub_123',
      status: 'canceled',
    }),
  },
  invoices: {
    retrieve: jest.fn().mockResolvedValue({
      id: 'in_123',
      subscription: 'sub_123',
      customer: 'cus_123',
      status: 'paid',
      hosted_invoice_url: 'https://invoice.url',
    }),
    listUpcoming: jest.fn().mockResolvedValue({
      data: [
        {
          id: 'in_upcoming',
          subscription: 'sub_123',
          customer: 'cus_123',
          status: 'draft',
          amount_due: 1999,
        }
      ]
    }),
  },
  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue({
        id: 'cs_123',
        url: 'https://checkout.url',
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'cs_123',
        customer: 'cus_123',
        subscription: 'sub_123',
        payment_status: 'paid',
      }),
    }
  },
  paymentIntents: {
    retrieve: jest.fn().mockResolvedValue({
      id: 'pi_123',
      status: 'succeeded',
      client_secret: 'pi_123_secret',
    }),
  },
  setupIntents: {
    create: jest.fn().mockResolvedValue({
      id: 'si_123',
      client_secret: 'si_123_secret',
    }),
  },
  webhooks: {
    constructEvent: jest.fn().mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_123' } },
    }),
  }
};

export default mockStripeClient; 