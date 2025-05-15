import { Email } from '../Email';
import '@testing-library/jest-dom';

describe('Email', () => {
  it('ska skapa ett giltigt Email-objekt', () => {
    const emailResult = Email.create('test@example.com');
    expect(emailResult.isSuccess).toBe(true);
    
    if (emailResult.isSuccess) {
      const email = emailResult.getValue();
      expect(email.value).toBe('test@example.com');
      expect(email.toString()).toBe('test@example.com');
    }
  });
  
  it('ska hantera kapitalisering och trimning', () => {
    const emailResult = Email.create('  TEST@EXAMPLE.COM  ');
    expect(emailResult.isSuccess).toBe(true);
    
    if (emailResult.isSuccess) {
      expect(emailResult.getValue().value).toBe('test@example.com');
    }
  });
  
  it('ska returnera domändelen från e-postadressen', () => {
    const emailResult = Email.create('test@example.com');
    expect(emailResult.isSuccess).toBe(true);
    
    if (emailResult.isSuccess) {
      expect(emailResult.getValue().domain).toBe('example.com');
    }
  });
  
  it('ska misslyckas för en e-postadress utan @', () => {
    const emailResult = Email.create('testexample.com');
    expect(emailResult.isSuccess).toBe(false);
    expect(emailResult.isFailure).toBe(true);
    
    if (emailResult.isFailure) {
      expect(emailResult.error).toContain('Ogiltig e-postadress');
    }
  });
  
  it('ska misslyckas för en e-postadress utan domän', () => {
    const emailResult = Email.create('test@');
    expect(emailResult.isSuccess).toBe(false);
    expect(emailResult.isFailure).toBe(true);
    
    if (emailResult.isFailure) {
      expect(emailResult.error).toContain('Ogiltig e-postadress');
    }
  });
  
  it('ska misslyckas för en tom e-postadress', () => {
    const emailResult = Email.create('');
    expect(emailResult.isSuccess).toBe(false);
    expect(emailResult.isFailure).toBe(true);
    
    if (emailResult.isFailure) {
      expect(emailResult.error).toContain('får inte vara tom');
    }
  });
  
  it('ska jämföra två identiska e-postadresser som lika', () => {
    const email1Result = Email.create('test@example.com');
    const email2Result = Email.create('test@example.com');
    
    expect(email1Result.isSuccess && email2Result.isSuccess).toBe(true);
    
    if (email1Result.isSuccess && email2Result.isSuccess) {
      const email1 = email1Result.getValue();
      const email2 = email2Result.getValue();
      
      expect(email1.equals(email2)).toBe(true);
    }
  });
  
  it('ska jämföra två olika e-postadresser som olika', () => {
    const email1Result = Email.create('test1@example.com');
    const email2Result = Email.create('test2@example.com');
    
    expect(email1Result.isSuccess && email2Result.isSuccess).toBe(true);
    
    if (email1Result.isSuccess && email2Result.isSuccess) {
      const email1 = email1Result.getValue();
      const email2 = email2Result.getValue();
      
      expect(email1.equals(email2)).toBe(false);
    }
  });
}); 