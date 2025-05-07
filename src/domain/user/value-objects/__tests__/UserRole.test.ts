import { UserRole } from '../UserRole';

describe('UserRole', () => {
  describe('create', () => {
    it('ska skapa en giltig UserRole för definierade roller', () => {
      const validRoles = [UserRole.ADMIN, UserRole.MODERATOR, UserRole.USER];
      
      validRoles.forEach(role => {
        const result = UserRole.create(role);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.getValue().value).toBe(role);
        }
      });
    });

    it('ska returnera ett fel för ogiltig roll', () => {
      const result = UserRole.create('invalid_role');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.getError().message).toContain('Ogiltig användarroll');
      }
    });
  });

  describe('permissions', () => {
    it('ska returnera korrekta behörigheter för admin', () => {
      const result = UserRole.create(UserRole.ADMIN);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const role = result.getValue();
        expect(role.permissions).toContain('manage_users');
        expect(role.permissions).toContain('manage_teams');
        expect(role.permissions).toContain('manage_content');
        expect(role.permissions).toContain('manage_settings');
        expect(role.permissions).toContain('view_analytics');
      }
    });

    it('ska returnera korrekta behörigheter för moderator', () => {
      const result = UserRole.create(UserRole.MODERATOR);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const role = result.getValue();
        expect(role.permissions).toContain('manage_content');
        expect(role.permissions).toContain('view_analytics');
        expect(role.permissions).not.toContain('manage_users');
      }
    });

    it('ska returnera korrekta behörigheter för användare', () => {
      const result = UserRole.create(UserRole.USER);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const role = result.getValue();
        expect(role.permissions).toContain('manage_profile');
        expect(role.permissions).toContain('join_teams');
        expect(role.permissions).not.toContain('manage_users');
      }
    });
  });

  describe('hasPermission', () => {
    it('ska korrekt kontrollera specifika behörigheter', () => {
      const adminResult = UserRole.create(UserRole.ADMIN);
      const userResult = UserRole.create(UserRole.USER);

      expect(adminResult.isOk() && userResult.isOk()).toBe(true);
      if (adminResult.isOk() && userResult.isOk()) {
        const admin = adminResult.getValue();
        const user = userResult.getValue();

        expect(admin.hasPermission('manage_users')).toBe(true);
        expect(user.hasPermission('manage_users')).toBe(false);
        expect(user.hasPermission('manage_profile')).toBe(true);
      }
    });
  });

  describe('role checks', () => {
    it('ska korrekt identifiera olika roller', () => {
      const roles = [
        { type: UserRole.ADMIN, check: 'isAdmin' },
        { type: UserRole.MODERATOR, check: 'isModerator' }
      ];

      roles.forEach(({ type, check }) => {
        const result = UserRole.create(type);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const role = result.getValue();
          expect(role[check]()).toBe(true);
        }
      });
    });
  });
}); 