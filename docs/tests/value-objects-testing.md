# Testning av värde-objekt i Pling Mobile

Värde-objekt (Value Objects) representerar domänkoncept som definieras av sina attribut snarare än identitet. Denna guide beskriver hur man testar värde-objekt inom Pling Mobile-applikationen, med `UserProfile` som primärt exempel.

## Principer för värde-objekttestning

1. **Oföränderlighet (Immutability)** - Testa att värde-objekten inte kan modifieras efter skapande
2. **Validering** - Testa att alla valideringsregler upprätthålls
3. **Likhetsjämförelse** - Testa att `equals()`-metoden jämför baserat på värden
4. **Kopiering** - Testa att `copyWith()` och liknande metoder skapar nya instanser
5. **Transformation** - Testa metoder som transformerar värde-objektet till andra format

## Testmönster för värde-objekt

```typescript
describe('[VärdeObjektNamn]', () => {
  // Definiera testdata 
  const validData = { /* giltiga värden */ };
  
  describe('create', () => {
    it('ska skapa ett giltigt objekt med korrekta värden', () => {
      // Test av skapande med giltiga data
    });
    
    it('ska validera och returnera fel för ogiltiga värden', () => {
      // Test av validering
    });
    
    // Fler valideringstester för varje valideringsregel
  });
  
  describe('equals', () => {
    it('ska jämföra två instanser baserat på deras värden', () => {
      // Test av likhetsjämförelse
    });
  });
  
  describe('copyWith/update', () => {
    it('ska skapa en ny instans med uppdaterade värden', () => {
      // Test av kopiering med ändrade värden
    });
    
    it('ska bevara oförändrade värden', () => {
      // Test att värden som inte ändras bevaras
    });
  });
  
  describe('toValue/toDTO', () => {
    it('ska returnera primitiva värden korrekt', () => {
      // Test av serialisering/transformation
    });
  });
});
```

## Exempel: UserProfile

`UserProfile` är ett centralt värde-objekt som representerar användarens profilinformation. Nedan följer strategier för testning av detta värde-objekt med koden som implementerades i senaste refaktorering.

### 1. Test av skapande och validering

Tester för `create`-metoden som säkerställer att validering fungerar korrekt:

```typescript
describe('create', () => {
  it('ska skapa ett giltigt UserProfile-objekt', () => {
    const profileResult = UserProfile.create(validProfileProps);
    expect(profileResult.isOk()).toBe(true);
    
    if (profileResult.isOk()) {
      const profile = profileResult.value;
      expect(profile.props.firstName).toBe('Johan');
      expect(profile.props.lastName).toBe('Andersson');
      expect(profile.props.displayName).toBe('JohanA');
      expect(profile.fullName).toBe('Johan Andersson');
    }
  });
  
  it('ska misslyckas för tomt förnamn', () => {
    const profileResult = UserProfile.create({
      ...validProfileProps, 
      firstName: ''
    });
    
    expect(profileResult.isOk()).toBe(false);
    expect(profileResult.isErr()).toBe(true);
    
    if (profileResult.isErr()) {
      expect(profileResult.error).toContain('Förnamn är obligatoriskt');
    }
  });
  
  // Liknande tester för andra valideringsregler
});
```

### 2. Test av oföränderlighet och uppdatering

Tester som säkerställer att värde-objektet inte kan ändras, utan skapar nya instanser vid uppdatering:

```typescript
describe('update', () => {
  it('ska kunna uppdatera profilen med nya värden', () => {
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
        
        // Verifiera att det är en ny instans
        expect(updatedProfile).not.toBe(profile);
        
        // Verifiera uppdaterade värden
        expect(updatedProfile.props.bio).toBe('En uppdaterad beskrivning');
        expect(updatedProfile.props.location).toBe('Göteborg');
        
        // Verifiera oförändrade värden
        expect(updatedProfile.props.firstName).toBe(profile.props.firstName);
        expect(updatedProfile.props.lastName).toBe(profile.props.lastName);
      }
    }
  });
});
```

### 3. Test av likhetsjämförelse

Tester som verifierar `equals()`-metoden:

```typescript
describe('equals', () => {
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
});
```

### 4. Test av transformationsmetoder

Tester för `toValue()` och `toDTO()`:

