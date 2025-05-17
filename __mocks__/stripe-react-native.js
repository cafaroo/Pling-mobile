/**
 * Mock för stripe-react-native i testerna
 */

const stripeReactNativeMock = {
  initStripe: jest.fn(),
  createToken: jest.fn(),
  presentPaymentSheet: jest.fn(),
  initPaymentSheet: jest.fn(),
  confirmPayment: jest.fn(),
  createPaymentMethod: jest.fn(),
  handleCardAction: jest.fn(),
  retrievePaymentIntent: jest.fn(),
  retrieveSetupIntent: jest.fn(),
  confirmSetupIntent: jest.fn(),
  createTokenForCVCUpdate: jest.fn(),
  CardField: jest.fn(() => null),
  CardForm: jest.fn(() => null),
  ApplePayButton: jest.fn(() => null),
  GooglePayButton: jest.fn(() => null),
  useStripe: jest.fn(() => ({
    initPaymentSheet: jest.fn(),
    presentPaymentSheet: jest.fn(),
    confirmPayment: jest.fn(),
    retrievePaymentIntent: jest.fn(),
  })),
};

module.exports = stripeReactNativeMock; 