import { AggregateRoot } from '@/shared/domain/AggregateRoot';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { TeamMember } from '../value-objects/TeamMember';
import { TeamInvitation } from '../value-objects/TeamInvitation';
import { TeamSettings, TeamSettingsProps } from './TeamSettings';
import { TeamRole, TeamRoleEnum } from '../value-objects/TeamRole';
import { TeamPermission, TeamPermissionValue } from '../value-objects/TeamPermission';
import { 
  TeamUpdated, 
  InvitationSent,
  InvitationAccepted,
  InvitationDeclined,
  TeamSettingsUpdated
} from '../events/TeamEvents';
import { TeamName } from '../value-objects/TeamName';
import { TeamDescription } from '../value-objects/TeamDescription';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';
import { TeamCreatedEvent } from '../events/TeamCreatedEvent';
import { TeamMemberJoinedEvent } from '../events/TeamMemberJoinedEvent';
import { TeamMemberLeftEvent } from '../events/TeamMemberLeftEvent';
import { TeamMemberRoleChangedEvent } from '../events/TeamMemberRoleChangedEvent';
import { DefaultRolePermissions, roleHasPermission } from '../value-objects/DefaultRolePermissions';

/**
 * TeamProps - Interface som definierar egenskaperna för Team-entiteten.
 */
export interface TeamProps {
  name: TeamName;
  description?: TeamDescription;
  ownerId: UniqueId;
  members: TeamMember[];
  invitations: TeamInvitation[];
  settings: TeamSettings;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * TeamCreateDTO - Data transfer object för att skapa ett nytt team.
 */
export interface TeamCreateDTO {
  name: string;
  description?: string;
  ownerId: string | UniqueId;
  settings?: Partial<TeamSettingsProps>;
}

/**
 * TeamUpdateDTO - Data transfer object för att uppdatera ett team.
 */
export interface TeamUpdateDTO {
  name?: string;
  description?: string | null;
  settings?: Partial<TeamSettingsProps>;
}

/**
 * Team
 * 
 * Aggregatrot för teamdomänen som representerar ett team i systemet.
 * Hanterar medlemsskap, roller, inbjudningar och teamrelaterade operationer.
 */
export class Team extends AggregateRoot<TeamProps> {
  /**
   * Privat konstruktor, använd static create för att skapa nya team-instanser
   * Eller utmane från test-utils för att skapa mock-instanser
   */
  constructor(props: TeamProps, id?: UniqueId) {
    super(props, id);
    
    // Lägg automatiskt till TeamCreatedEvent för nya instanser
    // Men bara om det inte görs från en mock
    if (!id) {
      const teamCreatedEvent = new TeamCreatedEvent({
        teamId: this.id,
        name: this.props.name.value,
        ownerId: this.props.ownerId,
        createdAt: this.props.createdAt
      });
      
      this.addDomainEvent(teamCreatedEvent);
    }
  }

