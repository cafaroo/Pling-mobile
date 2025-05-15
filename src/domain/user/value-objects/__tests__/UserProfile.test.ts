import { UserProfile, UserProfileProps, SocialLinks } from '../UserProfile';
import '@testing-library/jest-dom';
import { ok, err } from '@/shared/core/Result';

describe('UserProfile', () => {
  const validProfileProps: UserProfileProps = {
    firstName: 'Johan',
    lastName: 'Andersson',
    displayName: 'JohanA',
    bio: 'En kort beskrivning om mig',
    location: 'Stockholm',
    interests: ['programmering', 'löpning'],
    socialLinks: {
      website: 'https://example.com',
      twitter: 'https://twitter.com/johan'
    }
  };

  it('ska skapa ett giltigt UserProfile-objekt', () => {
    const profileResult = UserProfile.create(validProfileProps);
    expect(profileResult.isOk()).toBe(true);
    
    if (profileResult.isOk()) {
      const profile = profileResult.value;
      expect(profile.props.firstName).toBe('Johan');
      expect(profile.props.lastName).toBe('Andersson');
      expect(profile.props.displayName).toBe('JohanA');
      expect(profile.fullName).toBe('Johan Andersson');
      expect(profile.props.interests).toEqual(['programmering', 'löpning']);
    }
  });
  
  it('ska hantera trimning av strängfält', () => {
    const profileResult = UserProfile.create({
      firstName: '  Johan  ',
      lastName: '  Andersson  ',
      displayName: '  JohanA  ',
      bio: '  En kort beskrivning  ',
      location: '  Stockholm  '
    });
    
    expect(profileResult.isOk()).toBe(true);
    
    if (profileResult.isOk()) {
      const profile = profileResult.value;
      expect(profile.props.firstName).toBe('Johan');
      expect(profile.props.lastName).toBe('Andersson');
      expect(profile.props.displayName).toBe('JohanA');
      expect(profile.props.bio).toBe('En kort beskrivning');
      expect(profile.props.location).toBe('Stockholm');
    }
  });
  
  it('ska returnera fullständigt namn', () => {
    const profileResult = UserProfile.create({
      firstName: 'Johan',
      lastName: 'Andersson'
    });
    
    expect(profileResult.isOk()).toBe(true);
    
    if (profileResult.isOk()) {
      const profile = profileResult.value;
      expect(profile.fullName).toBe('Johan Andersson');
    }
  });
  
  it('ska misslyckas för tomt förnamn', () => {
    const profileResult = UserProfile.create({
      firstName: '',
      lastName: 'Andersson'
    });
    
    expect(profileResult.isOk()).toBe(false);
    expect(profileResult.isErr()).toBe(true);
    
    if (profileResult.isErr()) {
      expect(profileResult.error).toContain('Förnamn är obligatoriskt');
    }
  });
  
  it('ska misslyckas för tomt efternamn', () => {
    const profileResult = UserProfile.create({
      firstName: 'Johan',
      lastName: ''
    });
    
    expect(profileResult.isOk()).toBe(false);
    expect(profileResult.isErr()).toBe(true);
    
    if (profileResult.isErr()) {
      expect(profileResult.error).toContain('Efternamn är obligatoriskt');
    }
  });
  
  it('ska misslyckas för för kort visningsnamn', () => {
    const profileResult = UserProfile.create({
      firstName: 'Johan',
      lastName: 'Andersson',
      displayName: 'J'
    });
    
    expect(profileResult.isOk()).toBe(false);
    expect(profileResult.isErr()).toBe(true);
    
    if (profileResult.isErr()) {
      expect(profileResult.error).toContain('Visningsnamn måste vara minst 2 tecken');
    }
  });
  
  it('ska misslyckas för för lång bio', () => {
    // Skapa en bio som är längre än 500 tecken
    const longBio = 'a'.repeat(501);
    
    const profileResult = UserProfile.create({
      firstName: 'Johan',
      lastName: 'Andersson',
      bio: longBio
    });
    
    expect(profileResult.isOk()).toBe(false);
    expect(profileResult.isErr()).toBe(true);
    
    if (profileResult.isErr()) {
      expect(profileResult.error).toContain('Bio får inte vara längre än 500 tecken');
    }
  });
  
  it('ska misslyckas för för många intressen', () => {
    const tooManyInterests = [
      'intresse1', 'intresse2', 'intresse3', 'intresse4', 'intresse5',
      'intresse6', 'intresse7', 'intresse8', 'intresse9', 'intresse10', 'intresse11'
    ];
    
    const profileResult = UserProfile.create({
      firstName: 'Johan',
      lastName: 'Andersson',
      interests: tooManyInterests
    });
    
    expect(profileResult.isOk()).toBe(false);
    expect(profileResult.isErr()).toBe(true);
    
    if (profileResult.isErr()) {
      expect(profileResult.error).toContain('Max 10 intressen är tillåtna');
    }
  });
  
  it('ska misslyckas för ogiltiga URL:er i socialLinks', () => {
    const profileResult = UserProfile.create({
      firstName: 'Johan',
      lastName: 'Andersson',
      socialLinks: {
        website: 'invalid-url'
      }
    });
    
    expect(profileResult.isOk()).toBe(false);
    expect(profileResult.isErr()).toBe(true);
    
    if (profileResult.isErr()) {
      expect(profileResult.error).toContain('Ogiltig URL');
    }
  });
  
  it('ska kunna uppdatera profilen med update-metoden', () => {
    const profileResult = UserProfile.create(validProfileProps);
    expect(profileResult.isOk()).toBe(true);
    
    if (profileResult.isOk()) {
      const profile = profileResult.value;
      const updatedProfileResult = profile.update({
        bio: 'En uppdaterad beskrivning',
        location: 'Göteborg'
      });
      
      expect(updatedProfileResult.isOk()).toBe(true);
      
      if (updatedProfileResult.isOk()) {
        const updatedProfile = updatedProfileResult.value;
        expect(updatedProfile.props.bio).toBe('En uppdaterad beskrivning');
        expect(updatedProfile.props.location).toBe('Göteborg');
        expect(updatedProfile.props.firstName).toBe('Johan'); // Oförändrat
        expect(updatedProfile.props.lastName).toBe('Andersson'); // Oförändrat
      }
    }
  });
  
  it('ska kunna kontrollera om profilen har en avatar', () => {
    const profileWithAvatar = UserProfile.create({
      ...validProfileProps,
      avatarUrl: 'https://example.com/avatar.jpg'
    });
    
    const profileWithoutAvatar = UserProfile.create({
      ...validProfileProps,
      avatarUrl: undefined
    });
    
    expect(profileWithAvatar.isOk() && profileWithoutAvatar.isOk()).toBe(true);
    
    if (profileWithAvatar.isOk() && profileWithoutAvatar.isOk()) {
      expect(profileWithAvatar.value.hasAvatar()).toBe(true);
      expect(profileWithoutAvatar.value.hasAvatar()).toBe(false);
    }
  });
  
  it('ska kunna kontrollera om profilen har en bio', () => {
    const profileWithBio = UserProfile.create({
      ...validProfileProps,
      bio: 'En bio'
    });
    
    const profileWithoutBio = UserProfile.create({
      ...validProfileProps,
      bio: ''
    });
    
    expect(profileWithBio.isOk() && profileWithoutBio.isOk()).toBe(true);
    
    if (profileWithBio.isOk() && profileWithoutBio.isOk()) {
      expect(profileWithBio.value.hasBio()).toBe(true);
      expect(profileWithoutBio.value.hasBio()).toBe(false);
    }
  });
  
  it('ska returnera intressen eller tom array', () => {
    const profileWithInterests = UserProfile.create({
      ...validProfileProps,
      interests: ['programmering', 'löpning']
    });
    
    const profileWithoutInterests = UserProfile.create({
      ...validProfileProps,
      interests: undefined
    });
    
    expect(profileWithInterests.isOk() && profileWithoutInterests.isOk()).toBe(true);
    
    if (profileWithInterests.isOk() && profileWithoutInterests.isOk()) {
      expect(profileWithInterests.value.interests).toEqual(['programmering', 'löpning']);
      expect(profileWithoutInterests.value.interests).toEqual([]);
    }
  });
  
  it('ska jämföra två identiska profiler som lika', () => {
    const profile1Result = UserProfile.create(validProfileProps);
    const profile2Result = UserProfile.create(validProfileProps);
    
    expect(profile1Result.isOk() && profile2Result.isOk()).toBe(true);
    
    if (profile1Result.isOk() && profile2Result.isOk()) {
      const profile1 = profile1Result.value;
      const profile2 = profile2Result.value;
      
      expect(profile1.equals(profile2)).toBe(true);
    }
  });
  
  it('ska jämföra två olika profiler som olika', () => {
    const profile1Result = UserProfile.create(validProfileProps);
    const profile2Result = UserProfile.create({
      ...validProfileProps,
      firstName: 'Anna'
    });
    
    expect(profile1Result.isOk() && profile2Result.isOk()).toBe(true);
    
    if (profile1Result.isOk() && profile2Result.isOk()) {
      const profile1 = profile1Result.value;
      const profile2 = profile2Result.value;
      
      expect(profile1.equals(profile2)).toBe(false);
    }
  });
  
  it('ska returnera korrekta primitiva värden med toValue-metoden', () => {
    const profileResult = UserProfile.create(validProfileProps);
    expect(profileResult.isOk()).toBe(true);
    
    if (profileResult.isOk()) {
      const profile = profileResult.value;
      const valueObject = profile.toValue();
      
      expect(valueObject).toEqual(validProfileProps);
      expect(valueObject).not.toBe(validProfileProps); // Ska vara en kopia, inte samma referens
      expect(valueObject.interests).not.toBe(validProfileProps.interests); // Djup kopia av array
      expect(valueObject.socialLinks).not.toBe(validProfileProps.socialLinks); // Djup kopia av objekt
    }
  });
  
  it('ska returnera korrekt DTO-objekt med toDTO-metoden', () => {
    const profileResult = UserProfile.create(validProfileProps);
    expect(profileResult.isOk()).toBe(true);
    
    if (profileResult.isOk()) {
      const profile = profileResult.value;
      const dto = profile.toDTO();
      
      expect(dto.firstName).toBe('Johan');
      expect(dto.lastName).toBe('Andersson');
      expect(dto.displayName).toBe('JohanA');
      expect(dto.fullName).toBe('Johan Andersson');
      expect(dto.bio).toBe('En kort beskrivning om mig');
      expect(dto.location).toBe('Stockholm');
      expect(dto.interests).toEqual(['programmering', 'löpning']);
      expect(dto.socialLinks).toEqual(validProfileProps.socialLinks);
      expect(dto.socialLinks).not.toBe(validProfileProps.socialLinks); // Djup kopia
    }
  });
}); 