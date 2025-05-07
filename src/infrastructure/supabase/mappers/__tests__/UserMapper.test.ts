import { UserMapper } from '../UserMapper';
import { User } from '@/domain/user/entities/User';
import { UniqueId } from '@/shared/domain/UniqueId';

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

  describe('toDomain', () => {
    it('ska konvertera DTO till domänentitet', () => {
      const result = UserMapper.toDomain(mockUserData);
      
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const user = result.value;
        expect(user.id.toString()).toBe(mockUserData.id);
        expect(user.email).toBe(mockUserData.email);
        expect(user.name).toBe(mockUserData.name);
        expect(user.phone).toBe(mockUserData.phone);
        expect(user.settings).toEqual(mockUserData.settings);
        expect(user.profile).toEqual(mockUserData.profile);
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
        expect(user.settings).toBeDefined(); // Ska använda standardvärden
        expect(user.profile).toBeDefined(); // Ska använda standardvärden
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
      const user = User.create({
        id: new UniqueId(mockUserData.id),
        email: mockUserData.email,
        name: mockUserData.name,
        phone: mockUserData.phone,
        settings: mockUserData.settings,
        profile: mockUserData.profile
      }).value as User;

      const dto = UserMapper.toPersistence(user);

      expect(dto.id).toBe(mockUserData.id);
      expect(dto.email).toBe(mockUserData.email);
      expect(dto.name).toBe(mockUserData.name);
      expect(dto.phone).toBe(mockUserData.phone);
      expect(dto.settings).toEqual(mockUserData.settings);
      expect(dto.profile).toEqual(mockUserData.profile);
    });

    it('ska hantera null-värden', () => {
      const user = User.create({
        id: new UniqueId(mockUserData.id),
        email: mockUserData.email,
        name: mockUserData.name
      }).value as User;

      const dto = UserMapper.toPersistence(user);

      expect(dto.phone).toBeNull();
      expect(dto.settings).toBeDefined();
      expect(dto.profile).toBeDefined();
    });
  });

  describe('toDTO', () => {
    it('ska konvertera domänentitet till DTO för API', () => {
      const user = User.create({
        id: new UniqueId(mockUserData.id),
        email: mockUserData.email,
        name: mockUserData.name,
        phone: mockUserData.phone,
        settings: mockUserData.settings,
        profile: mockUserData.profile
      }).value as User;

      const dto = UserMapper.toDTO(user);

      expect(dto.id).toBe(mockUserData.id);
      expect(dto.email).toBe(mockUserData.email);
      expect(dto.name).toBe(mockUserData.name);
      expect(dto.phone).toBe(mockUserData.phone);
      expect(dto.settings).toEqual(mockUserData.settings);
      expect(dto.profile).toEqual(mockUserData.profile);
    });

    it('ska exkludera känslig information', () => {
      const user = User.create({
        id: new UniqueId(mockUserData.id),
        email: mockUserData.email,
        name: mockUserData.name,
        phone: mockUserData.phone,
        settings: {
          ...mockUserData.settings,
          secretKey: 'sensitive-data'
        },
        profile: mockUserData.profile
      }).value as User;

      const dto = UserMapper.toDTO(user);

      expect(dto.settings).not.toHaveProperty('secretKey');
    });
  });
}); 