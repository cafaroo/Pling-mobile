import { Result, ok, err } from '@/shared/core/Result';
import { TeamRole } from './TeamRole';
import { TeamPermission } from './TeamPermission';

export interface TeamRolePermissionProps {
  role: TeamRole;
  permissions: TeamPermission[];
}

export class TeamRolePermission {
  private constructor(private readonly props: TeamRolePermissionProps) {}

  get role(): TeamRole {
    return this.props.role;
  }

  get permissions(): TeamPermission[] {
    return [...this.props.permissions];
  }

  hasPermission(permission: TeamPermission): boolean {
    return this.props.permissions.includes(permission);
  }

  static create(props: TeamRolePermissionProps): Result<TeamRolePermission, string> {
    try {
      // Validera roll
      if (!Object.values(TeamRole).includes(props.role)) {
        return err(`Ogiltig roll: ${props.role}`);
      }

      // Validera behörigheter
      const uniquePermissions = [...new Set(props.permissions)];
      const invalidPermissions = uniquePermissions.filter(
        permission => !Object.values(TeamPermission).includes(permission)
      );

      if (invalidPermissions.length > 0) {
        return err(`Ogiltiga behörigheter: ${invalidPermissions.join(', ')}`);
      }

      return ok(new TeamRolePermission({
        role: props.role,
        permissions: uniquePermissions
      }));
    } catch (error) {
      return err(`Kunde inte skapa rollbehörighet: ${error.message}`);
    }
  }

  addPermission(permission: TeamPermission): Result<TeamRolePermission, string> {
    try {
      if (!Object.values(TeamPermission).includes(permission)) {
        return err(`Ogiltig behörighet: ${permission}`);
      }

      if (this.hasPermission(permission)) {
        return ok(this); // Behörigheten finns redan
      }

      return TeamRolePermission.create({
        role: this.props.role,
        permissions: [...this.props.permissions, permission]
      });
    } catch (error) {
      return err(`Kunde inte lägga till behörighet: ${error.message}`);
    }
  }

  removePermission(permission: TeamPermission): Result<TeamRolePermission, string> {
    try {
      if (!this.hasPermission(permission)) {
        return ok(this); // Behörigheten finns inte
      }

      return TeamRolePermission.create({
        role: this.props.role,
        permissions: this.props.permissions.filter(p => p !== permission)
      });
    } catch (error) {
      return err(`Kunde inte ta bort behörighet: ${error.message}`);
    }
  }

  setPermissions(permissions: TeamPermission[]): Result<TeamRolePermission, string> {
    try {
      return TeamRolePermission.create({
        role: this.props.role,
        permissions
      });
    } catch (error) {
      return err(`Kunde inte sätta behörigheter: ${error.message}`);
    }
  }

  static fromRole(role: TeamRole): Result<TeamRolePermission, string> {
    // Använd standardbehörigheter för roller
    const { DefaultRolePermissions } = require('./TeamPermission');
    
    const permissions = DefaultRolePermissions[role] || [];
    return TeamRolePermission.create({ role, permissions });
  }

  toJSON() {
    return {
      role: this.props.role,
      permissions: this.props.permissions
    };
  }
} 