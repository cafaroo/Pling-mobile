import { UniqueId } from '../../core/UniqueId';
import { ResourceType } from '../strategies/ResourceLimitStrategy';
import { ResourceUsageTrackingService } from './ResourceUsageTrackingService';
import { ResourceLimitNotificationService } from './ResourceLimitNotificationService';
import { OrganizationRepository } from '../repositories/OrganizationRepository';

/**
 * Interface för att hämta aktuell resursanvändning för en organisation.
 */
export interface ResourceCountProvider {
  /**
   * Hämtar antal mål för en organisation.
   */
  getGoalCount(organizationId: string): Promise<number>;
  
  /**
   * Hämtar antal tävlingar för en organisation.
   */
  getCompetitionCount(organizationId: string): Promise<number>;
  
  /**
   * Hämtar antal rapporter för en organisation.
   */
  getReportCount(organizationId: string): Promise<number>;
  
  /**
   * Hämtar antal dashboards för en organisation.
   */
  getDashboardCount(organizationId: string): Promise<number>;
  
  /**
   * Hämtar mediaanvändning för en organisation i MB.
   */
  getMediaUsage(organizationId: string): Promise<number>;
}

/**
 * Service för att automatiskt spåra och uppdatera resursanvändning i organisationer.
 * 
 * Denna service schemalägger periodiska uppdateringar av resursanvändning för alla
 * aktiva organisationer och skickar notifikationer vid behov.
 */
export class AutomaticResourceTrackingService {
  private activeTrackingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEFAULT_INTERVAL_MS = 3600000; // 1 timme som standard
  
  constructor(
    private resourceUsageTrackingService: ResourceUsageTrackingService,
    private resourceLimitNotificationService: ResourceLimitNotificationService,
    private organizationRepository: OrganizationRepository,
    private resourceCountProvider: ResourceCountProvider
  ) {}
  
  /**
   * Startar automatisk spårning för alla aktiva organisationer.
   */
  public async startTrackingForAllOrganizations(
    intervalMs: number = this.DEFAULT_INTERVAL_MS
  ): Promise<void> {
    try {
      // Hämta alla organisationer
      const organizations = await this.organizationRepository.findAll();
      
      // Starta spårning för varje organisation
      for (const organization of organizations) {
        this.startTrackingForOrganization(organization.id, intervalMs);
      }
      
      console.log(`Automatisk resursspårning startad för ${organizations.length} organisationer`);
    } catch (error) {
      console.error('Fel vid start av automatisk resursspårning:', error);
    }
  }
  
  /**
   * Startar automatisk spårning för en specifik organisation.
   * 
   * @param organizationId - ID för organisationen
   * @param intervalMs - Intervall i millisekunder mellan uppdateringar
   */
  public startTrackingForOrganization(
    organizationId: UniqueId,
    intervalMs: number = this.DEFAULT_INTERVAL_MS
  ): void {
    // Stoppa eventuell befintlig spårning
    this.stopTrackingForOrganization(organizationId);
    
    // Skapa ny intervalltimer
    const intervalId = setInterval(
      () => this.updateResourceUsageForOrganization(organizationId),
      intervalMs
    );
    
    // Spara id för intervallet
    this.activeTrackingIntervals.set(organizationId.toString(), intervalId);
    
    console.log(`Automatisk resursspårning startad för organisation ${organizationId.toString()}`);
    
    // Kör en första uppdatering omedelbart
    this.updateResourceUsageForOrganization(organizationId);
  }
  
  /**
   * Stoppar automatisk spårning för en specifik organisation.
   * 
   * @param organizationId - ID för organisationen
   */
  public stopTrackingForOrganization(organizationId: UniqueId): void {
    const orgId = organizationId.toString();
    const intervalId = this.activeTrackingIntervals.get(orgId);
    
    if (intervalId) {
      clearInterval(intervalId);
      this.activeTrackingIntervals.delete(orgId);
      console.log(`Automatisk resursspårning stoppad för organisation ${orgId}`);
    }
  }
  
  /**
   * Stoppar all automatisk spårning.
   */
  public stopAllTracking(): void {
    for (const [orgId, intervalId] of this.activeTrackingIntervals.entries()) {
      clearInterval(intervalId);
      console.log(`Automatisk resursspårning stoppad för organisation ${orgId}`);
    }
    
    this.activeTrackingIntervals.clear();
    console.log('All automatisk resursspårning stoppad');
  }
  
  /**
   * Uppdaterar resursanvändning för en organisation och skickar notifikationer vid behov.
   * 
   * @param organizationId - ID för organisationen
   */
  private async updateResourceUsageForOrganization(organizationId: UniqueId): Promise<void> {
    try {
      // Hämta organisation och resursanvändning
      const organization = await this.organizationRepository.findById(organizationId);
      
      if (!organization) {
        console.error(`Organisation ${organizationId.toString()} hittades inte, stoppar spårning`);
        this.stopTrackingForOrganization(organizationId);
        return;
      }
      
      // Hämta resursanvändning via resourceCountProvider
      const resourceCounts = await this.getResourceCounts(organizationId.toString());
      
      // Uppdatera resursanvändning i prenumerationssystemet
      await this.resourceUsageTrackingService.updateAllResourceUsage(
        organizationId,
        resourceCounts
      );
      
      // Kontrollera om notifikationer behöver skickas
      await this.checkAndSendNotifications(organizationId, resourceCounts);
      
      console.log(`Resursanvändning uppdaterad för organisation ${organizationId.toString()}`);
    } catch (error) {
      console.error(`Fel vid uppdatering av resursanvändning för ${organizationId.toString()}:`, error);
    }
  }
  
