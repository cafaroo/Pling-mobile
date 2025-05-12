import { ResourcePermission, ResourcePermissionLabels, DefaultRoleResourcePermissions } from '../value-objects/ResourcePermission';
import { OrganizationRole } from '../value-objects/OrganizationRole';

describe('ResourcePermission', () => {
  test('ResourcePermission_ShouldHaveCorrectLabels', () => {
    // Alla behörigheter ska ha en svensk etikett
    Object.values(ResourcePermission).forEach(permission => {
      expect(ResourcePermissionLabels[permission]).toBeDefined();
      expect(typeof ResourcePermissionLabels[permission]).toBe('string');
      expect(ResourcePermissionLabels[permission].length).toBeGreaterThan(0);
    });

    // Kontrollera några specifika etiketter
    expect(ResourcePermissionLabels[ResourcePermission.VIEW]).toBe('Visa');
    expect(ResourcePermissionLabels[ResourcePermission.EDIT]).toBe('Redigera');
    expect(ResourcePermissionLabels[ResourcePermission.DELETE]).toBe('Ta bort');
  });

  test('DefaultRoleResourcePermissions_ShouldBeConsistent', () => {
    // Alla roller ska ha definierade standardbehörigheter
    Object.values(OrganizationRole).forEach(role => {
      expect(DefaultRoleResourcePermissions[role]).toBeDefined();
      expect(Array.isArray(DefaultRoleResourcePermissions[role])).toBe(true);
    });

    // Ägare ska ha alla behörigheter
    const ownerPermissions = DefaultRoleResourcePermissions[OrganizationRole.OWNER];
    Object.values(ResourcePermission).forEach(permission => {
      expect(ownerPermissions).toContain(permission);
    });

    // Admin ska ha de flesta behörigheter men inte ägarbyte
    const adminPermissions = DefaultRoleResourcePermissions[OrganizationRole.ADMIN];
    expect(adminPermissions).toContain(ResourcePermission.EDIT);
    expect(adminPermissions).toContain(ResourcePermission.DELETE);
    expect(adminPermissions).not.toContain(ResourcePermission.CHANGE_OWNER);

    // Medlemmar ska ha visningsbehörighet
    const memberPermissions = DefaultRoleResourcePermissions[OrganizationRole.MEMBER];
    expect(memberPermissions).toContain(ResourcePermission.VIEW);
    expect(memberPermissions).not.toContain(ResourcePermission.EDIT);
    expect(memberPermissions).not.toContain(ResourcePermission.DELETE);

    // Inbjudna ska inte ha några behörigheter
    expect(DefaultRoleResourcePermissions[OrganizationRole.INVITED].length).toBe(0);
  });

  test('ResourcePermission_ShouldHaveConsistentStructure', () => {
    // Säkerställ att alla behörigheter har etiketter
    expect(Object.keys(ResourcePermission).length).toBe(Object.keys(ResourcePermissionLabels).length);
  });
}); 