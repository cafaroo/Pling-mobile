import { UserPermission, PermissionName, PermissionCategory } from '../UserPermission';
import '@testing-library/jest-dom';

describe('UserPermission', () => {
  describe('create', () => {
    it('ska skapa en giltig behörighet för existerande behörighetsnamn', () => {
      const result = UserPermission.create(PermissionName.MANAGE_USERS);
      expect(result.isOk()).toBe(true);
      
      if (result.isOk()) {
        const permission = result.value;
        expect(permission.name).toBe(PermissionName.MANAGE_USERS);
        expect(permission.category).toBe(PermissionCategory.USER);
      }
    });
    
    it('ska returnera fel för ogiltigt behörighetsnamn', () => {
      // @ts-ignore Testar ogiltigt behörighetsnamn
      const result = UserPermission.create('invalid_permission');
      expect(result.isErr()).toBe(true);
      
      if (result.isErr()) {
        expect(result.error.message).toContain('inte en giltig systembehörighet');
      }
    });
    
    it('ska återanvända samma objekt för samma behörighetsnamn', () => {
      const result1 = UserPermission.create(PermissionName.MANAGE_USERS);
      const result2 = UserPermission.create(PermissionName.MANAGE_USERS);
      
      expect(result1.isOk() && result2.isOk()).toBe(true);
      
      if (result1.isOk() && result2.isOk()) {
        const permission1 = result1.value;
        const permission2 = result2.value;
        
        // Ska vara exakt samma objektreferens
        expect(permission1).toBe(permission2);
      }
    });
  });
  
  describe('createAll och createForCategory', () => {
    it('ska skapa alla behörigheter i systemet', () => {
      const allPermissions = UserPermission.createAll();
      expect(allPermissions.length).toBe(Object.values(PermissionName).length);
      
      // Kontrollera att alla behörigheterna är unika
      const uniquePermissionNames = new Set(allPermissions.map(p => p.name));
      expect(uniquePermissionNames.size).toBe(allPermissions.length);
    });
    
    it('ska skapa behörigheter för en specifik kategori', () => {
      const teamPermissions = UserPermission.createForCategory(PermissionCategory.TEAM);
      
      // Det finns 4 team-behörigheter
      expect(teamPermissions.length).toBe(4);
      
      // Alla behörigheter ska ha team-kategorin
      for (const permission of teamPermissions) {
        expect(permission.category).toBe(PermissionCategory.TEAM);
      }
    });
  });
  
  describe('properties', () => {
    it('ska returnera korrekt kategori för en behörighet', () => {
      const manageUsers = UserPermission.create(PermissionName.MANAGE_USERS).value;
      expect(manageUsers.category).toBe(PermissionCategory.USER);
      
      const createTeam = UserPermission.create(PermissionName.CREATE_TEAM).value;
      expect(createTeam.category).toBe(PermissionCategory.TEAM);
    });
    
    it('ska returnera korrekt beskrivning för en behörighet', () => {
      const manageUsers = UserPermission.create(PermissionName.MANAGE_USERS).value;
      expect(manageUsers.description).toBe('Hantera alla användare och deras konton');
    });
  });
  
  describe('includes', () => {
    it('ska inkludera sig själv', () => {
      const manageUsers = UserPermission.create(PermissionName.MANAGE_USERS).value;
      expect(manageUsers.includes(manageUsers)).toBe(true);
    });
    
    it('ska korrekt hantera behörighetshierarkier', () => {
      const manageTeams = UserPermission.create(PermissionName.MANAGE_TEAMS).value;
      const createTeam = UserPermission.create(PermissionName.CREATE_TEAM).value;
      const joinTeam = UserPermission.create(PermissionName.JOIN_TEAM).value;
      
      // MANAGE_TEAMS inkluderar CREATE_TEAM och JOIN_TEAM
      expect(manageTeams.includes(createTeam)).toBe(true);
      expect(manageTeams.includes(joinTeam)).toBe(true);
      
      // CREATE_TEAM inkluderar inte JOIN_TEAM
      expect(createTeam.includes(joinTeam)).toBe(false);
    });
    
    it('ska hantera rekursiva behörighetshierarkier', () => {
      // Förbered så att MANAGE_CONTENT inkluderar EDIT_CONTENT som inkluderar VIEW_CONTENT
      const manageContent = UserPermission.create(PermissionName.MANAGE_CONTENT).value;
      const viewContent = UserPermission.create(PermissionName.VIEW_CONTENT).value;
      
      // MANAGE_CONTENT bör inkludera VIEW_CONTENT indirekt via EDIT_CONTENT
      expect(manageContent.includes(viewContent)).toBe(true);
    });
  });
  
  describe('utility methods', () => {
    it('ska skapa korrekt identifierare', () => {
      const manageUsers = UserPermission.create(PermissionName.MANAGE_USERS).value;
      expect(manageUsers.toIdentifier()).toBe('permission:manage_users');
    });
    
    it('ska konvertera till läsbar sträng', () => {
      const manageUsers = UserPermission.create(PermissionName.MANAGE_USERS).value;
      expect(manageUsers.toString()).toBe('Hantera alla användare och deras konton (manage_users)');
    });
    
    it('ska jämföra behörigheter korrekt', () => {
      const manageUsers1 = UserPermission.create(PermissionName.MANAGE_USERS).value;
      const manageUsers2 = UserPermission.create(PermissionName.MANAGE_USERS).value;
      const viewUsers = UserPermission.create(PermissionName.VIEW_USERS).value;
      
      expect(manageUsers1.equals(manageUsers2)).toBe(true);
      expect(manageUsers1.equals(viewUsers)).toBe(false);
    });
  });
}); 