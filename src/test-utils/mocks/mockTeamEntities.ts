/**
 * Mock-implementationer av Team-entiteter för testning
 */
import { Result, ok, err } from '@/shared/core/Result';
import { UniqueId } from '@/shared/core/UniqueId';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { 
  TeamMemberJoinedEvent, 
  TeamMemberLeftEvent,
  TeamMemberRoleChangedEvent,
  TeamUpdatedEvent,
  TeamCreatedEvent,
  TeamInvitationSentEvent,
  TeamInvitationAcceptedEvent,
  TeamInvitationDeclinedEvent
} from './mockTeamEvents';
import { mockDomainEvents } from './mockDomainEvents';

/**
 * Mock-implementation av TeamRole
 */
export enum MockTeamRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST'
}

// Interface för MockTeamDTO som används för uppdatering
export interface MockTeamDTO {
  name?: string;
  description?: string;
  isActive?: boolean;
  settings?: any;
}

// Definiera behörighetskartan som mappar roller till deras behörigheter
const rolePermissionsMap: Record<MockTeamRole, string[]> = {
  [MockTeamRole.OWNER]: [
    'view_team', 
    'edit_team', 
    'delete_team', 
    'invite_members',
    'manage_members',
    'assign_roles',
    'join_activities',
    'view_statistics',
    'export_data',
    'change_settings'
  ],
  [MockTeamRole.ADMIN]: [
    'view_team', 
    'edit_team', 
    'invite_members',
    'manage_members',
    'join_activities',
    'view_statistics'
  ],
  [MockTeamRole.MEMBER]: [
    'view_team',
    'join_activities',
    'send_messages',
    'upload_files'
  ],
  [MockTeamRole.GUEST]: [
    'view_team'
  ]
};

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
    role: string | MockTeamRole;
    joinedAt: Date;
  }): Result<MockTeamMember, string> {
    const userId = props.userId instanceof UniqueId
      ? props.userId
      : new UniqueId(props.userId);
    
    let roleValue: MockTeamRole;
    
    // Konvertera sträng till MockTeamRole om det behövs
    if (typeof props.role === 'string') {
      // Förvandlar strängen till MockTeamRole
      const roleName = props.role.toUpperCase();
      if (roleName in MockTeamRole) {
        roleValue = MockTeamRole[roleName as keyof typeof MockTeamRole];
      } else {
        // Fallback till MEMBER om rollen inte finns
        roleValue = MockTeamRole.MEMBER;
      }
    } else {
      roleValue = props.role;
    }
    
    return ok(new MockTeamMember({
      userId,
      role: roleValue,
      joinedAt: props.joinedAt
    }));
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
  console.log('createMockTeam anropad med props:', JSON.stringify({
    name: props.name,
    ownerId: props.ownerId instanceof UniqueId ? props.ownerId.toString() : props.ownerId
  }));
  
  const ownerId = props.ownerId instanceof UniqueId 
    ? props.ownerId 
    : new UniqueId(props.ownerId);
  
  console.log('Ägar-ID konverterat till:', ownerId.toString());
  
  // Skapa ägarens medlemskap med owner-roll
  const ownerMemberResult = MockTeamMember.create({
    userId: ownerId,
    role: MockTeamRole.OWNER,
    joinedAt: new Date()
  });
  
  if (ownerMemberResult.isErr()) {
    console.error('Kunde inte skapa owner-medlem:', ownerMemberResult.error);
    throw new Error(`Kunde inte skapa owner-medlem: ${ownerMemberResult.error}`);
  }
  
  const ownerMember = ownerMemberResult.value;
  console.log('Ägaren skapad som medlem med roll:', ownerMember.role);

  const id = new UniqueId();
  const now = new Date();

  // Returnera ett objekt som liknar ett team
  const team = {
    id,
    _ownerId: ownerId, // Spara originalreferensen privat
    get ownerId() {
      // Returnera strängen för konsistens med standardiserade tester
      // Hantera även null/undefined fall för testers
      return this._ownerId ? this._ownerId.toString() : undefined;
    },
    name: props.name,
    description: props.description,
    members: [ownerMember], // Lägg till ägaren som medlem direkt vid skapande
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
    
    // Uppdatera team-egenskaper
    update: function(props: Partial<MockTeamDTO>): Result<void, string> {
      // Validera namnet om det finns
      if (props.name && props.name.trim().length < 2) {
        return err('Teamnamn måste vara minst 2 tecken');
      }
      
      // Uppdatera namn om det finns
      if (props.name) {
        this.name = props.name;
      }
      
      // Uppdatera beskrivning om det finns
      if (props.description) {
        this.description = props.description;
      }
      
      // Uppdatera isActive om det finns
      if (props.isActive !== undefined) {
        this.isActive = props.isActive;
      }
      
      // Uppdatera settings om det finns
      if (props.settings) {
        this.settings = {
          ...this.settings,
          ...props.settings
        };
      }
      
      // Skapa och lägg till en händelse för uppdatering
      const updateEvent = new TeamUpdatedEvent({
        teamId: this.id,
        name: this.name,
        description: this.description,
        updatedAt: new Date()
      });
      
      this.addDomainEvent(updateEvent);
      // Publicera även till mockDomainEvents för global åtkomst i tester
      mockDomainEvents.publish(updateEvent);
      
      return ok(undefined);
    },
    
    // Metod för att validera invarianter
    validateInvariants: function(): Result<void, string> {
      console.log('validateInvariants anropad');
      
      // Validera obligatoriska fält
      if (!this.name || this.name.trim().length < 2) {
        return err('Teamnamn måste vara minst 2 tecken');
      }
      
      if (!this._ownerId) {
        return err('Team måste ha en ägare');
      }
      
      // Validera att ägaren är medlem med OWNER-roll
      const owner = this.members.find((m: any) => m.userId.equals(this._ownerId));
      console.log('Söker efter ägare bland medlemmar, hittade:', owner ? 'Ja' : 'Nej');
      
      if (!owner) {
        return err('Ägaren måste vara medlem i teamet med OWNER-roll');
      }
      
      console.log('Ägarens roll:', owner.role);
      if (owner.role !== MockTeamRole.OWNER) {
        return err('Ägaren måste ha OWNER-roll');
      }
      
      // Validera att varje användare bara har en roll
      const userIds = this.members.map((m: any) => m.userId.toString());
      const uniqueUserIds = [...new Set(userIds)];
      if (userIds.length !== uniqueUserIds.length) {
        return err('En användare kan bara ha en roll i teamet');
      }
      
      // Validera medlemsgränser
      if (this.settings.maxMembers && this.members.length > this.settings.maxMembers) {
        return err('Teamet har överskridit sin medlemsgräns');
      }
      
      return ok(undefined);
    },
    
    // Lägg till medlem till teamet
    addMember: function(member: any): Result<void, string> {
      // Validera att medlemmen inte redan finns
      const existingMember = this.members.find((m: any) => 
        m.userId.toString() === member.userId.toString()
      );
      
      if (existingMember) {
        return err('Användaren är redan medlem i teamet');
      }
      
      // Validera maxMembers-gränsen om den är satt
      if (this.settings && this.settings.maxMembers && this.members.length >= this.settings.maxMembers) {
        return err('Teamet har nått sin medlemsgräns');
      }
      
      // Behandla olika typer av medlemmar
      let memberToAdd;
      
      // Om det är en instantierad MockTeamMember (har dess metoder och egenskaper)
      if (member instanceof MockTeamMember) {
        console.log(`addMember: Lägger till MockTeamMember med roll ${member.role}`);
        memberToAdd = member;
      } else {
        // Annars försök skapa en MockTeamMember från de tillgängliga egenskaperna
        const memberResult = MockTeamMember.create({
          userId: member.userId || member,
          role: member.role || MockTeamRole.MEMBER,
          joinedAt: member.joinedAt || new Date()
        });
        
        if (memberResult.isErr()) {
          return err(`Kunde inte lägga till medlem: ${memberResult.error}`);
        }
        
        memberToAdd = memberResult.value;
      }
      
      // Lägg till medlemmen
      this.members.push(memberToAdd);
      
      // Skapa och lägg till en händelse
      const memberJoinedEvent = new TeamMemberJoinedEvent({
        teamId: this.id,
        userId: memberToAdd.userId,
        role: memberToAdd.role.toString(),
        joinedAt: new Date()
      });
      
      this.addDomainEvent(memberJoinedEvent);
      // Publicera även till mockDomainEvents för global åtkomst i tester
      mockDomainEvents.publish(memberJoinedEvent);
      
      return ok(undefined);
    },
    
    // Ta bort medlem från teamet
    removeMember: function(userId: UniqueId | string): Result<void, string> {
      const userIdObj = UniqueId.from(userId);
      
      // Validera att det inte är ägaren
      if (userIdObj.equals(this._ownerId)) {
        return err('Ägaren kan inte tas bort från teamet');
      }
      
      const memberIndex = this.members.findIndex(
        (m: any) => m.userId.equals(userIdObj)
      );
      
      if (memberIndex === -1) {
        return err('Användaren är inte medlem i teamet');
      }
      
      const memberToRemove = this.members[memberIndex];
      this.members.splice(memberIndex, 1);
      
      // Simulera ett domänevent för borttagning med rätt event-klass
      this.addDomainEvent(new TeamMemberLeftEvent({
        teamId: this.id,
        userId: memberToRemove.userId,
        removedAt: new Date()
      }));
      
      return ok(undefined);
    },
    
    // Uppdatera en medlems roll
    updateMemberRole: function(userId: UniqueId | string, newRole: string): Result<void, string> {
      const userIdObj = UniqueId.from(userId);
      
      // Konvertera string till MockTeamRole för intern bruk
      let newRoleEnum;
      if (typeof newRole === 'string') {
        const upperCaseRole = newRole.toUpperCase();
        if (upperCaseRole in MockTeamRole) {
          newRoleEnum = MockTeamRole[upperCaseRole as keyof typeof MockTeamRole];
        } else {
          return err(`Ogiltig roll: ${newRole}`);
        }
      } else {
        newRoleEnum = newRole;
      }
      
      // Förhindra ändringar av ägarens roll från OWNER
      if (userIdObj.equals(this._ownerId) && newRoleEnum !== MockTeamRole.OWNER) {
        return err('Ägarens roll kan inte ändras från OWNER');
      }
      
      const memberIndex = this.members.findIndex(
        (m: any) => m.userId.equals(userIdObj)
      );
      
      if (memberIndex === -1) {
        return err('Användaren är inte medlem i teamet');
      }
      
      const oldRole = this.members[memberIndex].role;
      console.log(`updateMemberRole: Hittade medlem med roll ${oldRole}, ändrar till ${newRoleEnum}`);
      
      // Istället för att sätta rollen direkt, ta bort den gamla medlemmen och lägg till en ny
      // med den nya rollen
      const userIdToRemove = this.members[memberIndex].userId;
      
      // Ta bort medlemmen från listan
      this.members.splice(memberIndex, 1);
      
      // Skapa en ny medlem med samma ID men med den nya rollen (via MockTeamMember.create för konsistens)
      const newMemberResult = MockTeamMember.create({
        userId: userIdToRemove,
        role: newRoleEnum,
        joinedAt: new Date()
      });
      
      if (newMemberResult.isErr()) {
        return err(`Kunde inte skapa ny medlem med uppdaterad roll: ${newMemberResult.error}`);
      }
      
      const newMember = newMemberResult.value;
      
      // Lägg till den nya medlemmen
      this.members.push(newMember);
      
      console.log(`updateMemberRole: Skapar RoleChangedEvent med oldRole=${oldRole}, newRole=${newRoleEnum}`);
      
      // Simulera ett domänevent för rollförändring med rätt event-klass
      this.addDomainEvent(new TeamMemberRoleChangedEvent({
        teamId: this.id,
        userId: userIdToRemove,
        oldRole: oldRole.toString(),
        newRole: newRoleEnum.toString(),
        changedAt: new Date()
      }));
      
      return ok(undefined);
    },
    
    // Utility-metod för att kontrollera om en användare har en viss roll
    getMemberRole: function(userId: UniqueId | string): MockTeamRole | null {
      const userIdStr = userId instanceof UniqueId ? userId.toString() : userId;
      const member = this.members.find((m: any) => m.userId.toString() === userIdStr);
      return member ? member.role : null;
    },
    
    // Metod för att kontrollera behörigheter
    hasMemberPermission: function(userId: UniqueId | string, permission: string | any): boolean {
      const id = userId instanceof UniqueId ? userId : new UniqueId(userId);
      const permissionStr = typeof permission === 'string' ? permission : permission.toString();
      
      console.log(`hasMemberPermission anropad: userId=${id.toString()}, permission=${permissionStr}`);
      
      // Hitta medlemmen
      const member = this.members.find((m: any) => m.userId.equals(id));
      
      // Om användaren inte är medlem, har de inga behörigheter
      if (!member) {
        console.log(`hasMemberPermission: Användare ${id.toString()} är inte medlem i teamet`);
        return false;
      }
      
      // Hämta medlemmens roll och kontrollera behörigheter mot rolePermissionsMap
      const role = member.role;
      console.log(`hasMemberPermission: Användare ${id.toString()} har rollen ${role}`);
      
      // Ägare har alltid alla behörigheter
      if (role === MockTeamRole.OWNER) {
        console.log(`hasMemberPermission: Användare ${id.toString()} är ägare och har alla behörigheter`);
        return true;
      }
      
      // För andra roller, kontrollera i rolePermissionsMap
      const permissions = rolePermissionsMap[role as MockTeamRole];
      const hasPermission = permissions ? permissions.includes(permissionStr) : false;
      console.log(`hasMemberPermission: Användare ${id.toString()} med roll ${role} ${hasPermission ? 'har' : 'saknar'} behörighet ${permissionStr}`);
      console.log(`hasMemberPermission: Tillgängliga behörigheter för ${role}: ${permissions ? permissions.join(', ') : 'inga'}`);
      
      return hasPermission;
    },
    
    // Metod för att lägga till en inbjudan
    addInvitation: function(invitation: any): Result<void, string> {
      // Om teamet inte kan skicka fler inbjudningar
      if (this.invitations.length >= 10) {
        return err('Teamet kan inte skicka fler inbjudningar');
      }
      
      // Kontrollera om användaren redan är inbjuden
      const alreadyInvited = this.invitations.some(
        (inv: any) => inv.email === invitation.email || 
              (inv.userId && invitation.userId && inv.userId.toString() === invitation.userId.toString())
      );
      
      if (alreadyInvited) {
        return err('Användaren är redan inbjuden');
      }
      
      // Lägg till inbjudan
      this.invitations.push(invitation);
      
      // Skapa och lägg till en händelse med rätt event-klass
      const invitationEvent = new TeamInvitationSentEvent({
        teamId: this.id,
        inviteeEmail: invitation.email,
        senderId: invitation.invitedBy,
        sentAt: new Date()
      });
      
      this.addDomainEvent(invitationEvent);
      // Publicera även till mockDomainEvents för global åtkomst i tester
      mockDomainEvents.publish(invitationEvent);
      
      return ok(undefined);
    },
    
    // Metod för att hantera svar på inbjudan (accept/decline)
    handleInvitationResponse: function(userId: string | UniqueId, accept: boolean): Result<void, string> {
      const userIdObj = UniqueId.from(userId);
      
      // Hitta inbjudan
      const invitationIndex = this.invitations.findIndex((inv: any) => 
        inv.userId && inv.userId.equals(userIdObj)
      );
      
      if (invitationIndex === -1) {
        return err('Inbjudan hittades inte');
      }
      
      const invitation = this.invitations[invitationIndex];
      
      // Ta bort inbjudan från listan
      this.invitations.splice(invitationIndex, 1);
      
      if (accept) {
        // Skapa händelse för accepterad inbjudan med rätt event-klass
        const acceptedEvent = new TeamInvitationAcceptedEvent({
          teamId: this.id,
          inviteeEmail: invitation.email,
          inviteeId: invitation.userId,
          acceptedAt: new Date()
        });
        
        this.addDomainEvent(acceptedEvent);
        mockDomainEvents.publish(acceptedEvent);
        
        // Skapa ny medlem
        const newMember = MockTeamMember.create({
          userId: userIdObj,
          role: invitation.role || MockTeamRole.MEMBER,
          joinedAt: new Date()
        }).value;
        
        // Lägg till användaren som medlem
        return this.addMember(newMember);
      } else {
        // Skapa händelse för avböjd inbjudan med rätt event-klass
        const declinedEvent = new TeamInvitationDeclinedEvent({
          teamId: this.id,
          inviteeEmail: invitation.email,
          declinedAt: new Date()
        });
        
        this.addDomainEvent(declinedEvent);
        mockDomainEvents.publish(declinedEvent);
        
        return ok(undefined);
      }
    },
    
    // Metod för att acceptera en inbjudan (äldre gränssnitt)
    acceptInvitation: function(invitationId: string, userId: UniqueId): Result<void, string> {
      const invitation = this.invitations.find((inv: any) => inv.id.toString() === invitationId);
      
      if (!invitation) {
        return err('Inbjudan hittades inte');
      }
      
      // Ta bort inbjudan
      this.invitations = this.invitations.filter((inv: any) => inv.id.toString() !== invitationId);
      
      // Skapa en händelse
      this.addDomainEvent({
        eventType: 'InvitationAcceptedEvent',
        teamId: this.id,
        invitationId: invitationId,
        userId: userId
      });
      
      // Lägg till användaren som medlem
      return this.addMember(MockTeamMember.create({
        userId: userId,
        role: invitation.role || MockTeamRole.MEMBER,
        joinedAt: new Date()
      }).value);
    },
    
    // Metod för att avböja en inbjudan
    declineInvitation: function(invitationId: string): Result<void, string> {
      const invitation = this.invitations.find((inv: any) => inv.id.toString() === invitationId);
      
      if (!invitation) {
        return err('Inbjudan hittades inte');
      }
      
      // Ta bort inbjudan
      this.invitations = this.invitations.filter((inv: any) => inv.id.toString() !== invitationId);
      
      // Skapa en händelse
      this.addDomainEvent({
        eventType: 'InvitationDeclinedEvent',
        teamId: this.id,
        invitationId: invitationId
      });
      
      return ok(undefined);
    }
  };
  
  // Validera teamet direkt vid skapande
  const validateResult = team.validateInvariants();
  if (validateResult.isErr()) {
    console.error('Teamvalidering misslyckades:', validateResult.error);
    throw new Error(`Kunde inte skapa mockteam: ${validateResult.error}`);
  }
  
  return team;
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
      console.log('MockTeam.create anropad med props:', JSON.stringify({
        name: props.name,
        ownerId: props.ownerId instanceof UniqueId ? props.ownerId.toString() : props.ownerId
      }));
      
      // Validera teamnamnet
      if (!props.name || props.name.trim().length < 2) {
        return err('Teamnamn måste vara minst 2 tecken');
      }
      
      // Skapa mockteam med direkt skapande istället för att använda createMockTeam
      const mockTeam = createMockTeam(props);
      
      // Lägg till en TeamCreatedEvent i domainEvents-arrayen direkt vid skapande
      const createdEvent = new TeamCreatedEvent({
        teamId: mockTeam.id,
        name: mockTeam.name,
        ownerId: mockTeam._ownerId,
        createdAt: new Date()
      });
      
      mockTeam.addDomainEvent(createdEvent);
      mockDomainEvents.publish(createdEvent);
      
      console.log('Team skapades med ägare:', mockTeam.ownerId);
      console.log('Teamet har medlemmar:', mockTeam.members.length);
      mockTeam.members.forEach((m: any, i: number) => {
        console.log(`- Medlem ${i+1}: ${m.userId.toString()}, roll: ${m.role}`);
      });
      
      return ok(mockTeam);
    } catch (error) {
      return err(`Kunde inte skapa mock team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 