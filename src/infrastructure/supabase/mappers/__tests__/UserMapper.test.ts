import { UserMapper } from '../UserMapper';
import { User } from '@/domain/user/entities/User';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { UserSettings } from '@/domain/user/entities/UserSettings';
import { UserProfile } from '@/domain/user/entities/UserProfile';
import { Email } from '@/domain/user/value-objects/Email';
import { PhoneNumber } from '@/domain/user/value-objects/PhoneNumber';

// Hjälpfunktion för att skapa mockade ok-resultat
const mockOkResult = (value) => ({
  isOk: () => true,
  isErr: () => false,
  value,
  getValue: () => value,
  error: null,
  unwrap: () => value
});

// Hjälpfunktion för att skapa mockade err-resultat
const mockErrResult = (error) => ({
  isOk: () => false,
  isErr: () => true,
  value: null,
  error,
  getValue: () => { throw new Error(error); },
  unwrap: () => { throw new Error(error); }
});

// Mock av Result för att användas i tester
jest.mock('@/shared/core/Result', () => {
  const original = jest.requireActual('@/shared/core/Result');
  
  return {
    ...original,
    ok: jest.fn().mockImplementation(value => ({
      isOk: () => true,
      isErr: () => false,
      value,
      getValue: () => value,
      error: null,
      unwrap: () => value
    })),
    err: jest.fn().mockImplementation(error => ({
      isOk: () => false,
      isErr: () => true,
      value: null,
      error,
      getValue: () => { throw new Error(error); },
      unwrap: () => { throw new Error(error); }
    }))
  };
});

// Mock av UniqueId
jest.mock('@/shared/core/UniqueId', () => {
  return {
    UniqueId: jest.fn().mockImplementation((id) => ({
      toString: () => id,
      equals: (other) => other && other.toString() === id,
      value: id
    }))
  };
});

// Mocka User och relaterade domänentiteter
jest.mock('@/domain/user/entities/User', () => {
  return {
    User: {
      create: jest.fn().mockImplementation(props => {
        if (!props.email || !props.id) {
          return mockErrResult('Användare måste ha id och email');
        }
        return mockOkResult({
          id: props.id,
          email: props.email,
          name: props.name || 'Default Name',
          phone: props.phone || null,
          profile: props.profile || {},
          settings: props.settings || {},
          teamIds: props.teamIds || [],
          roleIds: props.roleIds || [],
          status: props.status || 'active',
          createdAt: props.createdAt || new Date(),
          updatedAt: props.updatedAt || new Date(),
          toString: () => `User(${props.id.toString()})`,
          domainEvents: [],
          clearDomainEvents: jest.fn()
        });
      })
    }
  };
});

jest.mock('@/domain/user/entities/UserProfile', () => {
  return {
    UserProfile: {
      create: jest.fn().mockImplementation(props => {
        return mockOkResult({
          ...props,
          toString: () => `UserProfile(${props.firstName} ${props.lastName})`
        });
      })
    }
  };
});

jest.mock('@/domain/user/entities/UserSettings', () => {
  return {
    UserSettings: {
      create: jest.fn().mockImplementation(props => {
        return mockOkResult({
          ...props,
          toString: () => `UserSettings(${props.theme})`
        });
      })
    }
  };
});

jest.mock('@/domain/user/value-objects/Email', () => {
  return {
    Email: {
      create: jest.fn().mockImplementation(email => {
        if (email === 'invalid@email') {
          return mockErrResult('Ogiltig e-post');
        }
        return mockOkResult({
          value: email,
          toString: () => email
        });
      })
    }
  };
});

jest.mock('@/domain/user/value-objects/PhoneNumber', () => {
  return {
    PhoneNumber: {
      create: jest.fn().mockImplementation(phone => {
        if (phone === 'invalid-phone') {
          return mockErrResult('Ogiltigt telefonnummer');
        }
        return mockOkResult({
          value: phone,
          toString: () => phone
        });
      })
    }
  };
});

