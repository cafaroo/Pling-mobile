import { UserProfile } from '../UserProfile';
import '@testing-library/jest-dom';

describe('UserProfile', () => {
  const validProfileProps = {
    firstName: 'Test',
    lastName: 'User',
    displayName: 'TestUser',
    avatarUrl: 'https://example.com/avatar.jpg',
    bio: 'Test bio',
    location: 'Stockholm',
    socialLinks: {
      website: 'https://example.com',
      twitter: 'https://twitter.com/test',
      linkedin: 'https://linkedin.com/in/test'
    },
    interests: ['coding', 'testing']
  };

  describe('create', () => {
    it('ska skapa en giltig profil med alla fält', () => {
      const result = UserProfile.create(validProfileProps);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const profile = result.value;
        expect(profile.firstName).toBe('Test');
        expect(profile.lastName).toBe('User');
        expect(profile.displayName).toBe('TestUser');
        expect(profile.avatarUrl).toBe('https://example.com/avatar.jpg');
        expect(profile.bio).toBe('Test bio');
        expect(profile.location).toBe('Stockholm');
        expect(profile.socialLinks.website).toBe('https://example.com');
        expect(profile.interests).toEqual(['coding', 'testing']);
      }
    });

    it('ska skapa en giltig profil med endast obligatoriska fält', () => {
      const result = UserProfile.create({
        firstName: 'Test',
        lastName: 'User'
      });
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const profile = result.value;
        expect(profile.firstName).toBe('Test');
        expect(profile.lastName).toBe('User');
        expect(profile.displayName).toBeUndefined();
        expect(profile.avatarUrl).toBeUndefined();
        expect(profile.bio).toBeUndefined();
        expect(profile.location).toBeUndefined();
        expect(profile.interests).toEqual([]);
      }
    });

    it('ska returnera fel för tomt förnamn', () => {
      const result = UserProfile.create({
        ...validProfileProps,
        firstName: ''
      });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe('Förnamn är obligatoriskt');
      }
    });

    it('ska returnera fel för tomt efternamn', () => {
      const result = UserProfile.create({
        ...validProfileProps,
        lastName: ''
      });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBe('Efternamn är obligatoriskt');
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
        const profile = result.value;
        expect(profile.firstName).toBe('Test');
        expect(profile.lastName).toBe('User');
        expect(profile.displayName).toBe('TestUser');
        expect(profile.bio).toBe('Test bio');
      }
    });

    it('ska validera URL-format för sociala länkar', () => {
      const result = UserProfile.create({
        ...validProfileProps,
        socialLinks: {
          website: 'invalid-url'
        }
      });
      
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toContain('Ogiltig URL');
      }
    });
  });

  describe('update', () => {
    it('ska uppdatera profilen med nya värden', () => {
      const originalProfile = UserProfile.create(validProfileProps);
      expect(originalProfile.isOk()).toBe(true);
      
      if (originalProfile.isOk()) {
        const updateResult = originalProfile.value.update({
          bio: 'Updated bio',
          location: 'Göteborg'
        });
        
        expect(updateResult.isOk()).toBe(true);
        if (updateResult.isOk()) {
          const updatedProfile = updateResult.value;
          expect(updatedProfile.bio).toBe('Updated bio');
          expect(updatedProfile.location).toBe('Göteborg');
          // Originalvärdena ska fortfarande finnas kvar
          expect(updatedProfile.firstName).toBe('Test');
          expect(updatedProfile.lastName).toBe('User');
        }
      }
    });
  });
}); 