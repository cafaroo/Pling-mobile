import { UniqueId } from '../../core/UniqueId';
import { ResourceType, ResourceTypeLabels } from '../strategies/ResourceLimitStrategy';

/**
 * Interface för en notifieringsadapter, ska implementeras av infrastrukturlagret.
 */
export interface NotificationAdapter {
  /**
   * Skickar en notifikation till en eller flera användare.
   */
  sendNotification(notification: {
    title: string;
    body: string;
    type: string;
    metadata?: Record<string, any>;
    userIds: string[];
  }): Promise<void>;
}

/**
 * Tjänst för att hantera notifikationer om resursbegränsningar.
 * 
 * Denna tjänst ansvarar för att skicka notifikationer till användare
 * när de närmar sig eller når resursbegränsningar.
 */
export class ResourceLimitNotificationService {
  constructor(private notificationAdapter: NotificationAdapter) {}

  /**
   * Skickar en varning när en organisation närmar sig en resursbegränsning.
   * 
   * @param organizationId - ID för organisationen
   * @param resourceType - Typ av resurs som närmar sig begränsning
   * @param currentUsage - Nuvarande användning
   * @param limit - Resursbegränsning
   * @param userIds - Lista med användar-ID att notifiera
   * @returns Promise som löses när notifikationen är skickad
   */
  async sendLimitWarning(
    organizationId: UniqueId,
    resourceType: ResourceType,
    currentUsage: number,
    limit: number,
    userIds: string[]
  ): Promise<void> {
    // Beräkna användningsprocent
    const usagePercentage = Math.round((currentUsage / limit) * 100);
    
    // Skicka notifikation endast om användningen närmar sig gränsen
    if (usagePercentage >= 80) {
      const resourceLabel = this.getResourceLabel(resourceType);
      
      await this.notificationAdapter.sendNotification({
        title: 'Resursgräns närmar sig',
        body: `Din organisation använder ${usagePercentage}% av tillåtna ${resourceLabel.toLowerCase()}. Överväg att uppgradera din prenumeration.`,
        type: 'resource_limit_warning',
        metadata: {
          resourceType: resourceType.toString(),
          currentUsage,
          limit,
          percentage: usagePercentage,
          organizationId: organizationId.toString()
        },
        userIds
      });
    }
  }

  /**
   * Skickar en notifikation när en organisation har nått en resursbegränsning.
   * 
   * @param organizationId - ID för organisationen
   * @param resourceType - Typ av resurs som nått begränsningen
   * @param limit - Resursbegränsning
   * @param userIds - Lista med användar-ID att notifiera
   * @returns Promise som löses när notifikationen är skickad
   */
  async sendLimitReached(
    organizationId: UniqueId,
    resourceType: ResourceType,
    limit: number,
    userIds: string[]
  ): Promise<void> {
    const resourceLabel = this.getResourceLabel(resourceType);
    
    await this.notificationAdapter.sendNotification({
      title: 'Resursgräns uppnådd',
      body: `Din organisation har nått gränsen för antal ${resourceLabel.toLowerCase()} (${limit}). Uppgradera din prenumeration för att skapa fler.`,
      type: 'resource_limit_reached',
      metadata: {
        resourceType: resourceType.toString(),
        limit,
        organizationId: organizationId.toString()
      },
      userIds
    });
  }

  /**
   * Skickar en sammanfattning av resursbegränsningar för en organisation.
   * 
   * @param organizationId - ID för organisationen
   * @param resourceLimits - Objekt med olika resursbegränsningar och användning
   * @param userIds - Lista med användar-ID att notifiera
   * @returns Promise som löses när notifikationen är skickad
   */
  async sendLimitSummary(
    organizationId: UniqueId,
    resourceLimits: Record<string, { current: number; limit: number }>,
    userIds: string[]
  ): Promise<void> {
    // Filtrera ut resurser som närmar sig eller har nått gränsen
    const nearLimits = Object.entries(resourceLimits).filter(([_, { current, limit }]) => {
      const percentage = (current / limit) * 100;
      return percentage >= 80;
    });
    
    if (nearLimits.length === 0) {
      return; // Ingen notifikation behövs
    }
    
    // Skapa en lista med resurser som närmar sig gränsen
    const limitDescriptions = nearLimits.map(([type, { current, limit }]) => {
      const resourceType = type as ResourceType;
      const resourceLabel = this.getResourceLabel(resourceType);
      const percentage = Math.round((current / limit) * 100);
      
      return `${resourceLabel}: ${current}/${limit} (${percentage}%)`;
    }).join('\n');
    
    await this.notificationAdapter.sendNotification({
      title: 'Sammanfattning av resursbegränsningar',
      body: `Följande resurser närmar sig eller har nått sina gränser:\n\n${limitDescriptions}\n\nÖverväg att uppgradera din prenumeration.`,
      type: 'resource_limit_summary',
      metadata: {
        resourceLimits,
        organizationId: organizationId.toString()
      },
      userIds
    });
  }

  /**
   * Hämtar den svenska etiketten för en resurstyp.
   */
  private getResourceLabel(resourceType: ResourceType): string {
    if (resourceType === 'team' as any) {
      return 'Team';
    } else if (resourceType === 'teamMember' as any) {
      return 'Teammedlemmar';
    } else {
      const label = ResourceTypeLabels[resourceType as keyof typeof ResourceTypeLabels];
      return label ? label.charAt(0).toUpperCase() + label.slice(1) : 'Resurser';
    }
  }
} 