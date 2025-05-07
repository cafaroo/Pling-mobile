import { ValueObject } from '@/shared/domain/ValueObject';

export class TeamRole extends ValueObject<string> {
  public static readonly OWNER = 'owner' as const;
  public static readonly ADMIN = 'admin' as const;
  public static readonly MEMBER = 'member' as const;

  private constructor(value: string) {
    super(value);
  }

  public static create(role: string): TeamRole {
    if (!this.isValidRole(role)) {
      throw new Error('Ogiltig teamroll');
    }
    return new TeamRole(role);
  }

  public static isValidRole(role: string): role is typeof TeamRole.OWNER | typeof TeamRole.ADMIN | typeof TeamRole.MEMBER {
    return [TeamRole.OWNER, TeamRole.ADMIN, TeamRole.MEMBER].includes(role as any);
  }
} 