import { UserMapper } from '../UserMapper';
import { User } from '@/domain/user/entities/User';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result } from '@/shared/core/Result';
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

// Mocka domänklasser
jest.mock('@/domain/user/entities/User', () => {
  return {
    User: {
      create: jest.fn().mockImplementation(props => {
        return mockOkResult({
          id: props.id,
          email: props.email,
          name: props.name,
          phone: props.phone,
          profile: props.profile,
          settings: props.settings,
          teamIds: props.teamIds || [],
          roleIds: props.roleIds || [],
          status: props.status || 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          toString: () => props.id.toString()
        });
      })
    }
  };
});

jest.mock('@/domain/user/entities/UserProfile', () => {
  return {
    UserProfile: {
      create: jest.fn().mockImplementation(props => {
        return mockOkResult(props);
      })
    }
  };
});

jest.mock('@/domain/user/entities/UserSettings', () => {
  return {
    UserSettings: {
      create: jest.fn().mockImplementation(props => {
        return mockOkResult(props);
      })
    }
  };
});

jest.mock('@/domain/user/value-objects/Email', () => {
  return {
    Email: {
      create: jest.fn().mockImplementation(email => {
        if (email === 'invalid-email') {
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
        email: mockUserData.email,
        name: mockUserData.name,
        created_at: mockUserData.created_at,
        updated_at: mockUserData.updated_at
      };

      const result = UserMapper.toDomain(partialData);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const user = result.value;
        expect(user.phone).toBeNull();
        expect(user.settings).toBeDefined();
        expect(user.profile).toBeDefined();
      }
    });

    it('ska returnera fel för ogiltig data', () => {
      const invalidData = {
        id: 'invalid-id',
        email: 'invalid-email',
        name: '',
        created_at: 'invalid-date',
        updated_at: 'invalid-date'
      };

      const result = UserMapper.toDomain(invalidData);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('toPersistence', () => {
    it('ska konvertera domänentitet till DTO', () => {
      // Först skapar vi en användare via UserMapper.toDomain
      const domainResult = UserMapper.toDomain(mockUserData);
      expect(domainResult.isOk()).toBe(true);
      const user = domainResult.value;

      // Sedan konverterar vi tillbaka till DTO
      const dto = UserMapper.toPersistence(user);

      expect(dto.id).toBe(mockUserData.id);
      expect(dto.email).toBe(mockUserData.email);
      expect(dto.name).toBe(mockUserData.name);
      expect(dto.phone).toBe(mockUserData.phone);
    });

    it('ska hantera null-värden', () => {
      // Skapa en användare med minsta möjliga data
      const minimalData = {
        id: mockUserData.id,
        email: mockUserData.email,
        name: mockUserData.name
      };
      
      const userResult = UserMapper.toDomain(minimalData);
      expect(userResult.isOk()).toBe(true);
      const user = userResult.value;

      const dto = UserMapper.toPersistence(user);

      expect(dto.phone).toBeNull();
      expect(dto.settings).toBeDefined();
      expect(dto.profile).toBeDefined();
    });
  });

  describe('toDTO', () => {
    it('ska konvertera domänentitet till DTO för API', () => {
      // Först skapar vi en användare via UserMapper.toDomain
      const domainResult = UserMapper.toDomain(mockUserData);
      expect(domainResult.isOk()).toBe(true);
      const user = domainResult.value;

      // Sedan konverterar vi till API-DTO
      const dto = UserMapper.toDTO(user);

      expect(dto.id).toBe(mockUserData.id);
      expect(dto.email).toBe(mockUserData.email);
      expect(dto.name).toBe(mockUserData.name);
      expect(dto.phone).toBe(mockUserData.phone);
    });

    it('ska exkludera känslig information', () => {
      // Skapa en användare
      const domainResult = UserMapper.toDomain(mockUserData);
      expect(domainResult.isOk()).toBe(true);
      const user = domainResult.value;
      
      // Lägger till en känslig egenskap manuellt innan test
      user.settings.secretKey = 'sensitive-data';

      const dto = UserMapper.toDTO(user);

      expect(dto.settings).not.toHaveProperty('secretKey');
    });
  });
}); 