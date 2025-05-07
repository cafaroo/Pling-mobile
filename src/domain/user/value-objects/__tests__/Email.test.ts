import { Email } from '../Email';

describe('Email', () => {
  describe('create', () => {
    it('ska skapa ett giltigt e-postobjekt', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.se',
        'user+tag@domain.co.uk',
        'first.last@sub.domain.com'
      ];

      validEmails.forEach(email => {
        const result = Email.create(email);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.getValue().toString()).toBe(email.toLowerCase());
        }
      });
    });

    it('ska konvertera e-post till gemener', () => {
      const result = Email.create('Test.User@Example.Com');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.getValue().toString()).toBe('test.user@example.com');
      }
    });

    it('ska returnera fel för tom e-postadress', () => {
      const result = Email.create('');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.getError()).toBe('Email kan inte vara tom');
      }
    });

    it('ska returnera fel för ogiltiga e-postadresser', () => {
      const invalidEmails = [
        'not.an.email',
        '@domain.com',
        'user@',
        'user@.com',
        'user@.com.',
        '@',
        'user name@domain.com',
        'user@domain..com'
      ];

      invalidEmails.forEach(email => {
        const result = Email.create(email);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.getError()).toBe('Ogiltig e-postadress');
        }
      });
    });
  });

  describe('equals', () => {
    it('ska korrekt jämföra två e-postadresser', () => {
      const email1 = Email.create('test@example.com').getValue();
      const email2 = Email.create('test@example.com').getValue();
      const email3 = Email.create('other@example.com').getValue();

      expect(email1.equals(email2)).toBe(true);
      expect(email1.equals(email3)).toBe(false);
    });

    it('ska hantera skiftlägeskänslighet vid jämförelse', () => {
      const email1 = Email.create('Test@Example.com').getValue();
      const email2 = Email.create('test@example.com').getValue();

      expect(email1.equals(email2)).toBe(true);
    });
  });

  describe('toString', () => {
    it('ska returnera e-postadressen som sträng', () => {
      const email = Email.create('test@example.com').getValue();
      expect(email.toString()).toBe('test@example.com');
    });
  });
}); 