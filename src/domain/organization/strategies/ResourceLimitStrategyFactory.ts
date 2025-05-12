import { SubscriptionAdapter } from '../adapters/SubscriptionAdapter';
import { 
  ResourceLimitStrategy, 
  OrganizationResourceLimitStrategy,
  ResourceType
} from './ResourceLimitStrategy';
import { TeamMemberLimitStrategy } from './TeamMemberLimitStrategy';
import { TeamLimitStrategy } from './TeamLimitStrategy';
import { GoalLimitStrategy } from './GoalLimitStrategy';
import { CompetitionLimitStrategy } from './CompetitionLimitStrategy';
import { ReportLimitStrategy } from './ReportLimitStrategy';

/**
 * Factory för att skapa och hantera olika resursbegränsningsstrategier.
 * 
 * Denna klass fungerar som ett centralt ställe för att skapa rätt strategiobjekt
 * baserat på vilken typ av resurs som ska begränsas.
 */
export class ResourceLimitStrategyFactory {
  private strategies: Map<string, ResourceLimitStrategy> = new Map();
  
  constructor(private subscriptionAdapter: SubscriptionAdapter) {}
  
  /**
   * Hämtar strategi för teammedlemsbegränsningar.
   * @returns En strategi för att hantera begränsningar av teammedlemmar
   */
  getTeamMemberStrategy(): TeamMemberLimitStrategy {
    const key = 'teamMembers';
    
    if (!this.strategies.has(key)) {
      this.strategies.set(key, new TeamMemberLimitStrategy(this.subscriptionAdapter));
    }
    
    return this.strategies.get(key) as TeamMemberLimitStrategy;
  }
  
  /**
   * Hämtar strategi för teambegränsningar.
   * @returns En strategi för att hantera begränsningar av team
   */
  getTeamStrategy(): TeamLimitStrategy {
    const key = 'teams';
    
    if (!this.strategies.has(key)) {
      this.strategies.set(key, new TeamLimitStrategy(this.subscriptionAdapter));
    }
    
    return this.strategies.get(key) as TeamLimitStrategy;
  }

  /**
   * Hämtar strategi för målbegränsningar.
   * @returns En strategi för att hantera begränsningar av mål
   */
  getGoalStrategy(): GoalLimitStrategy {
    const key = 'goals';
    
    if (!this.strategies.has(key)) {
      this.strategies.set(key, new GoalLimitStrategy(this.subscriptionAdapter));
    }
    
    return this.strategies.get(key) as GoalLimitStrategy;
  }

  /**
   * Hämtar strategi för tävlingsbegränsningar.
   * @returns En strategi för att hantera begränsningar av tävlingar
   */
  getCompetitionStrategy(): CompetitionLimitStrategy {
    const key = 'competitions';
    
    if (!this.strategies.has(key)) {
      this.strategies.set(key, new CompetitionLimitStrategy(this.subscriptionAdapter));
    }
    
    return this.strategies.get(key) as CompetitionLimitStrategy;
  }

  /**
   * Hämtar strategi för rapportbegränsningar.
   * @returns En strategi för att hantera begränsningar av rapporter
   */
  getReportStrategy(): ReportLimitStrategy {
    const key = 'reports';
    
    if (!this.strategies.has(key)) {
      this.strategies.set(key, new ReportLimitStrategy(this.subscriptionAdapter));
    }
    
    return this.strategies.get(key) as ReportLimitStrategy;
  }
  
  /**
   * Hämtar strategi för organisationsresursbegränsningar av specifik typ.
   * 
   * @param resourceType - Typ av resurs att begränsa
   * @param fallbackLimit - Standardbegränsning om ingen prenumerationsgräns finns
   * @returns En strategi för att hantera begränsningar av den angivna resurstypen
   */
  getResourceStrategy(
    resourceType: ResourceType,
    fallbackLimit: number = 5
  ): OrganizationResourceLimitStrategy {
    const key = `resource_${resourceType}`;
    
    if (!this.strategies.has(key)) {
      this.strategies.set(
        key, 
        new OrganizationResourceLimitStrategy(
          this.subscriptionAdapter,
          resourceType,
          fallbackLimit
        )
      );
    }
    
    return this.strategies.get(key) as OrganizationResourceLimitStrategy;
  }
  
  /**
   * Hämtar rätt strategi baserat på resurstyp.
   * 
   * @param resourceType - Resurstyp att hämta strategi för
   * @returns Rätt strategi för den angivna resurstypen
   */
  getStrategyForResourceType(resourceType: ResourceType): ResourceLimitStrategy {
    switch (resourceType) {
      case ResourceType.GOAL:
        return this.getGoalStrategy();
      case ResourceType.COMPETITION:
        return this.getCompetitionStrategy();
      case ResourceType.REPORT:
        return this.getReportStrategy();
      case ResourceType.TEAM:
        return this.getTeamStrategy();
      case ResourceType.MEDIA:
        return this.getMediaStrategy();
      default:
        return this.getResourceStrategy(resourceType);
    }
  }
  
  /**
   * Hämtar strategi för mediabegränsningar.
   * 
   * Media har en särskild behandling eftersom det ofta begränsas i termer av 
   * lagringsutrymme snarare än antal.
   * 
   * @returns En strategi för att hantera begränsningar av mediaresurser
   */
  getMediaStrategy(): OrganizationResourceLimitStrategy {
    return this.getResourceStrategy(ResourceType.MEDIA, 10);
  }
  
  /**
   * Rensa cache för strategiobjekten, vilket tvingar till ny utvärdering
   * av begränsningar.
   */
  clearCache(): void {
    this.strategies.clear();
  }
} 