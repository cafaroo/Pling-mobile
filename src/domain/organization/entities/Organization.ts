import { AggregateRoot } from '@/shared/core/AggregateRoot';
import { UniqueId } from '@/shared/core/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { OrganizationMember } from '../value-objects/OrganizationMember';
import { OrganizationInvitation } from '../value-objects/OrganizationInvitation';
import { OrgSettings } from '../value-objects/OrgSettings';
import { OrganizationRole } from '../value-objects/OrganizationRole';
import { OrganizationPermission } from '../value-objects/OrganizationPermission';
import { OrganizationCreatedEvent } from '../events/OrganizationCreatedEvent';
import { OrganizationUpdatedEvent } from '../events/OrganizationUpdatedEvent';
import { OrganizationMemberJoinedEvent } from '../events/OrganizationMemberJoinedEvent';
import { OrganizationMemberLeftEvent } from '../events/OrganizationMemberLeftEvent';
import { OrganizationMemberRoleChangedEvent } from '../events/OrganizationMemberRoleChangedEvent';
import { TeamAddedToOrganizationEvent } from '../events/TeamAddedToOrganizationEvent';
import { TeamRemovedFromOrganizationEvent } from '../events/TeamRemovedFromOrganizationEvent';
import { OrganizationMemberInvitedEvent } from '../events/OrganizationMemberInvitedEvent';
import { OrganizationInvitationAcceptedEvent } from '../events/OrganizationInvitationAcceptedEvent';
import { OrganizationInvitationDeclinedEvent } from '../events/OrganizationInvitationDeclinedEvent';
import { SubscriptionService } from '../interfaces/SubscriptionService';
import { ResourceLimitType } from '../interfaces/SubscriptionService';
import { ResourceLimitStrategyFactory } from '../strategies/ResourceLimitStrategyFactory';
import { ResourceType, LimitCheckResult } from '../strategies/ResourceLimitStrategy';
import { MockDomainEvents } from '@/test-utils/mocks/mockDomainEvents';
import { OrganizationPlanUpdatedEvent } from '../events/OrganizationPlanUpdatedEvent';
import { OrganizationStatusUpdatedEvent } from '../events/OrganizationStatusUpdatedEvent';

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
  status?: string;
  planHistory?: PlanHistoryEntry[];
}

