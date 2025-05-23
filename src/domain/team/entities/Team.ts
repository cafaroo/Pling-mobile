import { AggregateRoot } from '@/shared/core/AggregateRoot';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { TeamMember } from '../value-objects/TeamMember';
import { TeamInvitation } from '../value-objects/TeamInvitation';
import { TeamSettings } from './TeamSettings';
import { TeamRole } from '../value-objects/TeamRole';
import { TeamPermission } from '../value-objects/TeamPermission';
import { MemberJoined, MemberLeft, TeamMemberRoleChanged, TeamCreated, TeamUpdated } from '../events/TeamEvents';

export interface TeamProps {
  id: UniqueId;
  name: string;
  description?: string;
  ownerId: UniqueId;
  members: TeamMember[];
  invitations: TeamInvitation[];
  settings: TeamSettings;
  createdAt: Date;
  updatedAt: Date;
}

export type TeamCreateDTO = {
  name: string;
  description?: string;
  ownerId: string | UniqueId;
};

export type TeamUpdateDTO = {
  name?: string;
  description?: string;
  settings?: Partial<TeamSettings>;
};

export class Team extends AggregateRoot<TeamProps> {
  private constructor(props: TeamProps) {
    super(props);
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get ownerId(): UniqueId {
    return this.props.ownerId;
  }

  get members(): TeamMember[] {
    return this.props.members;
  }

  get invitations(): TeamInvitation[] {
    return this.props.invitations;
  }

  get settings(): TeamSettings {
    return this.props.settings;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Skapa ett nytt team
  public static create(props: TeamCreateDTO): Result<Team, string> {
    try {
      const id = new UniqueId();
      const ownerId = props.ownerId instanceof UniqueId 
        ? props.ownerId 
        : new UniqueId(props.ownerId);

      // Validering
      if (!props.name || props.name.trim().length < 2) {
        return err('Teamnamn måste vara minst 2 tecken');
      }

      // Skapa teamet
      const teamSettingsResult = TeamSettings.create({
        isPrivate: true,
        requiresApproval: true,
        maxMembers: 50,
        allowGuests: false,
        notificationSettings: {
          newMembers: true,
          memberLeft: true,
          roleChanges: true,
          activityUpdates: true
        }
      });

      if (teamSettingsResult.isErr()) {
        return err(`Kunde inte skapa teaminställningar: ${teamSettingsResult.error}`);
      }

      // Skapa ägarens medlemskap med owner-roll
      const ownerMemberResult = TeamMember.create({
        userId: ownerId,
        role: TeamRole.OWNER,
        joinedAt: new Date()
      });

      if (ownerMemberResult.isErr()) {
        return err(`Kunde inte skapa ägarmedlemskap: ${ownerMemberResult.error}`);
      }

      const now = new Date();

      const team = new Team({
        id,
        name: props.name.trim(),
        description: props.description?.trim(),
        ownerId,
        members: [ownerMemberResult.value],
        invitations: [],
        settings: teamSettingsResult.value,
        createdAt: now,
        updatedAt: now
      });

      // Lägg till domänhändelse
      team.addDomainEvent(new TeamCreated(
        id,
        ownerId,
        props.name.trim()
      ));

      return ok(team);
    } catch (error) {
      return err(`Kunde inte skapa team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Uppdatera team
  public update(updateDTO: TeamUpdateDTO): Result<void, string> {
    try {
      if (updateDTO.name && updateDTO.name.trim().length < 2) {
        return err('Teamnamn måste vara minst 2 tecken');
      }

      // Uppdatera teamet
      if (updateDTO.name) {
        this.props.name = updateDTO.name.trim();
      }

      if (updateDTO.description !== undefined) {
        this.props.description = updateDTO.description.trim();
      }

      if (updateDTO.settings) {
        try {
          this.props.settings = this.props.settings.update(updateDTO.settings);
        } catch (error) {
          return err(`Kunde inte uppdatera inställningar: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      this.props.updatedAt = new Date();

      // Lägg till domänhändelse
      this.addDomainEvent(new TeamUpdated(
        this.id,
        this.name
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte uppdatera team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Lägg till medlem
  public addMember(member: TeamMember): Result<void, string> {
    try {
      console.log('addMember', {
        members: this.props.members.map(m => ({ userId: m.userId.toString(), role: m.role })),
        newMember: { userId: member.userId.toString(), role: member.role },
        settings: this.props.settings
      });

      // Kontrollera om användaren redan är medlem
      const existingMember = this.props.members.find(m => 
        m.userId.toString() === member.userId.toString()
      );

      if (existingMember) {
        return err('Användaren är redan medlem i teamet');
      }

      // Kontrollera medlemsgräns om den finns definierad
      if (this.props.settings.maxMembers && this.props.members.length >= this.props.settings.maxMembers) {
        return err('Teamet har nått sin medlemsgräns');
      }

      // Lägg till medlemmen
      this.props.members.push(member);
      this.props.updatedAt = new Date();

      // Lägg till domänhändelse
      this.addDomainEvent(new MemberJoined(
        this.id,
        member.userId,
        member.role
      ));

      return ok(undefined);
    } catch (error) {
      console.error('Error i addMember:', error);
      return err(`Kunde inte lägga till medlem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Ta bort medlem
  public removeMember(userId: UniqueId): Result<void, string> {
    try {
      // Kontrollera om användaren är ägare
      if (this.props.ownerId && userId.equals(this.props.ownerId)) {
        return err('Ägaren kan inte tas bort från teamet');
      }

      // Hitta och ta bort medlemmen
      const initialLength = this.props.members.length;
      this.props.members = this.props.members.filter(m => 
        !m.userId.equals(userId)
      );

      if (this.props.members.length === initialLength) {
        return err('Användaren är inte medlem i teamet');
      }

      this.props.updatedAt = new Date();

      // Lägg till domänhändelse
      this.addDomainEvent(new MemberLeft(
        this.id,
        userId
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte ta bort medlem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Uppdatera medlemsroll
  public updateMemberRole(userId: UniqueId, newRole: TeamRole): Result<void, string> {
    try {
      // Kontrollera om användaren är ägare
      if (this.props.ownerId && userId.equals(this.props.ownerId) && newRole !== TeamRole.OWNER) {
        return err('Ägarrollen kan inte ändras');
      }

      // Hitta medlemmen
      const memberIndex = this.props.members.findIndex(m => 
        m.userId.equals(userId)
      );

      if (memberIndex === -1) {
        return err('Användaren är inte medlem i teamet');
      }

      const member = this.props.members[memberIndex];
      const oldRole = member.role;

      // Skapa ny medlem med uppdaterad roll
      const memberResult = TeamMember.create({
        userId: member.userId,
        role: newRole,
        joinedAt: member.joinedAt
      });

      if (memberResult.isErr()) {
        return err(`Kunde inte uppdatera medlem: ${memberResult.error}`);
      }

      // Ersätt medlemmen i listan
      this.props.members[memberIndex] = memberResult.value;
      this.props.updatedAt = new Date();

      // Lägg till domänhändelse
      this.addDomainEvent(new TeamMemberRoleChanged(
        this.id,
        userId,
        oldRole,
        newRole
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte uppdatera medlemsroll: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Lägg till inbjudan
  public addInvitation(invitation: TeamInvitation): Result<void, string> {
    try {
      // Kontrollera om inbjudan redan finns
      const existingInvitation = this.props.invitations.find(i => 
        i.userId.toString() === invitation.userId.toString()
      );

      if (existingInvitation) {
        return err('Användaren har redan en inbjudan');
      }

      // Kontrollera om användaren redan är medlem
      const existingMember = this.props.members.find(m => 
        m.userId.toString() === invitation.userId.toString()
      );

      if (existingMember) {
        return err('Användaren är redan medlem i teamet');
      }

      // Lägg till inbjudan
      this.props.invitations.push(invitation);
      this.props.updatedAt = new Date();

      // Lägg till domänhändelse
      this.addDomainEvent({
        name: 'InvitationSent',
        payload: {
          teamId: this.id.toString(),
          userId: invitation.userId.toString(),
          invitedBy: invitation.invitedBy.toString(),
          timestamp: new Date()
        }
      });

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte lägga till inbjudan: ${error.message}`);
    }
  }

  // Hantera svar på inbjudan
  public handleInvitationResponse(
    userId: UniqueId, 
    accept: boolean
  ): Result<void, string> {
    try {
      // Hitta inbjudan
      const invitation = this.props.invitations.find(i => 
        i.userId.toString() === userId.toString()
      );

      if (!invitation) {
        return err('Ingen aktiv inbjudan hittades');
      }

      // Ta bort inbjudan
      this.props.invitations = this.props.invitations.filter(i => 
        i.userId.toString() !== userId.toString()
      );

      // Lägg till händelse för accept/decline
      this.addDomainEvent({
        name: accept ? 'InvitationAccepted' : 'InvitationDeclined',
        payload: {
          teamId: this.id.toString(),
          userId: userId.toString(),
          timestamp: new Date()
        }
      });

      // Om accepterad, lägg till medlem
      if (accept) {
        const member = TeamMember.create({
          userId,
          role: TeamRole.MEMBER,
          joinedAt: new Date()
        }).getValue();

        return this.addMember(member);
      }

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte hantera inbjudan: ${error.message}`);
    }
  }

  // Kontrollera medlemskapsbehörighet
  public hasMemberPermission(userId: UniqueId, permission: TeamPermission): boolean {
    // Hitta medlemmen
    const member = this.props.members.find(m => 
      m.userId.toString() === userId.toString()
    );

    if (!member) {
      return false;
    }

    // Ägaren har alla behörigheter
    if (userId.toString() === this.props.ownerId.toString()) {
      return true;
    }

    // Kontrollera baserat på roll och behörighet
    if (member.role === TeamRole.ADMIN) {
      return permission !== TeamPermission.DELETE_TEAM;
    }

    // Vanliga medlemmar har begränsade behörigheter
    const memberPermissions = [
      TeamPermission.VIEW_TEAM,
      TeamPermission.JOIN_ACTIVITIES
    ];

    return memberPermissions.includes(permission);
  }
} 