  /**
   * Bekräftar alla invarianter för ett team
   */
  public validateInvariants(): Result<void, string> {
    try {
      // Invariant: Ägaren måste vara medlem i teamet med OWNER-roll
      const ownerIsMember = this.props.members.some(
        member => member.userId.equals(this.props.ownerId) && 
                 member.role.equalsValue(TeamRole.OWNER)
      );
      
      if (!ownerIsMember) {
        return err('Ägaren måste vara medlem i teamet med OWNER-roll');
      }
      
      // Invariant: Max antal medlemmar
      if (this.props.members.length > this.props.settings.props.maxMembers) {
        return err(`Teamet kan inte ha fler än ${this.props.settings.props.maxMembers} medlemmar`);
      }
      
      // Invariant: Inga duplicerade medlemmar
      const memberIds = this.props.members.map(member => member.userId.toString());
      if (new Set(memberIds).size !== memberIds.length) {
        return err('Teamet kan inte ha duplicerade medlemmar');
      }
      
      // Alla invarianter godkändes
      return ok(undefined);
    } catch (error) {
      return err(`Invariantfel: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Hjälpmetod för att validera invarianter och kasta fel om de inte är uppfyllda
   */
  private validateAndThrowOnFailure(): void {
    const validation = this.validateInvariants();
    if (validation.isErr()) {
      throw new Error(validation.error);
    }
  }
  
  /**
   * Skapar ett nytt team
   */
  public static create(props: TeamCreateDTO): Result<Team, string> {
    try {
      // Skapa namn och beskrivning
      const nameResult = TeamName.create(props.name);
      if (nameResult.isErr()) {
        return err(nameResult.error);
      }
      
      // Skapa beskrivning om den finns
      let description = undefined;
      if (props.description) {
        const descriptionResult = TeamDescription.create(props.description);
        if (descriptionResult.isErr()) {
          return err(descriptionResult.error);
        }
        description = descriptionResult.value;
      }
      
      // Skapa inställningar (med standardvärden eller anpassade)
      const settingsResult = props.settings 
        ? TeamSettings.create(props.settings) 
        : TeamSettings.createDefault();
      
      if (settingsResult.isErr()) {
        return err(settingsResult.error);
      }
      
      // Konvertera ownerId till UniqueId
      const ownerId = UniqueId.from(props.ownerId);
      
      const now = new Date();
      
      // Skapa och lägg till ägaren som en TeamMember med OWNER-roll
      const ownerMemberResult = TeamMember.create({
        userId: ownerId,
        role: TeamRole.OWNER,
        joinedAt: now
      });
      
      if (ownerMemberResult.isErr()) {
        return err(ownerMemberResult.error);
      }
      
      // Skapa Team
      const id = new UniqueId();
      const team = new Team({
        name: nameResult.value,
        description,
        ownerId,
        createdAt: now,
        updatedAt: now,
        members: [ownerMemberResult.value],
        invitations: [],
        settings: settingsResult.value
      }, id);
      
      // Validera invarianter
      const validation = team.validateInvariants();
      if (validation.isErr()) {
        return err(validation.error);
      }
      
      return ok(team);
    } catch (error) {
      return err(`Kunde inte skapa team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Lägger till en medlem i teamet
   */
  public addMember(props: {
    userId: string | UniqueId;
    role: TeamRole | string;
    joinedAt?: Date;
  }): Result<void, string> {
    try {
      // Verifiera att användaren inte redan är medlem
      const userId = UniqueId.from(props.userId);
      
      const existingMemberIndex = this.props.members.findIndex(
        member => member.userId.equals(userId)
      );
      
      if (existingMemberIndex >= 0) {
        return err('Användaren är redan medlem i teamet');
      }
      
      // Verifiera att det finns plats för fler medlemmar
      if (this.props.members.length >= this.props.settings.props.maxMembers) {
        return err(`Teamet kan inte ha fler än ${this.props.settings.props.maxMembers} medlemmar`);
      }
      
      // Skapa TeamMember
      const memberResult = TeamMember.create({
        userId,
        role: props.role,
        joinedAt: props.joinedAt || new Date()
      });
      
      if (memberResult.isErr()) {
        return err(memberResult.error);
      }
      
      // Lägg till medlem och uppdatera
      this.props.members.push(memberResult.value);
      this.props.updatedAt = new Date();
      
      // Skapa och publicera MemberJoinedEvent
      const memberJoinedEvent = new TeamMemberJoinedEvent({
        teamId: this.id,
        userId: userId,
        role: memberResult.value.role.toString(),
        joinedAt: memberResult.value.joinedAt
      });
      
      this.addDomainEvent(memberJoinedEvent);
      
      // Validera invarianter
      const validation = this.validateInvariants();
      if (validation.isErr()) {
        // Återställ ändringen om invarianterna inte uppfylls
        this.props.members.pop();
        return err(validation.error);
      }
      
      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte lägga till medlem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Tar bort en medlem från teamet
   */
  public removeMember(userId: string | UniqueId): Result<void, string> {
    try {
      const userIdObj = UniqueId.from(userId);
      
      // Ägaren kan inte tas bort
      if (userIdObj.equals(this.props.ownerId)) {
        return err('Ägaren kan inte tas bort från teamet');
      }
      
      const memberIndex = this.props.members.findIndex(
        member => member.userId.equals(userIdObj)
      );
      
      if (memberIndex === -1) {
        return err('Användaren är inte medlem i teamet');
      }
      
      // Spara medlemmen innan den tas bort för att skapa ett event
      const removedMember = this.props.members[memberIndex];
      
      // Ta bort medlemmen och uppdatera
      this.props.members.splice(memberIndex, 1);
      this.props.updatedAt = new Date();
      
      // Skapa och publicera MemberLeftEvent
      const memberLeftEvent = new TeamMemberLeftEvent({
        teamId: this.id,
        userId: userIdObj,
        removedAt: new Date()
      });
      
      this.addDomainEvent(memberLeftEvent);
      
      // Validera invarianter
      const validation = this.validateInvariants();
      if (validation.isErr()) {
        // Återställ ändringen om invarianterna inte uppfylls
        this.props.members.splice(memberIndex, 0, removedMember);
        return err(validation.error);
      }
      
      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte ta bort medlem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Ändrar rollen för en medlem
   */
  public changeMemberRole(userId: string | UniqueId, newRole: TeamRole | string): Result<void, string> {
    try {
      const userIdObj = UniqueId.from(userId);
      
      // Förhindra att ägaren byter roll
      if (userIdObj.equals(this.props.ownerId)) {
        // Kontrollera att den nya rollen är OWNER
        let isOwnerRole = false;
        
        if (typeof newRole === 'string') {
          isOwnerRole = newRole.toLowerCase() === TeamRoleEnum.OWNER;
        } else if (newRole instanceof TeamRole) {
          isOwnerRole = newRole.equalsValue(TeamRole.OWNER);
        }
        
        if (!isOwnerRole) {
          return err('Ägarens roll kan inte ändras');
        }
      }
      
      const memberIndex = this.props.members.findIndex(
        member => member.userId.equals(userIdObj)
      );
      
      if (memberIndex === -1) {
        return err('Användaren är inte medlem i teamet');
      }
      
      // Hämta medlemmen och spara den gamla rollen
      const member = this.props.members[memberIndex];
      const oldRole = member.role;
      
      // Försök att skapa en ny TeamMember med den nya rollen
      const newMemberResult = TeamMember.create({
        userId: userIdObj,
        role: newRole,
        joinedAt: member.joinedAt
      });
      
      if (newMemberResult.isErr()) {
        return err(newMemberResult.error);
      }
      
      // Uppdatera medlemmen
      this.props.members[memberIndex] = newMemberResult.value;
      this.props.updatedAt = new Date();
      
      // Skapa och publicera RoleChangedEvent
      const roleChangedEvent = new TeamMemberRoleChangedEvent({
        teamId: this.id,
        userId: userIdObj,
        oldRole: oldRole.toString(),
        newRole: newMemberResult.value.role.toString(),
        changedAt: new Date()
      });
      
      this.addDomainEvent(roleChangedEvent);
      
      // Validera invarianter
      const validation = this.validateInvariants();
      if (validation.isErr()) {
        // Återställ ändringen om invarianterna inte uppfylls
        this.props.members[memberIndex] = member;
        return err(validation.error);
      }
      
      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte ändra medlemsroll: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Alias för changeMemberRole för bakåtkompatibilitet
   * Detta är för att stödja koden som använder updateMemberRole istället för changeMemberRole
   */
  public updateMemberRole(userId: string | UniqueId, newRole: TeamRole | string): Result<void, string> {
    return this.changeMemberRole(userId, newRole);
  }
  
  /**
   * Uppdaterar teamets information
   */
  public update(props: {
    name?: string;
    description?: string | null;
  }): Result<void, string> {
    try {
      // Uppdatera namn om det angetts
      if (props.name) {
        const nameResult = TeamName.create(props.name);
        if (nameResult.isErr()) {
          return err(nameResult.error);
        }
        this.props.name = nameResult.value;
      }
      
      // Uppdatera beskrivning om det angetts
      if (props.description !== undefined) {
        if (props.description === null) {
          this.props.description = undefined;
        } else {
          const descriptionResult = TeamDescription.create(props.description);
          if (descriptionResult.isErr()) {
            return err(descriptionResult.error);
          }
          this.props.description = descriptionResult.value;
        }
      }
      
      // Uppdatera timestamp
      this.props.updatedAt = new Date();
      
      // Skapa och publicera TeamUpdatedEvent
      const updatedEvent = new TeamUpdated({
        teamId: this.id,
        name: this.props.name.value,
        description: this.props.description?.value,
        updatedAt: this.props.updatedAt
      });
      
      this.addDomainEvent(updatedEvent);
      
      // Validera invarianter
      const validation = this.validateInvariants();
      if (validation.isErr()) {
        return err(validation.error);
      }
      
      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte uppdatera team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Teamets namn som värde-objekt
   */
  get name(): string {
    return this.props.name.value;
  }

  /**
   * Teamets beskrivning som värde-objekt
   */
  get description(): string | undefined {
    return this.props.description?.value;
  }

  /**
   * ID för teamets ägare
   */
  get ownerId(): UniqueId {
    return this.props.ownerId;
  }

  /**
   * Lista över teamets medlemmar (returnerar kopia för att undvika oväntade ändringar)
   */
  get members(): TeamMember[] {
    return [...this.props.members];
  }

  /**
   * Lista över aktiva inbjudningar till teamet
   */
  get invitations(): TeamInvitation[] {
    return [...this.props.invitations];
  }

  /**
   * Teamets inställningar
   */
  get settings(): TeamSettings {
    return this.props.settings;
  }

  /**
   * Tidpunkt för när teamet skapades
   */
  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  /**
   * Tidpunkt för när teamet senast uppdaterades
   */
  get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  /**
   * Lägger till en inbjudan till teamet
   * 
   * @param invitation Inbjudan att lägga till
   * @returns Result med success eller felmeddelande
   */
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

      // Lägg till inbjudan och uppdatera tidsstämpel
      this.props.invitations.push(invitation);
      this.props.updatedAt = new Date();

      // Publicera domänhändelse
      this.addDomainEvent(new InvitationSent(
        this.id,
        invitation.userId,
        invitation.invitedBy,
        invitation.id
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte lägga till inbjudan: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Hanterar svar på en inbjudan (accept/decline)
   * 
   * @param userId ID för användaren som svarar
   * @param accept True om inbjudan accepteras, false om den avböjs
   * @returns Result med success eller felmeddelande
   */
  public handleInvitationResponse(
    userId: UniqueId, 
    accept: boolean
  ): Result<void, string> {
    try {
      // Hitta inbjudan
      const invitationIndex = this.props.invitations.findIndex(i => 
        i.userId.equals(userId)
      );

      if (invitationIndex === -1) {
        return err('Ingen aktiv inbjudan hittades');
      }

      const invitation = this.props.invitations[invitationIndex];

      // Ta bort inbjudan från listan
      this.props.invitations.splice(invitationIndex, 1);
      this.props.updatedAt = new Date();

      // Publicera domänhändelse baserat på svaret
      if (accept) {
        // Publicera accepteringshändelse
        this.addDomainEvent(new InvitationAccepted(
          this.id,
          userId,
          invitation.invitedBy,
          invitation.id
        ));

        // Skapa och lägg till ny medlem
        const memberResult = TeamMember.create({
          userId,
          role: TeamRole.MEMBER,
          joinedAt: new Date()
        });

        if (memberResult.isErr()) {
          return err(memberResult.error);
        }

        return this.addMember(memberResult.value);
      } else {
        // Publicera nekningshändelse
        this.addDomainEvent(new InvitationDeclined(
          this.id,
          userId,
          invitation.invitedBy,
          invitation.id
        ));
      }

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte hantera inbjudan: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Kontrollerar om en roll har en specifik behörighet
   * @param role Rollen att kontrollera
   * @param permission Behörigheten att kontrollera
   * @returns Sant om rollen har behörigheten
   */
  public hasPermission(role: TeamRole | string, permission: TeamPermission | string): boolean {
    // Använd roleHasPermission från DefaultRolePermissions
    return roleHasPermission(role, permission);
  }

  /**
   * Kontrollerar om en medlem har en specifik behörighet
   * @param userId ID för medlemmen att kontrollera
   * @param permission Behörigheten att kontrollera
   * @returns Sant om medlemmen har behörigheten
   */
  public hasMemberPermission(userId: UniqueId, permission: TeamPermission | string): boolean {
    // Hitta medlemmen
    const member = this.props.members.find(m => m.userId.equals(userId));
    if (!member) return false;

    // Konvertera sträng till enum om det är en sträng
    const permissionEnum = typeof permission === 'string' 
      ? permission 
      : permission instanceof TeamPermissionValue
        ? permission.toString()
        : permission.toString();

    // Kontrollera behörighet baserat på medlemsrollen
    return this.hasPermission(member.role, permissionEnum);
  }
  
  /**
   * Kontrollerar om en medlem finns i teamet
   * 
   * @param userId ID för medlemmen att kontrollera
   * @returns True om medlemmen finns, annars false
   */
  public hasMember(userId: UniqueId): boolean {
    return this.props.members.some(m => m.userId.equals(userId));
  }
  
  /**
   * Hämtar en medlem från teamet
   * 
   * @param userId ID för medlemmen att hämta
   * @returns TeamMember om medlemmen finns, annars undefined
   */
  public getMember(userId: UniqueId): TeamMember | undefined {
    return this.props.members.find(m => m.userId.equals(userId));
  }
  
  /**
   * Kontrollerar om teamet är fullt (nått maxMembers)
   * 
   * @returns True om teamet är fullt, annars false
   */
  public isFull(): boolean {
    const maxMembers = this.props.settings.props.maxMembers;
    return maxMembers !== undefined && this.props.members.length >= maxMembers;
  }

  /**
   * Uppdaterar notifikationsinställningar för teamet
   * 
   * @param notificationSettings De nya notifikationsinställningarna
   * @returns Result med success eller felmeddelande
   */
  public updateNotificationSettings(
    notificationSettings: Partial<TeamSettingsProps['notificationSettings']>
  ): Result<void, string> {
    try {
      const settingsResult = this.props.settings.updateNotifications(notificationSettings);
      if (settingsResult.isErr()) {
        return err(`Kunde inte uppdatera notifikationsinställningar: ${settingsResult.error}`);
      }
      
      this.props.settings = settingsResult.value;
      this.props.updatedAt = new Date();
      
      // Publicera inställningsuppdateringshändelse
      this.addDomainEvent(new TeamSettingsUpdated(
        this.id,
        this.props.settings.toDTO()
      ));
      
      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte uppdatera notifikationsinställningar: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Uppdaterar kommunikationsinställningar för teamet
   * 
   * @param communications De nya kommunikationsinställningarna
   * @returns Result med success eller felmeddelande
   */
  public updateCommunicationSettings(
    communications: Partial<TeamSettingsProps['communications']>
  ): Result<void, string> {
    try {
      const settingsResult = this.props.settings.updateCommunications(communications);
      if (settingsResult.isErr()) {
        return err(`Kunde inte uppdatera kommunikationsinställningar: ${settingsResult.error}`);
      }
      
      this.props.settings = settingsResult.value;
      this.props.updatedAt = new Date();
      
      // Publicera inställningsuppdateringshändelse
      this.addDomainEvent(new TeamSettingsUpdated(
        this.id,
        this.props.settings.toDTO()
      ));
      
      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte uppdatera kommunikationsinställningar: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Uppdaterar behörighetsinställningar för teamet
   * 
   * @param permissions De nya behörighetsinställningarna
   * @returns Result med success eller felmeddelande
   */
  public updatePermissionSettings(
    permissions: Partial<TeamSettingsProps['permissions']>
  ): Result<void, string> {
    try {
      const settingsResult = this.props.settings.updatePermissions(permissions);
      if (settingsResult.isErr()) {
        return err(`Kunde inte uppdatera behörighetsinställningar: ${settingsResult.error}`);
      }
      
      this.props.settings = settingsResult.value;
      this.props.updatedAt = new Date();
      
      // Publicera inställningsuppdateringshändelse
      this.addDomainEvent(new TeamSettingsUpdated(
        this.id,
        this.props.settings.toDTO()
      ));
      
      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte uppdatera behörighetsinställningar: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 