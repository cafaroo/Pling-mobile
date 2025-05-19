import { Entity } from '@/shared/domain/Entity';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { OrganizationRole } from '../value-objects/OrganizationRole';

/**
 * Interface för OrganizationMember properties
 */
interface OrganizationMemberProps {
  userId: UniqueId;
  role: OrganizationRole;
  joinedAt?: Date;
  invitedBy?: UniqueId;
}

/**
 * Entitet för medlemskap i en organisation
 */
export class OrganizationMember extends Entity<OrganizationMemberProps> {
  private constructor(props: OrganizationMemberProps, id?: UniqueId) {
    super(props, id || new UniqueId());
  }

  /**
   * Hämta användarens ID
   */
  get userId(): UniqueId {
    return this.props.userId;
  }

  /**
   * Hämta användarens roll i organisationen
   */
  get role(): OrganizationRole {
    return this.props.role;
  }

  /**
   * Ändra användarens roll
   */
  changeRole(newRole: OrganizationRole): void {
    this.props.role = newRole;
  }

  /**
   * Tidpunkt då användaren gick med i organisationen
   */
  get joinedAt(): Date | undefined {
    return this.props.joinedAt;
  }

  /**
   * ID för användaren som bjöd in denna medlem (om tillgängligt)
   */
  get invitedBy(): UniqueId | undefined {
    return this.props.invitedBy;
  }

  /**
   * Skapar en ny organisationsmedlem
   * 
   * @param props Egenskaper för medlemskapet
   * @returns Ett Result med OrganizationMember eller felmeddelande
   */
  public static create(props: OrganizationMemberProps): Result<OrganizationMember, string> {
    try {
      // Validera användar-ID
      if (!props.userId) {
        return err('Medlemskapet måste ha ett användar-ID');
      }

      // Validera roll
      if (!props.role) {
        return err('Medlemmen måste ha en roll');
      }

      // Sätt joinedAt till nu om det inte anges
      const joinedAt = props.joinedAt || new Date();

      const member = new OrganizationMember({
        ...props,
        joinedAt
      });

      return ok(member);
    } catch (error) {
      return err(`Kunde inte skapa organisationsmedlem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Kontrollerar om denna medlem är ägare
   */
  isOwner(): boolean {
    return this.props.role === OrganizationRole.OWNER;
  }

  /**
   * Kontrollerar om denna medlem är administratör
   */
  isAdmin(): boolean {
    return this.props.role === OrganizationRole.ADMIN || this.isOwner();
  }

  /**
   * Kontrollerar om denna medlem är en vanlig medlem
   */
  isMember(): boolean {
    return this.props.role === OrganizationRole.MEMBER || this.isAdmin();
  }

  /**
   * Kontrollerar om denna medlem är en gäst
   */
  isGuest(): boolean {
    return this.props.role === OrganizationRole.GUEST;
  }

  /**
   * Jämför med ett annat OrganizationMember-objekt
   */
  equals(other: OrganizationMember): boolean {
    if (!(other instanceof OrganizationMember)) {
      return false;
    }
    
    return this.props.userId.equals(other.props.userId);
  }
} 