  /**
   * Hämtar aktuell resursanvändning för en organisation.
   * 
   * @param organizationId - ID för organisationen
   * @returns Objekt med resursanvändning
   */
  private async getResourceCounts(organizationId: string): Promise<{
    teams?: number;
    teamMembers?: number;
    resources?: { [key in ResourceType]?: number };
  }> {
    try {
      // Hämta organisation för att få team och medlemmar
      const organization = await this.organizationRepository.findById(new UniqueId(organizationId));
      
      if (!organization) {
        throw new Error(`Organisation ${organizationId} hittades inte`);
      }
      
      // Hämta resursanvändning för andra resurstyper via provider
      const goalCount = await this.resourceCountProvider.getGoalCount(organizationId);
      const competitionCount = await this.resourceCountProvider.getCompetitionCount(organizationId);
      const reportCount = await this.resourceCountProvider.getReportCount(organizationId);
      const dashboardCount = await this.resourceCountProvider.getDashboardCount(organizationId);
      const mediaUsage = await this.resourceCountProvider.getMediaUsage(organizationId);
      
      return {
        teams: organization.teamIds.length,
        teamMembers: organization.members.length,
        resources: {
          [ResourceType.GOAL]: goalCount,
          [ResourceType.COMPETITION]: competitionCount,
          [ResourceType.REPORT]: reportCount,
          [ResourceType.DASHBOARD]: dashboardCount,
          [ResourceType.MEDIA]: mediaUsage
        }
      };
    } catch (error) {
      console.error(`Fel vid hämtning av resursanvändning för ${organizationId}:`, error);
      return {
        teams: 0,
        teamMembers: 0,
        resources: {}
      };
    }
  }
  
  /**
   * Kontrollerar om notifikationer behöver skickas för resursanvändning.
   * 
   * @param organizationId - ID för organisationen
   * @param resourceCounts - Aktuell resursanvändning
   */
  private async checkAndSendNotifications(
    organizationId: UniqueId,
    resourceCounts: {
      teams?: number;
      teamMembers?: number;
      resources?: { [key in ResourceType]?: number };
    }
  ): Promise<void> {
    try {
      // Hämta organisation för att få medlems-IDs för notifikationer
      const organization = await this.organizationRepository.findById(organizationId);
      
      if (!organization) {
        return;
      }
      
      // Skapa lista med användar-IDs för administratörer och ägare
      const adminUserIds = organization.members
        .filter(member => ['owner', 'admin'].includes(member.role.value))
        .map(member => member.userId.toString());
      
      if (adminUserIds.length === 0) {
        return; // Inga admins att notifiera
      }
      
      // Skapa lista med resursgränser och användning för notifikationerna
      const resourceLimits: Record<string, { current: number; limit: number }> = {};
      
      // Lägg till team och medlemmar
      if (resourceCounts.teams !== undefined) {
        const organization = await this.organizationRepository.findById(organizationId);
        if (organization) {
          const teamLimit = organization.teamIds.length;
          resourceLimits['team'] = {
            current: resourceCounts.teams,
            limit: teamLimit
          };
        }
      }
      
      if (resourceCounts.teamMembers !== undefined) {
        const organization = await this.organizationRepository.findById(organizationId);
        if (organization) {
          const memberLimit = organization.members.length;
          resourceLimits['teamMember'] = {
            current: resourceCounts.teamMembers,
            limit: memberLimit
          };
        }
      }
      
      // Lägg till resurser
      if (resourceCounts.resources) {
        for (const [type, count] of Object.entries(resourceCounts.resources)) {
          if (count !== undefined) {
            // Hämta gräns från prenumerationssystemet via en helper-metod som skulle implementeras i praktiken
            const limit = await this.getResourceLimit(organizationId, type as ResourceType);
            
            resourceLimits[type] = {
              current: count,
              limit
            };
          }
        }
      }
      
      // Skicka sammanfattningsnotifikation
      await this.resourceLimitNotificationService.sendLimitSummary(
        organizationId,
        resourceLimits,
        adminUserIds
      );
    } catch (error) {
      console.error(`Fel vid kontroll av notifikationer för ${organizationId.toString()}:`, error);
    }
  }
  
  /**
   * Hjälpmetod för att hämta gräns för en resurstyp.
   * 
   * @param organizationId - ID för organisationen
   * @param resourceType - Typ av resurs
   * @returns Resursgräns
   */
  private async getResourceLimit(organizationId: UniqueId, resourceType: ResourceType): Promise<number> {
    // Denna metod skulle i praktiken använda strategifabriken och hämta rätt begränsning
    // För demo-syfte returnerar vi bara exempel-data
    switch (resourceType) {
      case ResourceType.GOAL:
        return 10;
      case ResourceType.COMPETITION:
        return 5;
      case ResourceType.REPORT:
        return 10;
      case ResourceType.DASHBOARD:
        return 5;
      case ResourceType.MEDIA:
        return 100; // MB
      default:
        return 5;
    }
  }
} 