import { IDomainEventPublisher } from '@/shared/domain/events/IDomainEventPublisher';
import { TeamRepository } from '@/domain/team/repositories/TeamRepository';
import { UserRepository } from '@/domain/user/repositories/UserRepository';
import { TeamCreatedHandler } from './TeamCreatedHandler';
import { MemberJoinedHandler } from './MemberJoinedHandler';
import { MemberLeftHandler } from './MemberLeftHandler';
import { TeamMemberRoleChangedHandler } from './TeamMemberRoleChangedHandler';
import { TeamMessageCreatedHandler } from './TeamMessageCreatedHandler';

/**
 * Factory för att skapa och registrera team event handlers
 * 
 * Förenklar skapandet av handlers med alla nödvändiga beroenden
 * och registrerar dem hos eventpublisher.
 */
export class TeamEventHandlerFactory {
  constructor(
    private eventPublisher: IDomainEventPublisher,
    private teamRepository: TeamRepository,
    private userRepository: UserRepository,
    // Övriga repositories och beroenden som behövs
  ) {}
  
  /**
   * Skapar och registrerar alla team-relaterade event handlers
   */
  public registerAllHandlers(): void {
    this.registerTeamCreatedHandler();
    this.registerMemberJoinedHandler();
    this.registerMemberLeftHandler();
    this.registerTeamMemberRoleChangedHandler();
    this.registerTeamMessageCreatedHandler();
    
    // Lägg till fler handlers här när de implementeras
  }
  
  /**
   * Skapar och registrerar TeamCreatedHandler
   */
  private registerTeamCreatedHandler(): void {
    const handler = new TeamCreatedHandler(
      this.teamRepository,
      this.userRepository
    );
    this.eventPublisher.register('TeamCreated', handler);
  }
  
  /**
   * Skapar och registrerar MemberJoinedHandler
   */
  private registerMemberJoinedHandler(): void {
    const handler = new MemberJoinedHandler(
      this.teamRepository,
      this.userRepository
    );
    this.eventPublisher.register('MemberJoined', handler);
  }
  
  /**
   * Skapar och registrerar MemberLeftHandler
   */
  private registerMemberLeftHandler(): void {
    const handler = new MemberLeftHandler(
      this.teamRepository,
      this.userRepository
    );
    this.eventPublisher.register('MemberLeft', handler);
  }
  
  /**
   * Skapar och registrerar TeamMemberRoleChangedHandler
   */
  private registerTeamMemberRoleChangedHandler(): void {
    const handler = new TeamMemberRoleChangedHandler(
      this.teamRepository,
      this.userRepository
    );
    this.eventPublisher.register('TeamMemberRoleChanged', handler);
  }
  
  /**
   * Skapar och registrerar TeamMessageCreatedHandler
   */
  private registerTeamMessageCreatedHandler(): void {
    const handler = new TeamMessageCreatedHandler(
      this.teamRepository
    );
    this.eventPublisher.register('TeamMessageCreated', handler);
  }
  
  /**
   * Skapar en instans av factory och registrerar alla handlers
   */
  public static initializeHandlers(
    eventPublisher: IDomainEventPublisher,
    teamRepository: TeamRepository,
    userRepository: UserRepository,
  ): void {
    const factory = new TeamEventHandlerFactory(
      eventPublisher,
      teamRepository,
      userRepository
    );
    
    factory.registerAllHandlers();
  }
} 