describe('UserMapper', () => {
  const mockUserData = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    phone: '+46701234567',
    settings: {
      theme: 'light',
      language: 'sv',
      notifications: {
        email: true,
        push: true,
        sms: false,
        frequency: 'daily'
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false
      }
    },
    profile: {
      firstName: 'Test',
      lastName: 'User',
      displayName: 'TestUser',
      bio: 'Test bio',
      location: 'Stockholm',
      contact: {
        email: 'test@example.com',
        phone: '+46701234567'
      }
    },
    created_at: '2024-03-21T12:00:00Z',
    updated_at: '2024-03-21T12:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toDomain', () => {
    it('ska konvertera DTO till domänentitet', () => {
      const result = UserMapper.toDomain(mockUserData);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const user = result.value;
        expect(user.id.toString()).toBe(mockUserData.id);
        expect(user.email.toString()).toBe(mockUserData.email);
        expect(user.name).toBe(mockUserData.name);
        expect(user.phone?.toString()).toBe(mockUserData.phone);
      }
    });

    it('ska hantera saknade valfria fält', () => {
      const partialData = {
        id: mockUserData.id,
        email: mockUserData.email
      };

      const result = UserMapper.toDomain(partialData);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const user = result.value;
        expect(user.id.toString()).toBe(partialData.id);
        expect(user.email.toString()).toBe(partialData.email);
        // Standardvärden ska användas för saknade fält
        expect(user.phone).toBeNull();
        expect(user.settings).toBeDefined();
        expect(user.profile).toBeDefined();
      }
    });

    it('ska returnera fel för ogiltig data', () => {
      const invalidData = {
        id: 'invalid-id',
        email: 'invalid@email', // Denna kommer att trigga fel enligt vår mock
        name: 'Test User'
      };

      const result = UserMapper.toDomain(invalidData);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('toPersistence', () => {
    it('ska konvertera domänentitet till DTO', () => {
      // Först skapar vi en användare via toDomain
      const domainResult = UserMapper.toDomain(mockUserData);
      expect(domainResult.isOk()).toBe(true);
      
      // Sedan konverterar vi tillbaka till DTO via toPersistence
      const user = domainResult.value;
      const dto = UserMapper.toPersistence(user);

      // Verifiera att data bevaras
      expect(dto.id).toBe(mockUserData.id);
      expect(dto.email).toBe(mockUserData.email);
      expect(dto.name).toBe(mockUserData.name);
      expect(dto.phone).toBe(mockUserData.phone);
      
      // Verifiera att inställningar och profil bevaras
      expect(dto.settings.theme).toBe(mockUserData.settings.theme);
      expect(dto.settings.language).toBe(mockUserData.settings.language);
      expect(dto.profile.firstName).toBe(mockUserData.profile.firstName);
      expect(dto.profile.lastName).toBe(mockUserData.profile.lastName);
    });

    it('ska hantera null-värden', () => {
      // Skapa en användare med minsta möjliga data
      const minimalData = {
        id: mockUserData.id,
        email: mockUserData.email
      };
      
      const result = UserMapper.toDomain(minimalData);
      expect(result.isOk()).toBe(true);
      const user = result.value;

      const dto = UserMapper.toPersistence(user);

      expect(dto.id).toBe(minimalData.id);
      expect(dto.email).toBe(minimalData.email);
      expect(dto.phone).toBeNull();
    });
  });

  describe('toDTO', () => {
    it('ska konvertera domänentitet till DTO för API', () => {
      // Skapa en användare via toDomain
      const domainResult = UserMapper.toDomain(mockUserData);
      expect(domainResult.isOk()).toBe(true);
      const user = domainResult.value;

      // Konvertera till API-DTO
      const dto = UserMapper.toDTO(user);

      // Verifiera att data bevaras
      expect(dto.id).toBe(mockUserData.id);
      expect(dto.email).toBe(mockUserData.email);
      expect(dto.name).toBe(mockUserData.name);
    });

    it('ska exkludera känslig information', () => {
      // Skapa en användare via toDomain
      const domainResult = UserMapper.toDomain(mockUserData);
      expect(domainResult.isOk()).toBe(true);
      const user = domainResult.value;
      
      // Lägger till en känslig egenskap
      user.settings.secretKey = 'sensitive-data';

      const dto = UserMapper.toDTO(user);

      // Verifiera att känslig information är borttagen
      expect(dto.settings).not.toHaveProperty('secretKey');
    });
  });
}); 