export type PlanHistoryEntry = {
  planId: string;
  changedAt: Date;
  previousPlanId?: string;
  reason?: string;
};

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

  /**
   * Validerar invarianter för organisationsaggregatet.
   * 
   * @returns Result som indikerar om alla invarianter är uppfyllda
   */
  private validateInvariants(): Result<void, string> {
    try {
      // Invariant: Organisation måste ha ett namn
      if (!this.props.name || this.props.name.trim().length === 0) {
        return Result.err('Organisation måste ha ett namn');
      }

      // Invariant: Organisation måste ha en ägare
      if (!this.props.ownerId) {
        return Result.err('Organisation måste ha en ägare');
      }

      // Invariant: Ägaren måste vara medlem i organisationen
      const ownerIsMember = this.props.members.some(
        member => member.userId.equals(this.props.ownerId) && 
                 member.role === OrganizationRole.OWNER
      );
      
      if (!ownerIsMember) {
        return Result.err('Ägaren måste vara medlem i organisationen med OWNER-roll');
      }

      // Invariant: Varje medlem kan bara ha en roll
      const uniqueMembers = new Set();
      for (const member of this.props.members) {
        const memberId = member.userId.toString();
        if (uniqueMembers.has(memberId)) {
          return Result.err('En användare kan bara ha en roll i organisationen');
        }
        uniqueMembers.add(memberId);
      }

      // Alla invarianter uppfyllda
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(`Fel vid validering av invarianter: ${error instanceof Error ? error.message : String(error)}`);
    }
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

  set settings(value: OrgSettings) {
    this.props.settings = value;
  }

  get description(): string {
    return this.props.settings.description;
  }

  get logoUrl(): string {
    return this.props.settings.logoUrl;
  }

  get teamIds(): UniqueId[] {
    return [...this.props.teamIds];
  }

  /**
   * Hämtar alla team-IDs som är kopplade till organisationen
   * @returns En array med team-IDs
   */
  public getTeams(): UniqueId[] {
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
      // Validera obligatoriska fält
      if (!props.name) {
        return err('Organisation måste ha ett namn');
      }

      // Validera att ownerId finns
      if (!props.ownerId) {
        return err('Organisation måste ha en ägare');
      }

      // Validera namn
      if (!props.name || props.name.trim().length === 0) {
        return err('Organisationsnamn får inte vara tomt');
      }
      
      // Validera ägare
      const ownerId = props.ownerId instanceof UniqueId 
        ? props.ownerId 
        : new UniqueId(props.ownerId);
        
      // Skapa ägarens medlemskap
      const ownerMemberResult = OrganizationMember.create({
        userId: ownerId.toString(),
        role: OrganizationRole.OWNER,
        joinedAt: new Date()
      });
      
      if (ownerMemberResult.isErr()) {
        return err(`Kunde inte skapa ägarmedlemskap: ${ownerMemberResult.error}`);
      }
      
      // Skapa standardinställningar
      const settingsResult = OrgSettings.create();
      if (settingsResult.isErr()) {
        return err(`Kunde inte skapa organisationsinställningar: ${settingsResult.error}`);
      }
      
      const now = new Date();
      const id = new UniqueId();
      
      // Skapa organisationen
      const organization = new Organization({
        id,
        name: props.name,
        ownerId,
        settings: settingsResult.value,
        members: [ownerMemberResult.value],
        invitations: [],
        teamIds: [],
        createdAt: now,
        updatedAt: now
      });
      
      // Validera invarianter
      const validationResult = organization.validateInvariants();
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }
      
      // Lägg till domänhändelse med nya EventClass
      const createdEvent = new OrganizationCreatedEvent({
        organizationId: organization.id,
        name: props.name,
        ownerId: props.ownerId,
        createdAt: now
      });
      organization.addDomainEvent(createdEvent);
      
      // Publicera eventet via MockDomainEvents
      MockDomainEvents.publish(createdEvent);
      
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

      // Lägg till domänhändelse med ny standardiserad klass
      this.addDomainEvent(new OrganizationUpdatedEvent(
        this,
        this.name,
        this.props.settings
      ));
      
      // Publicera eventet via MockDomainEvents
      this.domainEvents.forEach(event => MockDomainEvents.publish(event));
      
      // Validate invariants after update
      const validateResult = this.validateInvariants();
      if (validateResult.isErr()) {
        return validateResult;
      }
      
      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte uppdatera organisation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Uppdaterar organisationens inställningar
   * 
   * @param settings - Nya inställningar att tillämpa
   * @returns Result<void, string> - Ok vid framgång, Err med felmeddelande annars
   */
  public updateSettings(settings: { name?: string, description?: string, logoUrl?: string, maxMembers?: number | null }): Result<void, string> {
    try {
      // Validera namn om det finns
      if (settings.name !== undefined) {
        if (!settings.name || settings.name.trim().length === 0) {
          return err('Organisationen måste ha ett namn');
        }
        this.props.name = settings.name;
      }
      
      // Skapa nya inställningar baserade på de befintliga
      const updatedSettingsProps = {
        ...this.props.settings.toJSON(),
      };
      
      // Uppdatera beskrivning om den finns
      if (settings.description !== undefined) {
        updatedSettingsProps.description = settings.description;
      }
      
      // Uppdatera logoUrl om den finns
      if (settings.logoUrl !== undefined) {
        updatedSettingsProps.logoUrl = settings.logoUrl;
      }
      
      // Uppdatera maxMembers om det anges
      if (settings.maxMembers !== undefined) {
        updatedSettingsProps.maxMembers = settings.maxMembers;
      }
      
      // Skapa nya inställningar
      const settingsResult = OrgSettings.create(updatedSettingsProps);
      if (settingsResult.isErr()) {
        return err(`Kunde inte uppdatera inställningar: ${settingsResult.error}`);
      }
      
      // Uppdatera inställningarna
      this.props.settings = settingsResult.value;
      
      // Publicera domänhändelsen
      const event = new OrganizationUpdatedEvent({
        organizationId: this.id,
        name: this.name,
        settings: this.props.settings,
        updatedAt: new Date()
      });
      this.addDomainEvent(event);
      
      // Publicera eventet
      MockDomainEvents.publish(event);
      
      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte uppdatera organisationsinställningar: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Lägg till medlem
  public addMember(memberOrUserId: OrganizationMember | UniqueId, role?: OrganizationRole): Result<void, string> {
    try {
      let member: OrganizationMember;
      
      // Kontrollera om vi får ett OrganizationMember-objekt eller userId + role
      if (memberOrUserId instanceof OrganizationMember) {
        // Gamla sättet med ett OrganizationMember-objekt
        member = memberOrUserId;
      } else if (memberOrUserId instanceof UniqueId && role) {
        // Nya sättet med userId + role som separata parametrar
        const createMemberResult = OrganizationMember.create({
          userId: memberOrUserId,
          role: role,
          joinedAt: new Date()
        });
        
        if (createMemberResult.isErr()) {
          return Result.err(`Kunde inte skapa medlem: ${createMemberResult.error}`);
        }
        
        member = createMemberResult.value;
      } else {
        return Result.err('Ogiltig indata: Antingen OrganizationMember eller (userId + role) krävs');
      }

      // Validera medlemmen
      if (!member || !member.userId) {
        return Result.err('Ogiltig medlem');
      }

      // Kolla om användaren redan är medlem
      const existingMember = this.props.members.find(m => 
        m.userId.equals(member.userId)
      );

      if (existingMember) {
        return Result.err('Användaren är redan medlem i organisationen');
      }

      // Kontrollera maxMembers innan vi lägger till medlemmen
      // Hämta maxMembers från settings, OrgSettings kan returnera null (obegränsat) eller ett nummer
      const maxMembersValue = this.props.settings.maxMembers;
      
      // Om maxMembers är satt till ett faktiskt värde (inte null), kontrollera gränsen
      if (maxMembersValue !== null && this.props.members.length >= maxMembersValue) {
        return err(`Organisationen har nått sin medlemsgräns (${maxMembersValue} medlemmar)`);
      }

      // Lägg till medlemmen
      this.props.members.push(member);
      
      // Uppdatera organisationens uppdateringsdatum
      this.props.updatedAt = new Date();

      // Skapa en händelse för att en ny medlem har anslutit
      const event = new OrganizationMemberJoinedEvent({
        organizationId: this.id,
        userId: member.userId,
        role: member.role,
        joinedAt: new Date()
      });
      
      this.addDomainEvent(event);

      // Anropa validateInvariants efter att ha lagt till medlemmen
      const validateResult = this.validateInvariants();
      if (validateResult.isErr()) {
        return validateResult;
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.err(`Fel när användare skulle läggas till: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Ta bort medlem
  public removeMember(userId: UniqueId): Result<void, string> {
    try {
      // Validera att användaren inte är ägaren
      if (userId.equals(this.props.ownerId)) {
        return Result.err('Ägaren kan inte tas bort från organisationen');
      }

      // Hitta användaren
      const memberIndex = this.props.members.findIndex(
        member => member.userId.equals(userId)
      );

      if (memberIndex === -1) {
        return Result.err('Användaren är inte medlem i organisationen');
      }

      // Ta bort medlemmen
      this.props.members.splice(memberIndex, 1);
      
      // Uppdatera organisationens uppdateringsdatum
      this.props.updatedAt = new Date();

      // Publicera händelse
      const event = new OrganizationMemberLeftEvent({
        organizationId: this.id,
        userId: userId,
        removedAt: new Date()
      });
      
      this.addDomainEvent(event);

      return Result.ok(undefined);
    } catch (error) {
      return Result.err(`Fel när användare skulle tas bort: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Uppdatera medlemsroll
  public updateMemberRole(userId: UniqueId, newRole: OrganizationRole): Result<void, string> {
    try {
      // Validera att användaren inte är ägaren om den nya rollen inte är OWNER
      if (userId.equals(this.props.ownerId) && newRole !== OrganizationRole.OWNER) {
        return Result.err('Ägaren måste ha rollen OWNER');
      }

      // Hitta medlemmen
      const memberIndex = this.props.members.findIndex(
        member => member.userId.equals(userId)
      );

      if (memberIndex === -1) {
        return Result.err('Användaren är inte medlem i organisationen');
      }

      const oldMember = this.props.members[memberIndex];
      const oldRole = oldMember.role;

      // Kontrollera om rollen redan är densamma
      if (oldRole === newRole) {
        return Result.ok(undefined);
      }

      // Skapa ny medlem med den nya rollen
      const newMember = new OrganizationMember({
        userId: oldMember.userId,
        role: newRole,
        joinedAt: oldMember.joinedAt
      });

      // Uppdatera medlemmen
      this.props.members[memberIndex] = newMember;
      
      // Uppdatera organisationens uppdateringsdatum
      this.props.updatedAt = new Date();

      // Publicera händelse
      const event = new OrganizationMemberRoleChangedEvent({
        organizationId: this.id,
        userId: userId,
        oldRole: oldRole,
        newRole: newRole,
        changedAt: new Date()
      });
      
      this.addDomainEvent(event);

      return Result.ok(undefined);
    } catch (error) {
      return Result.err(`Fel när medlemsroll skulle uppdateras: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Bjuder in en användare till organisationen
   * 
   * @param userId Användar-ID att bjuda in
   * @param email Användarens e-postadress
   * @param invitedBy Användare som bjuder in
   * @param role Roll att tilldela om inbjudan accepteras
   * @returns Result om inbjudan lyckades
   */
  public inviteUser(userId: UniqueId, email: string, invitedBy: UniqueId, role: OrganizationRole = OrganizationRole.MEMBER): Result<void, string> {
    try {
      // Kontrollera om användaren redan är medlem
      if (this.props.members.some(m => m.userId.equals(userId))) {
        return err('Användaren är redan medlem i organisationen');
      }
      
      // Kontrollera om det redan finns en aktiv inbjudan för användaren
      if (this.props.invitations.some(i => i.userId.equals(userId) && i.isPending())) {
        return err('Det finns redan en aktiv inbjudan för denna användare');
      }
      
      // Skapa inbjudan - går ut om 7 dagar
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const createInvitationResult = OrganizationInvitation.create({
        organizationId: this.id.toString(),
        userId: userId.toString(),
        invitedBy: invitedBy.toString(),
        email: email,
        expiresAt
      });
      
      if (createInvitationResult.isErr()) {
        return err(`Kunde inte skapa inbjudan: ${createInvitationResult.error}`);
      }
      
      // Lägg till inbjudan i listan
      this.props.invitations.push(createInvitationResult.value);
      
      // Skapa och publicera domänhändelse
      const event = new OrganizationMemberInvitedEvent({
        organizationId: this.id,
        userId: userId,
        email: email,
        invitedBy: invitedBy,
        invitedAt: new Date()
      });
      this.addDomainEvent(event);
      
      // Publicera eventet
      MockDomainEvents.publish(event);
      
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

      // Lägg till domänhändelser och publicera
      const invitationAcceptedEvent = new OrganizationInvitationAcceptedEvent({
        organizationId: this.id,
        invitationId: invitationId,
        userId: userId,
        acceptedAt: new Date()
      });
      this.addDomainEvent(invitationAcceptedEvent);
      MockDomainEvents.publish(invitationAcceptedEvent);

      const memberJoinedEvent = new OrganizationMemberJoinedEvent({
        organizationId: this.id,
        userId: userId,
        role: OrganizationRole.MEMBER,
        joinedAt: new Date()
      });
      this.addDomainEvent(memberJoinedEvent);
      MockDomainEvents.publish(memberJoinedEvent);

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

      // Lägg till domänhändelse och publicera
      const event = new OrganizationInvitationDeclinedEvent({
        organizationId: this.id,
        invitationId: invitationId,
        userId: userId,
        declinedAt: new Date()
      });
      this.addDomainEvent(event);
      MockDomainEvents.publish(event);

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

  /**
   * Lägger till ett team i organisationen.
   * 
   * @param teamId - ID för teamet som ska läggas till
   * @returns Result som indikerar om operationen lyckades
   */
  public addTeam(teamId: UniqueId): Result<void, string> {
    try {
      // Kontrollera om teamet redan finns i organisationen
      if (this.props.teamIds.some(id => id.equals(teamId))) {
        return Result.err('Teamet finns redan i organisationen');
      }

      // Kolla resursbegränsningar om implementerat
      if (this.limitStrategyFactory) {
        // Detta hanteras asynkront i en annan funktion (canAddMoreTeams)
        // men vi litar här på att klienten har kontrollerat detta
      }

      // Lägg till teamet
      this.props.teamIds.push(teamId);
      
      // Uppdatera organisationens uppdateringsdatum
      this.props.updatedAt = new Date();

      // Publicera händelse
      const event = new TeamAddedToOrganizationEvent({
        organizationId: this.id,
        teamId: teamId,
        addedAt: new Date()
      });
      
      this.addDomainEvent(event);

      return Result.ok(undefined);
    } catch (error) {
      return Result.err(`Fel när team skulle läggas till: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Tar bort ett team från organisationen.
   * 
   * @param teamId - ID för teamet som ska tas bort
   * @returns Result som indikerar om operationen lyckades
   */
  public removeTeam(teamId: UniqueId): Result<void, string> {
    try {
      // Hitta teamet
      const teamIndex = this.props.teamIds.findIndex(id => id.equals(teamId));

      if (teamIndex === -1) {
        return Result.err('Teamet finns inte i organisationen');
      }

      // Ta bort teamet
      this.props.teamIds.splice(teamIndex, 1);
      
      // Uppdatera organisationens uppdateringsdatum
      this.props.updatedAt = new Date();

      // Publicera händelse
      const event = new TeamRemovedFromOrganizationEvent({
        organizationId: this.id,
        teamId: teamId,
        removedAt: new Date()
      });
      
      this.addDomainEvent(event);

      return Result.ok(undefined);
    } catch (error) {
      return Result.err(`Fel när team skulle tas bort: ${error instanceof Error ? error.message : String(error)}`);
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

  /**
   * Hämtar en medlem från organisationen baserat på användar-ID
   * 
   * @param userId Användarens ID
   * @returns Medlemsobjektet eller undefined om användaren inte är medlem
   */
  public getMember(userId: string | UniqueId): OrganizationMember | undefined {
    try {
      const userIdToFind = userId instanceof UniqueId ? userId : new UniqueId(userId);
      return this.props.members.find(m => m.userId.equals(userIdToFind));
    } catch (error) {
      console.error('Fel vid hämtning av medlem:', error);
      return undefined;
    }
  }
  
  /**
   * Kontrollerar om användaren har en specifik roll i organisationen
   * 
   * @param userId Användarens ID
   * @param role Rollen att kontrollera
   * @returns true om användaren har rollen, annars false
   */
  public hasRole(userId: string | UniqueId, role: OrganizationRole | string): boolean {
    try {
      const member = this.getMember(userId);
      if (!member) {
        return false;
      }
      
      if (typeof role === 'string') {
        return member.role.toString() === role;
      }
      
      return member.role.equals(role);
    } catch (error) {
      console.error('Fel vid kontroll av roll:', error);
      return false;
    }
  }
  
  /**
   * Kontrollerar om användaren har en behörighet i organisationen
   * 
   * @param userId Användarens ID
   * @param permission Behörigheten att kontrollera
   * @returns true om användaren har behörigheten, annars false
   */
  public hasPermission(userId: string | UniqueId, permission: OrganizationPermission): boolean {
    try {
      const userIdToCheck = userId instanceof UniqueId ? userId : new UniqueId(userId);
      return this.hasMemberPermission(userIdToCheck, permission);
    } catch (error) {
      console.error('Fel vid kontroll av behörighet:', error);
      return false;
    }
  }

  /**
   * Uppdaterar organisationens prenumerationsplan
   * 
   * @param newPlanId ID för den nya prenumerationsplanen
   * @returns Result med void för framgång eller fel vid misslyckande
   */
  updatePlan(newPlanId: string): Result<void> {
    // Spara tidigare plan för event-datat
    const oldPlanId = this.props.settings.plan || 'free';
    
    // Uppdatera planId i settings
    this.props.settings.plan = newPlanId;
    
    // Skapa och publicera event för planuppdatering
    const event = new OrganizationPlanUpdatedEvent({
      organizationId: this.id.toString(),
      oldPlanId: oldPlanId,
      newPlanId: newPlanId
    });
    
    this.addDomainEvent(event);
    
    return Result.ok<void>();
  }

  /**
   * Uppdaterar organisationens status
   * 
   * @param newStatus Ny status för organisationen
   * @returns Result med void för framgång eller fel vid misslyckande
   */
  updateStatus(newStatus: string): Result<void> {
    // Spara tidigare status för event-data
    const oldStatus = this.props.status || 'ACTIVE';
    
    // Uppdatera status
    this.props.status = newStatus;
    
    // Skapa och publicera event för statusuppdatering
    const event = new OrganizationStatusUpdatedEvent({
      organizationId: this.id.toString(),
      oldStatus: oldStatus,
      newStatus: newStatus
    });
    
    this.addDomainEvent(event);
    
    return Result.ok<void>();
  }

  /**
   * Lägger till en post i prenumerationshistoriken
   * 
   * @param entry Information om planändringen
   * @returns Result med void för framgång eller fel vid misslyckande
   */
  addPlanHistoryEntry(entry: PlanHistoryEntry): Result<void> {
    // Skapa historikarray om den inte finns
    if (!this.props.planHistory) {
      this.props.planHistory = [];
    }
    
    // Lägg till den nya posten
    this.props.planHistory.push({
      ...entry,
      changedAt: entry.changedAt || new Date()
    });
    
    return Result.ok<void>();
  }

  /**
   * Hämtar hela prenumerationshistoriken
   * 
   * @returns Array med historikposter eller tom array om ingen historik finns
   */
  getSubscriptionHistory(): PlanHistoryEntry[] {
    return this.props.planHistory || [];
  }

  /**
   * Kontrollerar om organisationen har tillgång till en specifik funktion
   * baserad på sin prenumerationsplan
   * 
   * @param featureId ID för funktionen att kontrollera
   * @returns Promise<boolean> som indikerar om tillgång finns
   */
  async hasAccess(featureId: string): Promise<boolean> {
    // Använd SubscriptionService om det finns tillgängligt
    if (this.subscriptionService) {
      const result = await this.subscriptionService.hasFeatureAccess(
        this.id.toString(), 
        featureId
      );
      
      if (result.isOk()) {
        return result.value;
      }
    }
    
    // Enkel implementering baserad på plan, används för tester
    // och när SubscriptionService inte är tillgänglig
    const planId = this.props.settings.plan || 'free';
    
    // Tillgängliga funktioner per plan (för testning)
    const planFeatures: Record<string, string[]> = {
      'free': ['basic_team'],
      'standard': ['basic_team', 'file_sharing', 'team_roles'],
      'premium': ['basic_team', 'file_sharing', 'team_roles', 'team_integrations', 'premium_analytics']
    };
    
    // Kontrollera om funktionen är tillgänglig i planen
    const features = planFeatures[planId] || [];
    return features.includes(featureId);
  }

  /**
   * Hämtar organisations plan-ID
   */
  get planId(): string {
    return this.props.settings.plan || 'free';
  }

  /**
   * Hämtar organisationens status
   */
  get status(): string {
    return this.props.status || 'ACTIVE';
  }
} 