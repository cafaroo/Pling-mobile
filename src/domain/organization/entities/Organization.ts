import { AggregateRoot } from '@/shared/core/AggregateRoot';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { OrganizationMember } from '../value-objects/OrganizationMember';
import { OrganizationInvitation } from '../value-objects/OrganizationInvitation';
import { OrgSettings } from '../value-objects/OrgSettings';
import { OrganizationRole } from '../value-objects/OrganizationRole';
import { OrganizationPermission } from '../value-objects/OrganizationPermission';
import { 
  OrganizationCreated, 
  OrganizationUpdated, 
  MemberJoinedOrganization, 
  MemberLeftOrganization,
  MemberInvitedToOrganization,
  OrganizationMemberRoleChanged,
  TeamAddedToOrganization,
  TeamRemovedFromOrganization,
  OrganizationInvitationAccepted,
  OrganizationInvitationDeclined
} from '../events/OrganizationEvents';
import { SubscriptionService } from '../interfaces/SubscriptionService';
import { ResourceLimitType } from '../interfaces/SubscriptionService';
import { ResourceLimitStrategyFactory } from '../strategies/ResourceLimitStrategyFactory';
import { ResourceType, LimitCheckResult } from '../strategies/ResourceLimitStrategy';

export interface OrganizationProps {
  id: UniqueId;
  name: string;
  ownerId: UniqueId;
  settings: OrgSettings;
  members: OrganizationMember[];
  invitations: OrganizationInvitation[];
  teamIds: UniqueId[];
  createdAt: Date;
  updatedAt: Date;
}

export type OrganizationCreateDTO = {
  name: string;
  ownerId: string | UniqueId;
};

export type OrganizationUpdateDTO = {
  name?: string;
  settings?: Partial<OrgSettings>;
};

export class Organization extends AggregateRoot<OrganizationProps> {
  private subscriptionService?: SubscriptionService;
  private limitStrategyFactory?: ResourceLimitStrategyFactory;

  private constructor(props: OrganizationProps) {
    super(props);
  }

  get name(): string {
    return this.props.name;
  }

  get ownerId(): UniqueId {
    return this.props.ownerId;
  }

  get members(): OrganizationMember[] {
    return this.props.members;
  }

  get invitations(): OrganizationInvitation[] {
    return this.props.invitations;
  }

  get settings(): OrgSettings {
    return this.props.settings;
  }

