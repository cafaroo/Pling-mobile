/**
 * Mock-implementationer av Team-entiteter för testning
 */
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { 
  TeamMemberJoinedEvent, 
  TeamMemberLeftEvent,
  TeamMemberRoleChangedEvent,
  TeamUpdatedEvent
} from './mockTeamEvents';

/**
 * Mock-implementation av TeamRole
 */
export enum MockTeamRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest'
}

/**
 * Mock-implementation av TeamMember för testning
 */
export class MockTeamMember {
  private props: {
    userId: UniqueId;
    role: MockTeamRole;
    joinedAt: Date;
  };

  private constructor(props: {
    userId: UniqueId;
    role: MockTeamRole;
    joinedAt: Date;
  }) {
    this.props = props;
  }

  get userId(): UniqueId {
    return this.props.userId;
  }

  get role(): MockTeamRole {
    return this.props.role;
  }

  get joinedAt(): Date {
    return new Date(this.props.joinedAt);
  }

  public static create(props: {
    userId: string | UniqueId;
    role: MockTeamRole | string;
    joinedAt?: Date;
  }): Result<MockTeamMember, string> {
    try {
      const userId = props.userId instanceof UniqueId
        ? props.userId
        : new UniqueId(props.userId);
      
      // Om role är en sträng, konvertera den till MockTeamRole
      let teamRole: MockTeamRole;
      if (typeof props.role === 'string') {
        if (Object.values(MockTeamRole).includes(props.role as MockTeamRole)) {
          teamRole = props.role as MockTeamRole;
        } else {
          return err(`Ogiltig teamroll: ${props.role}`);
        }
      } else {
        teamRole = props.role;
      }

      return ok(new MockTeamMember({
        userId,
        role: teamRole,
        joinedAt: props.joinedAt || new Date()
      }));
    } catch (error) {
      return err(`Kunde inte skapa mock teammedlem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public equals(other: MockTeamMember): boolean {
    return this.props.userId.equals(other.props.userId);
  }

  public canInviteMembers(): boolean {
    return [MockTeamRole.OWNER, MockTeamRole.ADMIN].includes(this.props.role);
  }

  public canRemoveMembers(): boolean {
    return [MockTeamRole.OWNER, MockTeamRole.ADMIN].includes(this.props.role);
  }

  public canEditTeam(): boolean {
    return this.props.role === MockTeamRole.OWNER;
  }

  public canManageRoles(): boolean {
    return this.props.role === MockTeamRole.OWNER;
  }

  public toJSON() {
    return {
      userId: this.props.userId.toString(),
      role: this.props.role,
      joinedAt: this.props.joinedAt.toISOString()
    };
  }
}

/**
 * Mock-implementation av TeamCreateDTO
 */
export interface MockTeamCreateDTO {
  name: string;
  description?: string;
  ownerId: string | UniqueId;
  settings?: any;
}

/**
 * Skapar ett mock-team för testning
 */
export function createMockTeam(props: MockTeamCreateDTO): any {
  const ownerId = props.ownerId instanceof UniqueId 
    ? props.ownerId 
    : new UniqueId(props.ownerId);
  
  // Skapa ägarens medlemskap med owner-roll
  const ownerMember = MockTeamMember.create({
    userId: ownerId,
    role: MockTeamRole.OWNER,
    joinedAt: new Date()
  }).value;

  const id = new UniqueId();
  const now = new Date();

  // Returnera ett objekt som liknar ett team
  return {
    id,
    ownerId,
    name: props.name,
    description: props.description,
    members: [ownerMember],
    invitations: [],
    settings: props.settings || {},
    createdAt: now,
    updatedAt: now,
    domainEvents: [],
    
    addDomainEvent: function(event: any) {
      this.domainEvents.push(event);
    },
    
    clearEvents: function() {
      this.domainEvents = [];
    },
    
    getDomainEvents: function() {
      return this.domainEvents;
    },
    
    // Lägg till medlem till teamet
    addMember: function(member: any): Result<void, string> {
      // Validera att medlemmen inte redan finns
      const existingMember = this.members.find(m => 
        m.userId.toString() === member.userId.toString()
      );
      
      if (existingMember) {
        return err('Användaren är redan medlem i teamet');
      }
      
      this.members.push(member);
      
      // Simulera ett domänevent för medlemstillägg med rätt event-klass
      this.addDomainEvent(new TeamMemberJoinedEvent(
        this,
        member.userId,
        member.role
      ));
      
      return ok(undefined);
    },
    
    // Ta bort medlem från teamet
    removeMember: function(userId: UniqueId | string): Result<void, string> {
      const userIdStr = userId instanceof UniqueId ? userId.toString() : userId;
      
      // Validera att det inte är ägaren
      if (userIdStr === this.ownerId.toString()) {
        return err('Ägaren kan inte tas bort från teamet');
      }
      
      const memberIndex = this.members.findIndex(
        m => m.userId.toString() === userIdStr
      );
      
      if (memberIndex === -1) {
        return err('Användaren är inte medlem i teamet');
      }
      
      const memberToRemove = this.members[memberIndex];
      this.members.splice(memberIndex, 1);
      
      // Simulera ett domänevent för borttagning med rätt event-klass
      this.addDomainEvent(new TeamMemberLeftEvent(
        this,
        memberToRemove.userId
      ));
      
      return ok(undefined);
    },
    
    // Uppdatera en medlems roll
    updateMemberRole: function(userId: UniqueId | string, newRole: string): Result<void, string> {
      const userIdStr = userId instanceof UniqueId ? userId.toString() : userId;
      
      // Validera att det inte är ägaren om rollen inte är OWNER
      if (userIdStr === this.ownerId.toString() && newRole !== MockTeamRole.OWNER) {
        return err('Ägarens roll kan inte ändras');
      }
      
      const memberIndex = this.members.findIndex(
        m => m.userId.toString() === userIdStr
      );
      
      if (memberIndex === -1) {
        return err('Användaren är inte medlem i teamet');
      }
      
      const oldRole = this.members[memberIndex].role;
      
      // Istället för att sätta rollen direkt, ta bort den gamla medlemmen och lägg till en ny
      // med den nya rollen
      const userIdToRemove = this.members[memberIndex].userId;
      
      // Ta bort medlemmen från listan
      this.members.splice(memberIndex, 1);
      
      // Skapa en ny medlem med samma ID men med den nya rollen
      const newMember = MockTeamMember.create({
        userId: userIdToRemove,
        role: newRole,
        joinedAt: new Date()
      }).value;
      
      // Lägg till den nya medlemmen
      this.members.push(newMember);
      
      // Simulera ett domänevent för rollförändring med rätt event-klass
      this.addDomainEvent(new TeamMemberRoleChangedEvent(
        this,
        userIdToRemove,
        oldRole,
        newRole
      ));
      
      return ok(undefined);
    },
    
    // Utility-metod för att kontrollera om en användare har en viss roll
    getMemberRole: function(userId: UniqueId | string): MockTeamRole | null {
      const userIdStr = userId instanceof UniqueId ? userId.toString() : userId;
      const member = this.members.find(m => m.userId.toString() === userIdStr);
      return member ? member.role : null;
    },
    
    // Metod för att kontrollera behörigheter
    hasMemberPermission: function(userId: UniqueId | string, permission: string): boolean {
      const userIdStr = userId instanceof UniqueId ? userId.toString() : userId;
      
      // Ägaren har alltid alla behörigheter
      if (this.ownerId.toString() === userIdStr) {
        return true;
      }
      
      const memberRole = this.getMemberRole(userId);
      if (!memberRole) {
        return false;
      }
      
      // Definiera behörigheter per roll
      const rolePermissions = {
        [MockTeamRole.ADMIN]: [
          'view_team', 
          'edit_team', 
          'invite_members', 
          'manage_members', 
          'join_activities', 
          'create_activities'
        ],
        [MockTeamRole.MEMBER]: [
          'view_team', 
          'join_activities'
        ],
        [MockTeamRole.GUEST]: [
          'view_team' 
        ]
      };
      
      // Kontrollera om rollen har behörigheten
      return rolePermissions[memberRole].includes(permission);
    },
    
    // Metod för att lägga till en inbjudan
    addInvitation: function(invitation: any): Result<void, string> {
      // Om teamet inte kan skicka fler inbjudningar
      if (this.invitations.length >= 10) {
        return err('Teamet kan inte skicka fler inbjudningar');
      }
      
      // Kontrollera om användaren redan är inbjuden
      const alreadyInvited = this.invitations.some(
        inv => inv.email === invitation.email || 
              (inv.userId && invitation.userId && inv.userId.toString() === invitation.userId.toString())
      );
      
      if (alreadyInvited) {
        return err('Användaren är redan inbjuden');
      }
      
      // Lägg till inbjudan
      this.invitations.push(invitation);
      
      // Skapa och lägg till en händelse
      this.addDomainEvent({
        eventType: 'InvitationSentEvent',
        teamId: this.id,
        email: invitation.email,
        invitationId: invitation.id,
        invitedBy: invitation.invitedBy,
        role: invitation.role,
        expiresAt: invitation.expiresAt
      });
      
      return ok(undefined);
    },
    
    // Metod för att acceptera en inbjudan
    acceptInvitation: function(invitationId: string, userId: UniqueId): Result<void, string> {
      const invitation = this.invitations.find(inv => inv.id.toString() === invitationId);
      
      if (!invitation) {
        return err('Inbjudan hittades inte');
      }
      
      // Ta bort inbjudan
      this.invitations = this.invitations.filter(inv => inv.id.toString() !== invitationId);
      
      // Skapa en händelse
      this.addDomainEvent({
        eventType: 'InvitationAcceptedEvent',
        teamId: this.id,
        invitationId: invitationId,
        userId: userId
      });
      
      // Lägg till användaren som medlem
      return this.addMember(userId, invitation.role);
    },
    
    // Metod för att avböja en inbjudan
    declineInvitation: function(invitationId: string): Result<void, string> {
      const invitation = this.invitations.find(inv => inv.id.toString() === invitationId);
      
      if (!invitation) {
        return err('Inbjudan hittades inte');
      }
      
      // Ta bort inbjudan
      this.invitations = this.invitations.filter(inv => inv.id.toString() !== invitationId);
      
      // Skapa en händelse
      this.addDomainEvent({
        eventType: 'InvitationDeclinedEvent',
        teamId: this.id,
        invitationId: invitationId
      });
      
      return ok(undefined);
    }
  };
}

/**
 * Mockad Team-klass för testning
 */
export class MockTeam {
  /**
   * Skapar ett ny Mock Team
   */
  static create(props: MockTeamCreateDTO): Result<any, string> {
    try {
      const mockTeam = createMockTeam(props);
      
      // Lägg till metoden validateInvariants till mockTeam
      mockTeam.validateInvariants = function(): Result<void, string> {
        // Validera obligatoriska fält
        if (!this.name) {
          return err('Team måste ha ett namn');
        }
        
        if (!this.ownerId) {
          return err('Team måste ha en ägare');
        }
        
        // Validera att ägaren är medlem med OWNER-roll
        const owner = this.members.find(m => m.userId.equals(this.ownerId));
        if (!owner) {
          return err('Ägaren måste vara medlem i teamet med OWNER-roll');
        }
        
        if (owner.role !== MockTeamRole.OWNER) {
          return err('Ägaren måste ha OWNER-roll');
        }
        
        // Validera att varje användare bara har en roll
        const userIds = this.members.map(m => m.userId.toString());
        const uniqueUserIds = [...new Set(userIds)];
        if (userIds.length !== uniqueUserIds.length) {
          return err('En användare kan bara ha en roll i teamet');
        }
        
        // Validera medlemsgränser
        if (this.settings.maxMembers && this.members.length > this.settings.maxMembers) {
          return err('Teamet har överskridit sin medlemsgräns');
        }
        
        return ok(undefined);
      };
      
      // Lägg till metoden update för att stödja testerna
      mockTeam.update = function(updateDTO: any): Result<void, string> {
        if (updateDTO.name) {
          this.name = updateDTO.name;
        }
        
        if (updateDTO.description !== undefined) {
          this.description = updateDTO.description;
        }
        
        this.updatedAt = new Date();
        
        // Simulera ett domänevent för uppdatering med rätt event-klass
        this.addDomainEvent(new TeamUpdatedEvent(
          this.id,
          this.name
        ));
        
        return ok(undefined);
      };
      
      return ok(mockTeam);
    } catch (error) {
      return err(`Kunde inte skapa mock team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 