```typescript
describe('toValue/toDTO', () => {
  it('ska returnera korrekta primitiva värden med toValue-metoden', () => {
    const profileResult = UserProfile.create(validProfileProps);
    
    if (profileResult.isOk()) {
      const profile = profileResult.value;
      const valueObject = profile.toValue();
      
      expect(valueObject).toEqual(validProfileProps);
      expect(valueObject).not.toBe(validProfileProps); // Ska vara en kopia
      expect(valueObject.interests).not.toBe(validProfileProps.interests); // Djup kopia
    }
  });
  
  it('ska returnera korrekt DTO-objekt med toDTO-metoden', () => {
    const profileResult = UserProfile.create(validProfileProps);
    
    if (profileResult.isOk()) {
      const profile = profileResult.value;
      const dto = profile.toDTO();
      
      expect(dto.firstName).toBe('Johan');
      expect(dto.lastName).toBe('Andersson');
      expect(dto.fullName).toBe('Johan Andersson');
      // Fler verifieringar...
    }
  });
});
```

## Integrationstestning med User Entity

Det är också viktigt att testa hur värde-objektet fungerar tillsammans med entiteter som använder det:

```typescript
describe('User med UserProfile', () => {
  it('ska uppdatera användarprofilen korrekt', () => {
    // Skapa en användare med profil
    const profileResult = UserProfile.create(validProfileProps);
    expect(profileResult.isOk()).toBe(true);
    
    if (profileResult.isOk()) {
      const user = User.create({
        email: Email.create('test@example.com').value,
        name: 'Test User',
        profile: profileResult.value
      }).value;
      
      // Uppdatera profilen
      const updatedProfileResult = UserProfile.create({
        ...validProfileProps,
        bio: 'Ny bio'
      });
      
      expect(updatedProfileResult.isOk()).toBe(true);
      
      if (updatedProfileResult.isOk()) {
        const result = user.updateProfile(updatedProfileResult.value);
        expect(result.isOk()).toBe(true);
        expect(user.profile?.props.bio).toBe('Ny bio');
      }
    }
  });
});
```

## Teststrategier för hantering av domänhändelser

När profilen uppdateras via en entitet bör domänhändelser utlösas korrekt:

```typescript
describe('Domänhändelser vid profiluppdatering', () => {
  it('ska publicera UserProfileUpdated-händelse när profilen uppdateras via User', () => {
    // Skapa en användare med profil
    const profileResult = UserProfile.create(validProfileProps);
    const user = User.create({
      email: Email.create('test@example.com').value,
      name: 'Test User',
      profile: profileResult.value
    }).value;
    
    // Rensa eventuella händelser från skapandet
    user.clearDomainEvents();
    
    // Uppdatera profilen
    const updatedProfileResult = UserProfile.create({
      ...validProfileProps,
      bio: 'Ny bio'
    });
    
    user.updateProfile(updatedProfileResult.value);
    
    // Verifiera att händelsen publicerades
    const events = user.getDomainEvents();
    expect(events.length).toBe(1);
    expect(events[0]).toBeInstanceOf(UserProfileUpdated);
    
    const event = events[0] as UserProfileUpdated;
    expect(event.userId).toEqual(user.id);
  });
});
```

## Testning av wrapper-klassen

När en wrapper-klass används för att upprätthålla bakåtkompatibilitet (som i vårt fall med UserProfile-värdeobjektet), bör detta testas separat:

```typescript
describe('UserProfile Entity Wrapper', () => {
  it('ska delegera create-metoden till värde-objektet', () => {
    const result = UserProfile.create(validProfileProps);
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const profile = result.value;
      expect(profile.firstName).toBe('Johan');
      expect(profile.lastName).toBe('Andersson');
      expect(profile.fullName).toBe('Johan Andersson');
    }
  });
  
  it('ska delegera update-metoden till värde-objektet', () => {
    const profileResult = UserProfile.create(validProfileProps);
    
    if (profileResult.isOk()) {
      const profile = profileResult.value;
      const updateResult = profile.update({ bio: 'Uppdaterad bio' });
      
      expect(updateResult.isOk()).toBe(true);
      if (updateResult.isOk()) {
        const updatedProfile = updateResult.value;
        expect(updatedProfile.bio).toBe('Uppdaterad bio');
      }
    }
  });
});
```

## Fördelar med omfattande värde-objekttestning

Genom att skriva omfattande tester för värde-objekt säkerställer vi:

1. **Domänintegritet** - Valideringsregler och domänlogik fungerar korrekt
2. **Oföränderlighet** - Värde-objekt kan inte modifieras, vilket minskar buggar
3. **Enklare debugging** - Fel i värde-objekt identifieras tidigt
4. **Dokumentation genom kod** - Testerna visar hur värde-objekten ska användas
5. **Tryggare refaktorering** - Ändra implementation utan att bryta beteendet

Eftersom domänlagret är kärnan i vår DDD-strategi ger robust testning av värde-objekt en solid grund för hela applikationen. 