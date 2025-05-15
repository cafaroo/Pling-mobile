import { AggregateRoot } from '@/shared/domain/AggregateRoot';
import { UniqueId } from '@/shared/domain/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { TeamMember } from '../value-objects/TeamMember';
import { TeamInvitation } from '../value-objects/TeamInvitation';
import { TeamSettings, TeamSettingsProps } from './TeamSettings';
import { TeamRole } from '../value-objects/TeamRole';
import { TeamPermission } from '../value-objects/TeamPermission';
import { 
  MemberJoined, 
  MemberLeft, 
  TeamMemberRoleChanged, 
  TeamCreated, 
  TeamUpdated, 
  InvitationSent,
  InvitationAccepted,
  InvitationDeclined,
  TeamSettingsUpdated
} from '../events/TeamEvents';
import { TeamName } from '../value-objects/TeamName';
import { TeamDescription } from '../value-objects/TeamDescription';
import { IDomainEvent } from '@/shared/domain/events/IDomainEvent';

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
  description?: string;
  settings?: Partial<TeamSettingsProps>;
}

/**
 * Team
 * 
 * Aggregatrot för teamdomänen som representerar ett team i systemet.
 * Hanterar medlemsskap, roller, inbjudningar och teamrelaterade operationer.
 */
export class Team extends AggregateRoot<TeamProps> {
  private constructor(props: TeamProps, id?: UniqueId) {
    super(props, id);
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
   * Skapa ett nytt team med validering och domänevents
   * 
   * @param props Egenskaper för det nya teamet
   * @returns Result med Team eller felmeddelande
   */
  public static create(props: TeamCreateDTO): Result<Team, string> {
    try {
      // Skapa och validera UniqueId
      const ownerId = props.ownerId instanceof UniqueId 
        ? props.ownerId 
        : new UniqueId(props.ownerId);

      // Validera och skapa TeamName värde-objekt
      const nameResult = TeamName.create(props.name);
      if (nameResult.isErr()) {
        return err(nameResult.error);
      }
      
      // Validera och skapa TeamDescription värde-objekt om det finns
      let descriptionValueObject: TeamDescription | undefined;
      if (props.description !== undefined) {
        const descriptionResult = TeamDescription.create(props.description);
        if (descriptionResult.isErr()) {
          return err(descriptionResult.error);
        }
        descriptionValueObject = descriptionResult.value;
      }

      // Skapa standardinställningar eller använd anpassade inställningar med bättre felhantering
      const settingsResult = props.settings 
        ? TeamSettings.create(props.settings)
        : TeamSettings.createDefault();
      
      if (settingsResult.isErr()) {
        return err(`Kunde inte skapa teaminställningar: ${settingsResult.error}`);
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
      const id = new UniqueId();

      // Skapa nytt team med den nya strukturen
      const team = new Team({
        name: nameResult.value,
        description: descriptionValueObject,
        ownerId,
        members: [ownerMemberResult.value],
        invitations: [],
        settings: settingsResult.value,
        createdAt: now,
        updatedAt: now
      }, id);

      // Lägg till domänhändelse för teamskapande
      team.addDomainEvent(new TeamCreated(
        id,
        ownerId,
        nameResult.value.value
      ));

      return ok(team);
    } catch (error) {
      return err(`Kunde inte skapa team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Uppdatera team med validering och domänevents
   * 
   * @param updateDTO DTO med uppdateringsinformation
   * @returns Result med success eller felmeddelande
   */
  public update(updateDTO: TeamUpdateDTO): Result<void, string> {
    try {
      // Hantera uppdatering av namn
      if (updateDTO.name) {
        const nameResult = TeamName.create(updateDTO.name);
        if (nameResult.isErr()) {
          return err(nameResult.error);
        }
        this.props.name = nameResult.value;
      }

      // Hantera uppdatering av beskrivning
      if (updateDTO.description !== undefined) {
        const descriptionResult = TeamDescription.create(updateDTO.description);
        if (descriptionResult.isErr()) {
          return err(descriptionResult.error);
        }
        this.props.description = descriptionResult.value;
      }

      // Hantera uppdatering av inställningar med korrekt typning
      if (updateDTO.settings) {
        const settingsResult = this.props.settings.update(updateDTO.settings);
        if (settingsResult.isErr()) {
          return err(`Kunde inte uppdatera teaminställningar: ${settingsResult.error}`);
        }
        
        this.props.settings = settingsResult.value;
        
        // Publicera inställningsuppdateringshändelse
        this.addDomainEvent(new TeamSettingsUpdated(
          this.id,
          settingsResult.value.toDTO()
        ));
      }

      this.props.updatedAt = new Date();

      // Publicera teamuppdateringshändelse
      this.addDomainEvent(new TeamUpdated(
        this.id,
        this.props.name.value
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte uppdatera team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Lägger till en ny medlem till teamet
   * 
   * @param member Medlemmen att lägga till
   * @returns Result med success eller felmeddelande
   */
  public addMember(member: TeamMember): Result<void, string> {
    try {
      // Kontrollera om användaren redan är medlem
      const existingMember = this.props.members.find(m => 
        m.userId.toString() === member.userId.toString()
      );

      if (existingMember) {
        return err('Användaren är redan medlem i teamet');
      }

      // Förbättrad kontroll av medlemsgräns med TeamSettings
      const maxMembers = this.props.settings.props.maxMembers;
      if (maxMembers && this.props.members.length >= maxMembers) {
        return err(`Teamet har nått sin medlemsgräns på ${maxMembers} medlemmar`);
      }

      // Kontrollera om teamet kräver godkännande men användaren inte har det
      if (this.props.settings.props.requiresApproval && !member.isApproved) {
        return err('Användaren måste godkännas för att gå med i teamet');
      }

      // Lägg till medlemmen och uppdatera tidsstämpel
      this.props.members.push(member);
      this.props.updatedAt = new Date();

      // Publicera domänhändelse
      this.addDomainEvent(new MemberJoined(
        this.id,
        member.userId,
        member.role
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte lägga till medlem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Tar bort en medlem från teamet
   * 
   * @param userId ID för medlemmen att ta bort
   * @returns Result med success eller felmeddelande
   */
  public removeMember(userId: UniqueId): Result<void, string> {
    try {
      // Kontrollera om användaren är ägare
      if (this.props.ownerId.equals(userId)) {
        return err('Ägaren kan inte tas bort från teamet');
      }

      // Kontrollera om användaren är medlem
      const memberIndex = this.props.members.findIndex(m => m.userId.equals(userId));
      if (memberIndex === -1) {
        return err('Användaren är inte medlem i teamet');
      }

      // Ta bort medlemmen och uppdatera tidsstämpel
      this.props.members.splice(memberIndex, 1);
      this.props.updatedAt = new Date();

      // Publicera domänhändelse
      this.addDomainEvent(new MemberLeft(
        this.id,
        userId
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte ta bort medlem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Uppdaterar en medlems roll i teamet
   * 
   * @param userId ID för medlemmen
   * @param newRole Ny roll för medlemmen
   * @returns Result med success eller felmeddelande
   */
  public updateMemberRole(userId: UniqueId, newRole: TeamRole): Result<void, string> {
    try {
      // Hitta medlemmen
      const memberIndex = this.props.members.findIndex(m => m.userId.equals(userId));
      if (memberIndex === -1) {
        return err('Användaren är inte medlem i teamet');
      }

      const member = this.props.members[memberIndex];

      // Kontrollera om användaren är ägare (kan inte ändra ägarens roll)
      if (this.props.ownerId.equals(userId) && newRole !== TeamRole.OWNER) {
        return err('Ägarens roll kan inte ändras från OWNER');
      }

      // Spara gamla rollen för eventet
      const oldRole = member.role;
      
      // Skapa en uppdaterad TeamMember med den nya rollen
      const updatedMemberResult = TeamMember.create({
        userId: member.userId,
        role: newRole,
        joinedAt: member.joinedAt
      });
      
      if (updatedMemberResult.isErr()) {
        return err(updatedMemberResult.error);
      }

      // Ersätt den gamla medlemmen med den uppdaterade
      this.props.members[memberIndex] = updatedMemberResult.value;
      this.props.updatedAt = new Date();

      // Publicera domänhändelse
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
   * Kontrollerar om en medlem har en viss behörighet
   * 
   * @param userId ID för medlemmen
   * @param permission Behörighet att kontrollera
   * @returns True om medlemmen har behörigheten, annars false
   */
  public hasMemberPermission(userId: UniqueId, permission: TeamPermission): boolean {
    // Hitta medlemmen
    const member = this.props.members.find(m => m.userId.equals(userId));

    if (!member) {
      return false;
    }

    // Kontrollera behörighet baserat på medlemmens roll
    switch (member.role) {
      case TeamRole.OWNER:
        // Ägare har alla behörigheter
        return true;
        
      case TeamRole.ADMIN:
        // Administratör har alla behörigheter förutom att ta bort teamet
        return permission !== TeamPermission.DELETE_TEAM;
        
      case TeamRole.MEMBER:
        // Vanlig medlem har grundläggande behörigheter
        return [
          TeamPermission.VIEW_TEAM,
          TeamPermission.SEND_MESSAGES,
          TeamPermission.UPLOAD_FILES,
          TeamPermission.JOIN_ACTIVITIES,
          TeamPermission.CREATE_POSTS,
        ].includes(permission);
        
      case TeamRole.GUEST:
        // Gäst har begränsade behörigheter
        return [
          TeamPermission.VIEW_TEAM,
          TeamPermission.JOIN_ACTIVITIES
        ].includes(permission);
        
      default:
        return false;
    }
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