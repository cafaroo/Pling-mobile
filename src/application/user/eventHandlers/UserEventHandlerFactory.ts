import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { OrganizationRepository } from '@/domain/organization/repositories/OrganizationRepository';
import { 
  UserCreated, 
  UserProfileUpdated, 
  UserTeamJoined, 
  UserStatusChanged 
} from '@/domain/user/events/UserEvent';
import { UserCreatedHandler } from './UserCreatedHandler';
import { UserProfileUpdatedHandler } from './UserProfileUpdatedHandler';
import { UserTeamJoinedHandler } from './UserTeamJoinedHandler';
import { UserStatusChangedHandler } from './UserStatusChangedHandler';

/**
 * Factory för att skapa och hantera user event handlers
 * 
 * Denna factory förenklar skapandet och registreringen av event handlers
 * för user-relaterade events.
 */
export class UserEventHandlerFactory {
  private eventPublisher: IDomainEventPublisher;
  private userRepository: UserRepository;
  private teamRepository: TeamRepository;
  private organizationRepository: OrganizationRepository;
  
  constructor(
    eventPublisher: IDomainEventPublisher,
    userRepository: UserRepository,
    teamRepository: TeamRepository,
    organizationRepository: OrganizationRepository
  ) {
    this.eventPublisher = eventPublisher;
    this.userRepository = userRepository;
    this.teamRepository = teamRepository;
    this.organizationRepository = organizationRepository;
  }
  
  /**
   * Skapar alla user event handlers och registrerar dem med eventPublisher
   */
  registerHandlers(): void {
    this.registerUserCreatedHandler();
    this.registerUserProfileUpdatedHandler();
    this.registerUserTeamJoinedHandler();
    this.registerUserStatusChangedHandler();
    
    console.log('User event handlers registrerade');
  }
  
  /**
   * Tar bort alla event handlers från eventPublisher
   */
  removeHandlers(): void {
    this.eventPublisher.clearListeners();
    console.log('User event handlers borttagna');
  }
  
  /**
   * Skapar och registrerar UserCreatedHandler
   */
  private registerUserCreatedHandler(): void {
    const handler = new UserCreatedHandler(
      this.userRepository,
      this.teamRepository,
      this.organizationRepository
    );
    
    this.eventPublisher.register(
      UserCreated.name,
      handler
    );
  }
  
  /**
   * Skapar och registrerar UserProfileUpdatedHandler
   */
  private registerUserProfileUpdatedHandler(): void {
    const handler = new UserProfileUpdatedHandler(
      this.userRepository,
      this.teamRepository
    );
    
    this.eventPublisher.register(
      UserProfileUpdated.name,
      handler
    );
  }
  
  /**
   * Skapar och registrerar UserTeamJoinedHandler
   */
  private registerUserTeamJoinedHandler(): void {
    const handler = new UserTeamJoinedHandler(
      this.userRepository,
      this.teamRepository
    );
    
    this.eventPublisher.register(
      UserTeamJoined.name,
      handler
    );
  }
  
  /**
   * Skapar och registrerar UserStatusChangedHandler
   */
  private registerUserStatusChangedHandler(): void {
    const handler = new UserStatusChangedHandler(
      this.userRepository,
      this.teamRepository
    );
    
    this.eventPublisher.register(
      UserStatusChanged.name,
      handler
    );
  }
} 