  get teamIds(): UniqueId[] {
    return [...this.props.teamIds];
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  public setSubscriptionService(service: SubscriptionService): void {
    this.subscriptionService = service;
  }

  /**
   * Sätter factory för resursbegränsningsstrategier.
   * 
   * @param factory - Factory för att skapa strategier
   */
  public setLimitStrategyFactory(factory: ResourceLimitStrategyFactory): void {
    this.limitStrategyFactory = factory;
  }

  public async hasActiveSubscription(): Promise<boolean> {
    if (!this.subscriptionService) {
      return true;
    }

    return await this.subscriptionService.hasActiveSubscription(this.id);
  }

  /**
   * Kontrollerar om en användare kan läggas till i organisationen baserat på resursbegränsningar.
   * 
   * @param addCount - Antal användare att lägga till
   * @returns Resultat med information om begränsningen
   */
  public async canAddMoreMembers(addCount: number = 1): Promise<Result<LimitCheckResult, string>> {
    try {
      // Använd den nya strategin om tillgänglig
      if (this.limitStrategyFactory) {
        const strategy = this.limitStrategyFactory.getTeamMemberStrategy();
        const result = await strategy.isActionAllowed(
          this.id,
          this.props.members.length,
          addCount
        );
        
        if (!result.allowed) {
          return Result.fail(result.reason || 'Du har nått gränsen för antal teammedlemmar i din prenumerationsplan.');
        }
        
        return Result.ok(result);
      }
      
      // Fallback till tidigare canPerformResourceAction
      const canAddResult = await this.canPerformResourceAction(
        ResourceLimitType.TEAM_MEMBERS,
        addCount
      );
      
      if (canAddResult.isErr()) {
        return Result.fail(canAddResult.error);
      }
      
      return Result.ok({
        allowed: true,
        limit: this.props.settings.maxMembers || 3,
        currentUsage: this.props.members.length,
        usagePercentage: this.props.settings.maxMembers ? 
          Math.round((this.props.members.length / this.props.settings.maxMembers) * 100) : 
          0
      });
    } catch (error) {
      return Result.fail(`Kunde inte kontrollera medlemsbegränsning: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Kontrollerar om ett team kan läggas till i organisationen baserat på resursbegränsningar.
   * 
   * @param addCount - Antal team att lägga till
   * @returns Resultat med information om begränsningen
   */
  public async canAddMoreTeams(addCount: number = 1): Promise<Result<LimitCheckResult, string>> {
    try {
      // Använd den nya strategin om tillgänglig
      if (this.limitStrategyFactory) {
        const strategy = this.limitStrategyFactory.getTeamStrategy();
        const result = await strategy.isActionAllowed(
          this.id,
          this.props.teamIds.length,
          addCount
        );
        
        if (!result.allowed) {
          return Result.fail(result.reason || 'Du har nått gränsen för antal team i din prenumerationsplan.');
        }
        
        return Result.ok(result);
      }
      
      // Fallback till tidigare canPerformResourceAction
      const canAddResult = await this.canPerformResourceAction(
        ResourceLimitType.TEAMS,
        addCount
      );
      
      if (canAddResult.isErr()) {
        return Result.fail(canAddResult.error);
      }
      
      return Result.ok({
        allowed: true,
        limit: this.props.settings.maxTeams || 1,
        currentUsage: this.props.teamIds.length,
        usagePercentage: this.props.settings.maxTeams ? 
          Math.round((this.props.teamIds.length / this.props.settings.maxTeams) * 100) : 
          0
      });
    } catch (error) {
      return Result.fail(`Kunde inte kontrollera teambegränsning: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Kontrollerar om en resurs av specifik typ kan läggas till i organisationen baserat på resursbegränsningar.
   * 
   * @param resourceType - Typ av resurs att kontrollera
   * @param currentCount - Nuvarande antal av resursen
   * @param addCount - Antal resurser att lägga till
   * @returns Resultat med information om begränsningen
   */
  public async canAddMoreResources(
    resourceType: ResourceType,
    currentCount: number,
    addCount: number = 1
  ): Promise<Result<LimitCheckResult, string>> {
    try {
      // Använd den nya strategin om tillgänglig
      if (this.limitStrategyFactory) {
        const strategy = this.limitStrategyFactory.getResourceStrategy(resourceType);
        const result = await strategy.isActionAllowed(
          this.id,
          currentCount,
          addCount
        );
        
        if (!result.allowed) {
          return Result.fail(result.reason || `Du har nått gränsen för denna resurstyp i din prenumerationsplan.`);
        }
        
        return Result.ok(result);
      }
      
      // Fallback till tidigare canPerformResourceAction baserat på resurstyp
      let limitType: ResourceLimitType;
      switch (resourceType) {
        case ResourceType.GOAL:
          limitType = ResourceLimitType.GOALS;
          break;
        case ResourceType.COMPETITION:
          limitType = ResourceLimitType.COMPETITIONS;
          break;
        case ResourceType.DASHBOARD:
          limitType = ResourceLimitType.DASHBOARDS;
          break;
        case ResourceType.REPORT:
          limitType = ResourceLimitType.REPORTS;
          break;
        case ResourceType.MEDIA:
          limitType = ResourceLimitType.MEDIA_STORAGE;
          break;
        default:
          limitType = ResourceLimitType.GENERAL;
      }
      
      const canAddResult = await this.canPerformResourceAction(
        limitType,
        addCount
      );
      
      if (canAddResult.isErr()) {
        return Result.fail(canAddResult.error);
      }
      
      return Result.ok({
        allowed: true,
        limit: 5, // Standardgräns
        currentUsage: currentCount,
        usagePercentage: Math.round((currentCount / 5) * 100)
      });
    } catch (error) {
      return Result.fail(`Kunde inte kontrollera resursbegränsning: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async canPerformResourceAction(
    limitType: ResourceLimitType,
    additionalUsage: number = 1
  ): Promise<Result<boolean, string>> {
    if (!this.subscriptionService) {
      return Result.ok(true);
    }

    const validationResult = await this.subscriptionService.validateResourceLimit(
      this.id,
      limitType,
      additionalUsage
    );

    if (validationResult.isErr()) {
      return Result.fail(validationResult.error);
    }

    const validation = validationResult.value;
    
    if (!validation.isAllowed) {
      return Result.fail(validation.message);
    }

    return Result.ok(true);
  }

  public async getSubscriptionManagementUrl(): Promise<Result<string, string>> {
    if (!this.subscriptionService) {
      return Result.fail('Prenumerationstjänsten är inte tillgänglig');
    }

    return await this.subscriptionService.getSubscriptionManagementUrl(this.id);
  }

  // Skapa en ny organisation
  public static create(props: OrganizationCreateDTO): Result<Organization, string> {
    try {
      const id = new UniqueId();
      const ownerId = props.ownerId instanceof UniqueId 
        ? props.ownerId 
        : new UniqueId(props.ownerId);

      // Validering
      if (!props.name || props.name.trim().length < 2) {
        return err('Organisationsnamn måste vara minst 2 tecken');
      }

      // Skapa inställningar
      const orgSettingsResult = OrgSettings.create();
      if (orgSettingsResult.isErr()) {
        return err(`Kunde inte skapa organisationsinställningar: ${orgSettingsResult.error}`);
      }

      // Skapa ägarens medlemskap med owner-roll
      const ownerMemberResult = OrganizationMember.create({
        userId: ownerId,
        role: OrganizationRole.OWNER,
        joinedAt: new Date()
      });

      if (ownerMemberResult.isErr()) {
        return err(`Kunde inte skapa ägarmedlemskap: ${ownerMemberResult.error}`);
      }

      const now = new Date();

      const organization = new Organization({
        id,
        name: props.name.trim(),
        ownerId,
        members: [ownerMemberResult.value],
        invitations: [],
        teamIds: [],
        settings: orgSettingsResult.value,
        createdAt: now,
        updatedAt: now
      });

      // Lägg till domänhändelse
      organization.addDomainEvent(new OrganizationCreated(
        id,
        ownerId,
        props.name.trim()
      ));

      return ok(organization);
    } catch (error) {
      return err(`Kunde inte skapa organisation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Uppdatera organisation
  public update(updateDTO: OrganizationUpdateDTO): Result<void, string> {
    try {
      if (updateDTO.name && updateDTO.name.trim().length < 2) {
        return err('Organisationsnamn måste vara minst 2 tecken');
      }

      // Uppdatera organisationen
      if (updateDTO.name) {
        this.props.name = updateDTO.name.trim();
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
      this.addDomainEvent(new OrganizationUpdated(
        this.id,
        this.name
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte uppdatera organisation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Lägg till medlem
  public addMember(member: OrganizationMember): Result<void, string> {
    try {
      // Kontrollera om användaren redan är medlem
      const existingMember = this.props.members.find(m => 
        m.userId.toString() === member.userId.toString()
      );

      if (existingMember) {
        return err('Användaren är redan medlem i organisationen');
      }

      // Kontrollera medlemsgräns om den finns definierad
      if (this.props.settings.maxMembers && this.props.members.length >= this.props.settings.maxMembers) {
        return err('Organisationen har nått sin medlemsgräns');
      }

      // Lägg till medlemmen
      this.props.members.push(member);
      this.props.updatedAt = new Date();

      // Lägg till domänhändelse
      this.addDomainEvent(new MemberJoinedOrganization(
        this.id,
        member.userId,
        member.role
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte lägga till medlem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Ta bort medlem
  public removeMember(userId: UniqueId): Result<void, string> {
    try {
      // Kontrollera om användaren är ägare
      if (this.props.ownerId.equals(userId)) {
        return err('Ägaren kan inte tas bort från organisationen');
      }

      // Hitta och ta bort medlemmen
      const initialLength = this.props.members.length;
      this.props.members = this.props.members.filter(m => 
        !m.userId.equals(userId)
      );

      if (this.props.members.length === initialLength) {
        return err('Användaren är inte medlem i organisationen');
      }

      this.props.updatedAt = new Date();

      // Lägg till domänhändelse
      this.addDomainEvent(new MemberLeftOrganization(
        this.id,
        userId
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte ta bort medlem: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Uppdatera medlemsroll
  public updateMemberRole(userId: UniqueId, newRole: OrganizationRole): Result<void, string> {
    try {
      // Hitta medlemmen
      const memberIndex = this.props.members.findIndex(m => 
        m.userId.equals(userId)
      );

      if (memberIndex === -1) {
        return err('Användaren är inte medlem i organisationen');
      }

      // Kontrollera om användaren är ägare - ägaren kan inte få ny roll
      if (this.props.ownerId.equals(userId)) {
        return err('Ägarens roll kan inte ändras');
      }

      const oldRole = this.props.members[memberIndex].role;
      
      // Skapa ny medlem med uppdaterad roll
      const updatedMemberResult = OrganizationMember.create({
        userId: userId,
        role: newRole,
        joinedAt: this.props.members[memberIndex].joinedAt
      });

      if (updatedMemberResult.isErr()) {
        return err(`Kunde inte uppdatera medlemsroll: ${updatedMemberResult.error}`);
      }

      // Uppdatera medlemmen
      this.props.members[memberIndex] = updatedMemberResult.value;
      this.props.updatedAt = new Date();

      // Lägg till domänhändelse
      this.addDomainEvent(new OrganizationMemberRoleChanged(
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
  
  // Bjud in användare till organization
  public inviteUser(userId: UniqueId, email: string, invitedBy: UniqueId, role: OrganizationRole = OrganizationRole.MEMBER): Result<void, string> {
    try {
      // Kontrollera om användaren redan har en aktiv inbjudan
      const existingInvitation = this.props.invitations.find(i => 
        i.userId.equals(userId) && i.isPending()
      );

      if (existingInvitation) {
        return err('Det finns redan en aktiv inbjudan för denna användare');
      }

      // Kontrollera om användaren redan är medlem
      const existingMember = this.props.members.find(m => m.userId.equals(userId));
      
      if (existingMember) {
        return err('Användaren är redan medlem i organisationen');
      }

      // Kontrollera medlemsgräns om den finns definierad
      if (this.props.settings.maxMembers && 
          this.props.members.length + this.getPendingInvitations().length >= this.props.settings.maxMembers) {
        return err('Organisationen har nått sin medlemsgräns');
      }

      // Skapa inbjudan
      const invitationResult = OrganizationInvitation.create({
        organizationId: this.id,
        userId: userId,
        invitedBy: invitedBy,
        email: email,
        createdAt: new Date()
      });

      if (invitationResult.isErr()) {
        return err(`Kunde inte skapa inbjudan: ${invitationResult.error}`);
      }

      // Lägg till inbjudan
      this.props.invitations.push(invitationResult.value);
      this.props.updatedAt = new Date();

      // Lägg till domänhändelse
      this.addDomainEvent(new MemberInvitedToOrganization(
        this.id,
        userId,
        invitedBy
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte bjuda in användare: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Acceptera en inbjudan
  public acceptInvitation(invitationId: UniqueId, userId: UniqueId): Result<void, string> {
    try {
      // Hitta inbjudan
      const invitationIndex = this.props.invitations.findIndex(i => i.id.equals(invitationId));
      
      if (invitationIndex === -1) {
        return err('Inbjudan hittades inte');
      }

      const invitation = this.props.invitations[invitationIndex];

      // Kontrollera att det är användaren som matchas mot inbjudan som accepterar
      if (!invitation.userId.equals(userId)) {
        return err('Användaren matchar inte inbjudan');
      }

      // Kontrollera om inbjudan är giltig
      if (!invitation.isPending()) {
        return err('Inbjudan är inte längre giltig');
      }

      // Acceptera inbjudan
      const acceptResult = invitation.accept();
      if (acceptResult.isErr()) {
        return err(acceptResult.error);
      }

      // Skapa ny medlem med medlemsroll
      const newMemberResult = OrganizationMember.create({
        userId,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date()
      });

      if (newMemberResult.isErr()) {
        return err(`Kunde inte skapa medlem: ${newMemberResult.error}`);
      }

      // Lägg till medlemmen
      this.props.members.push(newMemberResult.value);
      
      // Uppdatera inbjudan i listan
      this.props.invitations[invitationIndex] = acceptResult.value;
      
      this.props.updatedAt = new Date();

      // Lägg till domänhändelser
      this.addDomainEvent(new OrganizationInvitationAccepted(
        this.id,
        invitationId,
        userId
      ));

      this.addDomainEvent(new MemberJoinedOrganization(
        this.id,
        userId,
        OrganizationRole.MEMBER
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte acceptera inbjudan: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Avböj en inbjudan
  public declineInvitation(invitationId: UniqueId, userId: UniqueId): Result<void, string> {
    try {
      // Hitta inbjudan
      const invitationIndex = this.props.invitations.findIndex(i => i.id.equals(invitationId));
      
      if (invitationIndex === -1) {
        return err('Inbjudan hittades inte');
      }

      const invitation = this.props.invitations[invitationIndex];

      // Kontrollera att det är användaren som matchas mot inbjudan som avböjer
      if (!invitation.userId.equals(userId)) {
        return err('Användaren matchar inte inbjudan');
      }

      // Kontrollera om inbjudan är giltig
      if (!invitation.isPending()) {
        return err('Inbjudan är inte längre giltig');
      }

      // Avböj inbjudan
      const declineResult = invitation.decline();
      if (declineResult.isErr()) {
        return err(declineResult.error);
      }

      // Uppdatera inbjudan i listan
      this.props.invitations[invitationIndex] = declineResult.value;
      this.props.updatedAt = new Date();

      // Lägg till domänhändelse
      this.addDomainEvent(new OrganizationInvitationDeclined(
        this.id,
        invitationId,
        userId
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte avböja inbjudan: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Ta bort en inbjudan
  public removeInvitation(invitationId: UniqueId): Result<void, string> {
    try {
      // Hitta och ta bort inbjudan
      const initialLength = this.props.invitations.length;
      this.props.invitations = this.props.invitations.filter(i => !i.id.equals(invitationId));

      if (this.props.invitations.length === initialLength) {
        return err('Inbjudan hittades inte');
      }

      this.props.updatedAt = new Date();

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte ta bort inbjudan: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Hämta aktiva inbjudningar
  public getPendingInvitations(): OrganizationInvitation[] {
    return this.props.invitations.filter(i => i.isPending());
  }

  // Markera utgångna inbjudningar
  public expireInvitations(): void {
    const now = new Date();
    this.props.invitations = this.props.invitations.map(invitation => {
      if (invitation.isPending() && invitation.expiresAt && invitation.expiresAt < now) {
        const expireResult = invitation.expire();
        if (expireResult.isOk()) {
          return expireResult.value;
        }
      }
      return invitation;
    });
  }

  // Lägg till team till organisationen
  public addTeam(teamId: UniqueId): Result<void, string> {
    try {
      // Kontrollera om teamet redan är kopplat till organisationen
      const teamExists = this.props.teamIds.some(id => id.equals(teamId));
      if (teamExists) {
        return err('Teamet är redan kopplat till organisationen');
      }

      // Lägg till teamet
      this.props.teamIds.push(teamId);
      this.props.updatedAt = new Date();

      // Lägg till domänhändelse
      this.addDomainEvent(new TeamAddedToOrganization(
        this.id,
        teamId
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte lägga till team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Ta bort team från organisationen
  public removeTeam(teamId: UniqueId): Result<void, string> {
    try {
      // Hitta och ta bort teamet
      const initialLength = this.props.teamIds.length;
      this.props.teamIds = this.props.teamIds.filter(id => !id.equals(teamId));

      if (this.props.teamIds.length === initialLength) {
        return err('Teamet är inte kopplat till organisationen');
      }

      this.props.updatedAt = new Date();

      // Lägg till domänhändelse
      this.addDomainEvent(new TeamRemovedFromOrganization(
        this.id,
        teamId
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte ta bort team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Kontrollera om en användare har en specifik behörighet
  public hasMemberPermission(userId: UniqueId, permission: OrganizationPermission): boolean {
    try {
      const member = this.props.members.find(m => m.userId.equals(userId));
      if (!member) {
        return false;
      }

      return member.hasPermission(permission);
    } catch (error) {
      return false;
    }
  }
} 