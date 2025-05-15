import { AggregateRoot } from '@/shared/domain/AggregateRoot';
import { UniqueId } from '@/shared/domain/UniqueId';
import { Result, ok, err } from '@/shared/core/Result';
import { UserSettings } from './UserSettings';
import { UserProfile } from '../value-objects/UserProfile';
import { Email } from '../value-objects/Email';
import { PhoneNumber } from '../value-objects/PhoneNumber';
import { UserRoleAddedEvent } from '../events/UserRoleAddedEvent';
import { UserRoleRemovedEvent } from '../events/UserRoleRemovedEvent';
import { UserCreatedEvent } from '../events/UserCreatedEvent';
import { UserProfileUpdatedEvent } from '../events/UserProfileUpdatedEvent';
import { UserSettingsUpdatedEvent } from '../events/UserSettingsUpdatedEvent';
import { UserStatusChangedEvent } from '../events/UserStatusChangedEvent';
import { UserTeamAddedEvent } from '../events/UserTeamAddedEvent';
import { UserTeamRemovedEvent } from '../events/UserTeamRemovedEvent';

/**
 * UserProps
 * 
 * Interface som definierar egenskaperna för User-entiteten.
 */
export interface UserProps {
  email: Email;
  name: string;
  phone?: PhoneNumber;
  settings: UserSettings;
  profile?: UserProfile;
  teamIds: string[];
  roleIds: string[];
  status: 'pending' | 'active' | 'inactive' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CreateUserProps
 * 
 * Interface för att skapa en ny User-entitet.
 */
interface CreateUserProps {
  email: Email | string;
  name: string;
  phone?: PhoneNumber | string;
  settings?: UserSettings;
  profile?: UserProfile;
  teamIds?: string[];
  roleIds?: string[];
  status?: 'pending' | 'active' | 'inactive' | 'blocked';
}

/**
 * User
 * 
 * Aggregatrot för användardomänen som representerar en användare i systemet.
 * Ansvarar för att upprätthålla konsistens för användarrelaterade entiteter
 * och publicera domänevents för användardomänen.
 */
export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps, id?: UniqueId) {
    super(props, id);
  }

  /**
   * Validerar invarianter för användaraggregatet.
   * 
   * @returns Result som indikerar om alla invarianter är uppfyllda
   */
  private validateInvariants(): Result<void, string> {
    try {
      // Invariant: Användare måste ha en giltig e-post
      if (!this.props.email) {
        return Result.err('Användare måste ha en giltig e-post');
      }

      // Invariant: Användare måste ha ett namn
      if (!this.props.name || this.props.name.trim().length < 2) {
        return Result.err('Användare måste ha ett namn med minst 2 tecken');
      }

      // Invariant: Telefonnummer måste vara giltigt om det finns
      if (this.props.phone && !this.props.phone.isValid()) {
        return Result.err('Telefonnumret är ogiltigt');
      }

      // Invariant: Statusvärdet måste vara giltigt
      const validStatusValues = ['pending', 'active', 'inactive', 'blocked'];
      if (!validStatusValues.includes(this.props.status)) {
        return Result.err('Ogiltig användarstatus');
      }

      // Invariant: TeamIds och RoleIds får inte innehålla duplicerade värden
      const uniqueTeamIds = new Set(this.props.teamIds);
      if (uniqueTeamIds.size !== this.props.teamIds.length) {
        return Result.err('TeamIds får inte innehålla dubbletter');
      }

      const uniqueRoleIds = new Set(this.props.roleIds);
      if (uniqueRoleIds.size !== this.props.roleIds.length) {
        return Result.err('RoleIds får inte innehålla dubbletter');
      }

      // Alla invarianter uppfyllda
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(`Fel vid validering av invarianter: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Skapar en ny User-entitet
   * 
   * @param props Egenskaper för den nya användaren
   * @returns Result med User eller felmeddelande
   */
  public static create(props: CreateUserProps): Result<User, string> {
    try {
      // Validera och skapa Email värde-objekt om det behövs
      let emailResult: Result<Email, string>;
      if (typeof props.email === 'string') {
        emailResult = Email.create(props.email);
        if (emailResult.isErr()) {
          return err(emailResult.error);
        }
      } else {
        emailResult = ok(props.email);
      }

      // Validera namn
      if (!props.name || props.name.trim().length < 2) {
        return err('Namnet måste vara minst 2 tecken');
      }

      // Hantera telefonnummer om det finns
      let phoneResult: Result<PhoneNumber | undefined, string> = ok(undefined);
      if (props.phone) {
        if (typeof props.phone === 'string') {
          phoneResult = PhoneNumber.create(props.phone);
          if (phoneResult.isErr()) {
            return err(phoneResult.error);
          }
        } else {
          phoneResult = ok(props.phone);
        }
      }

      // Skapa defaults för settings om det behövs
      const settings = props.settings || UserSettings.createDefault();

      const id = new UniqueId();
      const now = new Date();

      const user = new User({
        email: emailResult.value,
        name: props.name.trim(),
        phone: phoneResult.value,
        settings: settings,
        profile: props.profile,
        teamIds: props.teamIds || [],
        roleIds: props.roleIds || [],
        status: props.status || 'pending',
        createdAt: now,
        updatedAt: now
      }, id);
      
      // Validera invarianter
      const validationResult = user.validateInvariants();
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      // Lägg till domänhändelse för användarskapande med ny standardiserad händelseklass
      user.addDomainEvent(new UserCreatedEvent(
        user,
        emailResult.value.value
      ));

      return ok(user);
    } catch (error) {
      return err(`Kunde inte skapa användare: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Användares e-postadress som värde-objekt
   */
  public get email(): Email {
    return this.props.email;
  }

  /**
   * Användares namn
   */
  public get name(): string {
    return this.props.name;
  }

  /**
   * Användares telefonnummer som värde-objekt
   */
  public get phone(): PhoneNumber | undefined {
    return this.props.phone;
  }

  /**
   * Användares inställningar
   */
  public get settings(): UserSettings {
    return this.props.settings;
  }

  /**
   * Användares profil
   */
  public get profile(): UserProfile | undefined {
    return this.props.profile;
  }

  /**
   * Lista över teamIDs som användaren tillhör (kopia för att undvika direkt ändring)
   */
  public get teamIds(): string[] {
    return [...this.props.teamIds];
  }

  /**
   * Lista över rollIDs som användaren har (kopia för att undvika direkt ändring)
   */
  public get roleIds(): string[] {
    return [...this.props.roleIds];
  }

  /**
   * Användares status
   */
  public get status(): string {
    return this.props.status;
  }

  /**
   * Tidpunkt för när användaren skapades
   */
  public get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  /**
   * Tidpunkt för när användaren senast uppdaterades
   */
  public get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  /**
   * Uppdaterar användarens inställningar
   * 
   * @param settings Nya inställningar
   * @returns Result med success eller felmeddelande
   */
  public updateSettings(settings: UserSettings): Result<void, string> {
    try {
      const previousSettings = { ...this.props.settings };
      this.props.settings = settings;
      this.props.updatedAt = new Date();
      
      // Validera invarianter efter ändring
      const validationResult = this.validateInvariants();
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      // Publicera domänhändelse med ny standardiserad händelseklass
      this.addDomainEvent(new UserSettingsUpdatedEvent(
        this,
        settings
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte uppdatera inställningar: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Uppdaterar användarens profil
   * 
   * @param profile Ny profil
   * @returns Result med success eller felmeddelande
   */
  public updateProfile(profile: UserProfile): Result<void, string> {
    try {
      this.props.profile = profile;
      this.props.updatedAt = new Date();
      
      // Validera invarianter efter ändring
      const validationResult = this.validateInvariants();
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      // Publicera domänhändelse med ny standardiserad händelseklass
      this.addDomainEvent(new UserProfileUpdatedEvent(
        this,
        profile
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte uppdatera profil: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Lägger till ett team för användaren
   * 
   * @param teamId Team-ID att lägga till
   * @returns Result med success eller felmeddelande
   */
  public addTeam(teamId: string): Result<void, string> {
    if (this.props.teamIds.includes(teamId)) {
      return err('Användaren är redan medlem i teamet');
    }
    
    try {
      this.props.teamIds.push(teamId);
      this.props.updatedAt = new Date();
      
      // Validera invarianter efter ändring
      const validationResult = this.validateInvariants();
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      // Publicera domänhändelse med ny standardiserad händelseklass
      this.addDomainEvent(new UserTeamAddedEvent(
        this,
        teamId
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte lägga till team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Tar bort ett team från användaren
   * 
   * @param teamId Team-ID att ta bort
   * @returns Result med success eller felmeddelande
   */
  public removeTeam(teamId: string): Result<void, string> {
    const index = this.props.teamIds.indexOf(teamId);
    if (index === -1) {
      return err('Användaren är inte medlem i teamet');
    }
    
    try {
      this.props.teamIds.splice(index, 1);
      this.props.updatedAt = new Date();
      
      // Validera invarianter efter ändring
      const validationResult = this.validateInvariants();
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      // Publicera domänhändelse med ny standardiserad händelseklass
      this.addDomainEvent(new UserTeamRemovedEvent(
        this,
        teamId
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte ta bort team: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Lägger till en roll för användaren
   * 
   * @param roleId Roll-ID att lägga till
   * @returns Result med success eller felmeddelande
   */
  public addRole(roleId: string): Result<void, string> {
    if (this.props.roleIds.includes(roleId)) {
      return err('Användaren har redan denna roll');
    }
    
    try {
      this.props.roleIds.push(roleId);
      this.props.updatedAt = new Date();
      
      // Validera invarianter efter ändring
      const validationResult = this.validateInvariants();
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      // Publicera domänhändelse med ny standardiserad händelseklass
      this.addDomainEvent(new UserRoleAddedEvent(
        this,
        roleId
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte lägga till roll: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Tar bort en roll från användaren
   * 
   * @param roleId Roll-ID att ta bort
   * @returns Result med success eller felmeddelande
   */
  public removeRole(roleId: string): Result<void, string> {
    const index = this.props.roleIds.indexOf(roleId);
    if (index === -1) {
      return err('Användaren har inte denna roll');
    }
    
    try {
      this.props.roleIds.splice(index, 1);
      this.props.updatedAt = new Date();
      
      // Validera invarianter efter ändring
      const validationResult = this.validateInvariants();
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      // Publicera domänhändelse med ny standardiserad händelseklass
      this.addDomainEvent(new UserRoleRemovedEvent(
        this,
        roleId
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte ta bort roll: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Uppdaterar användarens status
   * 
   * @param newStatus Ny status
   * @returns Result med success eller felmeddelande
   */
  public updateStatus(newStatus: 'pending' | 'active' | 'inactive' | 'blocked'): Result<void, string> {
    try {
      const oldStatus = this.props.status;
      this.props.status = newStatus;
      this.props.updatedAt = new Date();
      
      // Validera invarianter efter ändring
      const validationResult = this.validateInvariants();
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }

      // Publicera domänhändelse med ny standardiserad händelseklass
      this.addDomainEvent(new UserStatusChangedEvent(
        this,
        oldStatus,
        newStatus
      ));

      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte uppdatera status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Uppdaterar användarens e-postadress
   * 
   * @param newEmail Ny e-postadress som string eller Email-värde-objekt
   * @returns Result med success eller felmeddelande
   */
  public updateEmail(newEmail: string | Email): Result<void, string> {
    try {
      let emailResult: Result<Email, string>;
      
      if (typeof newEmail === 'string') {
        emailResult = Email.create(newEmail);
        if (emailResult.isErr()) {
          return err(emailResult.error);
        }
      } else {
        emailResult = ok(newEmail);
      }
      
      const oldEmail = this.props.email;
      this.props.email = emailResult.value;
      this.props.updatedAt = new Date();
      
      // Validera invarianter efter ändring
      const validationResult = this.validateInvariants();
      if (validationResult.isErr()) {
        return err(validationResult.error);
      }
      
      return ok(undefined);
    } catch (error) {
      return err(`Kunde inte uppdatera e-postadress: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 