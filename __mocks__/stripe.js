/**
 * Mock för Stripe i testerna
 */

const stripeMock = jest.fn().mockImplementation(() => ({
  customers: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
    listPaymentMethods: jest.fn(),
  },
  setupIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
  paymentMethods: {
    attach: jest.fn(),
    detach: jest.fn(),
  },
  subscriptions: {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
    del: jest.fn(),
  },
  invoices: {
    retrieve: jest.fn(),
    listUpcoming: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn(),
    }
  },
  webhooks: {
    constructEvent: jest.fn(),
  }
}));

module.exports = stripeMock; 