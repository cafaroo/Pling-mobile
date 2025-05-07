# Testguide för Behörigheter och Roller

## Översikt

Detta dokument beskriver mönster och best practices för testning av behörighetsrelaterad logik med `UserPermission` och `UserRole` i Pling-applikationen. Dessa värde-objekt kräver särskilda teststrategier på grund av deras komplexa natur och hierarkiska struktur.

## Innehållsförteckning

1. [Testning av UserPermission](#testning-av-userpermission)
2. [Testning av UserRole](#testning-av-userrole)
3. [Integrationstest för behörigheter](#integrationstest-för-behörigheter)
4. [Testning av behörighetslogik i användarfall](#testning-av-behörighetslogik-i-användarfall)
5. [Exempel](#exempel)

## Testning av UserPermission

### Grundläggande struktur

```typescript
import { UserPermission } from '@/domain/user/value-objects/UserPermission';
import { expectResultOk, expectResultErr } from '@/test-utils/error-helpers';

describe('UserPermission', () => {
  describe('create', () => {
    it('ska skapa en giltig behörighet', () => {
      // Arrange & Act
      const result = UserPermission.create('team.admin.create');
      
      // Assert
      expectResultOk(result);
      expect(result.value.category).toBe('team');
      expect(result.value.resource).toBe('admin');
      expect(result.value.action).toBe('create');
    });
    
    it('ska returnera fel för ogiltig behörighet', () => {
      // Arrange & Act
      const result = UserPermission.create('invalid_format');
      
      // Assert
      expectResultErr(result, 'INVALID_PERMISSION_FORMAT');
    });
  });
  
  describe('isEqual', () => {
    it('ska jämföra två behörigheter korrekt', () => {
      // Arrange
      const permission1 = UserPermission.create('team.member.read').value;
      const permission2 = UserPermission.create('team.member.read').value;
      const permission3 = UserPermission.create('team.admin.read').value;
      
      // Act & Assert
      expect(permission1.isEqual(permission2)).toBe(true);
      expect(permission1.isEqual(permission3)).toBe(false);
    });
  });
  
  describe('contains', () => {
    it('ska hantera wildcard-behörigheter korrekt', () => {
      // Arrange
      const wildcard = UserPermission.create('team.*.*').value;
      const specific = UserPermission.create('team.member.read').value;
      
      // Act & Assert
      expect(wildcard.contains(specific)).toBe(true);
      expect(specific.contains(wildcard)).toBe(false);
    });
  });
});
```

### Testning av hierarkier

När du testar hierarkiska behörigheter, använd följande mönster:

```typescript
describe('hierarkier', () => {
  it('ska hantera hierarkiska behörigheter korrekt', () => {
    // Arrange
    const adminAll = UserPermission.create('*.*.*').value;
    const teamAll = UserPermission.create('team.*.*').value;
    const teamAdminAll = UserPermission.create('team.admin.*').value;
    const teamMemberRead = UserPermission.create('team.member.read').value;
    
    // Act & Assert
    expect(adminAll.contains(teamAll)).toBe(true);
    expect(teamAll.contains(teamAdminAll)).toBe(true);
    expect(teamAdminAll.contains(teamMemberRead)).toBe(false);
    expect(teamAll.contains(teamMemberRead)).toBe(true);
  });
});
```

## Testning av UserRole

### Grundläggande struktur

```typescript
import { UserRole } from '@/domain/user/value-objects/UserRole';
import { UserPermission } from '@/domain/user/value-objects/UserPermission';
import { expectResultOk, expectResultErr } from '@/test-utils/error-helpers';

describe('UserRole', () => {
  describe('create', () => {
    it('ska skapa en giltig roll med behörigheter', () => {
      // Arrange
      const permissions = [
        UserPermission.create('team.member.read').value,
        UserPermission.create('team.member.update').value
      ];
      
      // Act
      const result = UserRole.create({
        name: 'team_member',
        displayName: 'Teammedlem',
        permissions
      });
      
      // Assert
      expectResultOk(result);
      expect(result.value.name).toBe('team_member');
      expect(result.value.displayName).toBe('Teammedlem');
      expect(result.value.permissions.length).toBe(2);
    });
    
    it('ska returnera fel för ogiltig roll', () => {
      // Arrange & Act
      const result = UserRole.create({
        name: '',  // Tomt namn
        displayName: 'Teammedlem',
        permissions: []
      });
      
      // Assert
      expectResultErr(result, 'INVALID_ROLE_NAME');
    });
  });
  
  describe('hasPermission', () => {
    it('ska kontrollera behörighet korrekt', () => {
      // Arrange
      const permissions = [
        UserPermission.create('team.member.read').value,
        UserPermission.create('team.member.update').value
      ];
      
      const role = UserRole.create({
        name: 'team_member',
        displayName: 'Teammedlem',
        permissions
      }).value;
      
      // Act & Assert
      expect(role.hasPermission('team.member.read')).toBe(true);
      expect(role.hasPermission('team.member.delete')).toBe(false);
    });
    
    it('ska hantera wildcard-behörigheter', () => {
      // Arrange
      const permissions = [
        UserPermission.create('team.*.*').value
      ];
      
      const role = UserRole.create({
        name: 'team_admin',
        displayName: 'Teamadmin',
        permissions
      }).value;
      
      // Act & Assert
      expect(role.hasPermission('team.member.read')).toBe(true);
      expect(role.hasPermission('organization.member.read')).toBe(false);
    });
  });
});
```

### Testning av rollhierarkier

```typescript
describe('rollhierarkier', () => {
  it('ska hantera rollhierarkier korrekt', () => {
    // Arrange
    const adminPermissions = [UserPermission.create('*.*.*').value];
    const memberPermissions = [
      UserPermission.create('team.member.read').value,
      UserPermission.create('team.member.update').value
    ];
    
    const adminRole = UserRole.create({
      name: 'admin',
      displayName: 'Administratör',
      permissions: adminPermissions
    }).value;
    
    const memberRole = UserRole.create({
      name: 'member',
      displayName: 'Medlem',
      permissions: memberPermissions
    }).value;
    
    // Act & Assert
    expect(adminRole.hasPermission('team.member.read')).toBe(true);
    expect(adminRole.hasPermission('team.admin.delete')).toBe(true);
    expect(memberRole.hasPermission('team.member.read')).toBe(true);
    expect(memberRole.hasPermission('team.admin.delete')).toBe(false);
  });
});
```

## Integrationstest för behörigheter

Använd följande mönster för att testa integrationen mellan UserPermission och UserRole:

```typescript
describe('Integration: UserPermission och UserRole', () => {
  it('ska integrera korrekt mellan behörigheter och roller', () => {
    // Arrange
    const teamAdminPermissions = [
      UserPermission.create('team.*.*').value
    ];
    
    const memberPermissions = [
      UserPermission.create('team.member.read').value,
      UserPermission.create('team.member.update').value
    ];
    
    const teamAdminRole = UserRole.create({
      name: 'team_admin',
      displayName: 'Teamadministratör',
      permissions: teamAdminPermissions
    }).value;
    
    const memberRole = UserRole.create({
      name: 'member',
      displayName: 'Medlem',
      permissions: memberPermissions
    }).value;
    
    // Act & Assert
    expect(teamAdminRole.canPerform(memberRole, 'team.member.read')).toBe(true);
    expect(memberRole.canPerform(teamAdminRole, 'team.member.read')).toBe(false);
    expect(teamAdminRole.canPerform(memberRole, 'team.admin.create')).toBe(true);
  });
});
```

## Testning av behörighetslogik i användarfall

När du testar användarfall som använder behörigheter, använd följande mönster:

```typescript
import { updateTeam, UpdateTeamDeps } from '../updateTeam';
import { UserRepository, TeamRepository } from '@/domain/repositories';
import { EventBus } from '@/shared/core/EventBus';
import { mockErrorHandler } from '@/test-utils/error-helpers';
import { User, Team } from '@/domain/entities';
import { UserPermission, UserRole } from '@/domain/value-objects';

describe('updateTeam', () => {
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockTeamRepo: jest.Mocked<TeamRepository>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockUser: jest.Mocked<User>;
  let mockTeam: jest.Mocked<Team>;
  let deps: UpdateTeamDeps;
  
  beforeEach(() => {
    // Återställ mockar
    jest.clearAllMocks();
    
    // Skapa behörigheter och roller
    const adminPermission = UserPermission.create('team.admin.*').value;
    const memberPermission = UserPermission.create('team.member.read').value;
    
    const adminRole = UserRole.create({
      name: 'team_admin',
      displayName: 'Teamadmin',
      permissions: [adminPermission]
    }).value;
    
    const memberRole = UserRole.create({
      name: 'team_member',
      displayName: 'Teammedlem',
      permissions: [memberPermission]
    }).value;
    
    // Skapa användarmock med behörigheter
    mockUser = {
      id: 'user-123',
      hasPermission: jest.fn()
    } as unknown as jest.Mocked<User>;
    
    // Skapa team
    mockTeam = {
      id: 'team-123',
      name: 'Testteam',
      update: jest.fn()
    } as unknown as jest.Mocked<Team>;
    
    // Skapa repo-mockar
    mockUserRepo = {
      findById: jest.fn().mockResolvedValue(mockUser)
    } as unknown as jest.Mocked<UserRepository>;
    
    mockTeamRepo = {
      findById: jest.fn().mockResolvedValue(mockTeam),
      save: jest.fn().mockResolvedValue(true)
    } as unknown as jest.Mocked<TeamRepository>;
    
    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<EventBus>;
    
    deps = {
      userRepo: mockUserRepo,
      teamRepo: mockTeamRepo,
      eventBus: mockEventBus
    };
  });
  
  it('ska tillåta uppdatering när användaren har behörighet', async () => {
    // Arrange
    mockUser.hasPermission.mockReturnValue(true);
    const input = {
      userId: 'user-123',
      teamId: 'team-123',
      name: 'Uppdaterat team'
    };
    
    // Act
    const result = await updateTeam(deps)(input);
    
    // Assert
    expect(result.isOk()).toBe(true);
    expect(mockUser.hasPermission).toHaveBeenCalledWith('team.admin.update');
    expect(mockTeam.update).toHaveBeenCalled();
    expect(mockTeamRepo.save).toHaveBeenCalled();
  });
  
  it('ska neka uppdatering när användaren saknar behörighet', async () => {
    // Arrange
    mockUser.hasPermission.mockReturnValue(false);
    const input = {
      userId: 'user-123',
      teamId: 'team-123',
      name: 'Uppdaterat team'
    };
    
    // Act
    const result = await updateTeam(deps)(input);
    
    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBe('PERMISSION_DENIED');
    }
    expect(mockUser.hasPermission).toHaveBeenCalledWith('team.admin.update');
    expect(mockTeam.update).not.toHaveBeenCalled();
    expect(mockTeamRepo.save).not.toHaveBeenCalled();
  });
});
```

## Exempel

### Testning av användare med roller

```typescript
describe('User med roller och behörigheter', () => {
  it('ska korrekt kontrollera användarens behörigheter baserat på roller', () => {
    // Arrange
    const adminPermission = UserPermission.create('*.*.*').value;
    const memberPermission = UserPermission.create('team.member.*').value;
    
    const adminRole = UserRole.create({
      name: 'admin',
      displayName: 'Admin',
      permissions: [adminPermission]
    }).value;
    
    const memberRole = UserRole.create({
      name: 'member',
      displayName: 'Medlem',
      permissions: [memberPermission]
    }).value;
    
    const userWithAdminRole = User.create({
      email: 'admin@example.com',
      roles: [adminRole]
    }).value;
    
    const userWithMemberRole = User.create({
      email: 'member@example.com',
      roles: [memberRole]
    }).value;
    
    // Act & Assert
    expect(userWithAdminRole.hasPermission('team.admin.delete')).toBe(true);
    expect(userWithMemberRole.hasPermission('team.member.read')).toBe(true);
    expect(userWithMemberRole.hasPermission('team.admin.create')).toBe(false);
  });
});
```

### Testning av komplexa behörighetsscenarier

```typescript
describe('Komplexa behörighetsscenarier', () => {
  it('ska hantera behörighetsarv korrekt', () => {
    // Arrange
    const basePermissions = [
      UserPermission.create('team.member.read').value
    ];
    
    const extendedPermissions = [
      UserPermission.create('team.member.*').value
    ];
    
    const specificPermissions = [
      UserPermission.create('team.member.read').value,
      UserPermission.create('team.member.update').value,
      UserPermission.create('team.member.delete').value
    ];
    
    const baseRole = UserRole.create({
      name: 'base',
      displayName: 'Bas',
      permissions: basePermissions
    }).value;
    
    const extendedRole = UserRole.create({
      name: 'extended',
      displayName: 'Utökad',
      permissions: extendedPermissions
    }).value;
    
    const specificRole = UserRole.create({
      name: 'specific',
      displayName: 'Specifik',
      permissions: specificPermissions
    }).value;
    
    // Act & Assert
    expect(baseRole.hasPermission('team.member.read')).toBe(true);
    expect(baseRole.hasPermission('team.member.update')).toBe(false);
    
    expect(extendedRole.hasPermission('team.member.read')).toBe(true);
    expect(extendedRole.hasPermission('team.member.update')).toBe(true);
    expect(extendedRole.hasPermission('team.member.delete')).toBe(true);
    
    expect(specificRole.hasPermission('team.member.read')).toBe(true);
    expect(specificRole.hasPermission('team.member.update')).toBe(true);
    expect(specificRole.hasPermission('team.member.delete')).toBe(true);
    expect(specificRole.hasPermission('team.member.any_other')).toBe(false);
  });
}); 