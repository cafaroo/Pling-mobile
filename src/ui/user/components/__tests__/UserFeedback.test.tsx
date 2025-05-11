import { FeedbackType, useFeedback } from '../UserFeedback';

/**
 * Förenklad testsvit för UserFeedback
 * 
 * Vi testar endast att exporten finns och att enums är definierade
 * utan att faktiskt rendera komponenten.
 */
describe('UserFeedback', () => {
  it('ska exportera FeedbackType enum', () => {
    expect(FeedbackType).toBeDefined();
    expect(FeedbackType.SUCCESS).toBeDefined();
    expect(FeedbackType.ERROR).toBeDefined();
    expect(FeedbackType.INFO).toBeDefined();
    expect(FeedbackType.WARNING).toBeDefined();
  });
  
  it('ska exportera useFeedback hook', () => {
    expect(useFeedback).toBeDefined();
    expect(typeof useFeedback).toBe('function');
  });
}); 