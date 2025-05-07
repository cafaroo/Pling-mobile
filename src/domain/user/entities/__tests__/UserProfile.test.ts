import { UserProfile } from '../UserProfile';

describe('UserProfile', () => {
  const validProfileProps = {
    firstName: 'Test',
    lastName: 'User',
    displayName: 'TestUser',
    avatarUrl: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
    location: 'Stockholm',
    contact: {
      email: 'test@example.com',
      phone: '+46701234567',
      alternativeEmail: 'alt@example.com'
    },
    customFields: {
      company: 'Test AB',
      department: 'IT'
    }
  };

  describe('create', () => {
    it('ska skapa en giltig profil med alla fält', () => {
      const result = UserProfile.create(validProfileProps);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const profile = result.getValue();
        expect(profile.firstName).toBe('Test');
        expect(profile.lastName).toBe('User');
        expect(profile.displayName).toBe('TestUser');
        expect(profile.avatarUrl).toBe('https://example.com/avatar.jpg');
        expect(profile.bio).toBe('Test bio');
        expect(profile.location).toBe('Stockholm');
        expect(profile.contact.email).toBe('test@example.com');
        expect(profile.contact.phone).toBe('+46701234567');
        expect(profile.customFields).toEqual({
          company: 'Test AB',
          department: 'IT'
        });
      }
    });

    it('ska skapa en giltig profil med endast obligatoriska fält', () => {
      const result = UserProfile.create({
        firstName: 'Test',
        lastName: 'User',
        contact: {
          email: 'test@example.com'
        }
      });
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const profile = result.getValue();
        expect(profile.firstName).toBe('Test');
        expect(profile.lastName).toBe('User');
        expect(profile.displayName).toBeNull();
        expect(profile.avatarUrl).toBeNull();
        expect(profile.bio).toBeNull();
        expect(profile.location).toBeNull();
        expect(profile.contact.email).toBe('test@example.com');
        expect(profile.contact.phone).toBeNull();
        expect(profile.contact.alternativeEmail).toBeNull();
        expect(profile.customFields).toEqual({});
      }
    });

    it('ska returnera fel för tomt förnamn', () => {
      const result = UserProfile.create({
        ...validProfileProps,
        firstName: ''
      });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.getError()).toBe('Förnamn kan inte vara tomt');
      }
    });

    it('ska returnera fel för tomt efternamn', () => {
      const result = UserProfile.create({
        ...validProfileProps,
        lastName: ''
      });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.getError()).toBe('Efternamn kan inte vara tomt');
      }
    });

    it('ska trimma whitespace från textfält', () => {
      const result = UserProfile.create({
        ...validProfileProps,
        firstName: '  Test  ',
        lastName: '  User  ',
        displayName: '  TestUser  ',
        bio: '  Test bio  '
      });
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const profile = result.getValue();
        expect(profile.firstName).toBe('Test');
        expect(profile.lastName).toBe('User');
        expect(profile.displayName).toBe('TestUser');
        expect(profile.bio).toBe('Test bio');
      }
    });
  });
}); 