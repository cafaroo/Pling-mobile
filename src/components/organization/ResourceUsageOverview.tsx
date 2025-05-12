import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, ProgressBar, Button, useTheme, Divider } from 'react-native-paper';
import { ResourceType, ResourceTypeLabels } from '@/domain/organization/strategies/ResourceLimitStrategy';
import { useOrganization } from './OrganizationProvider';

interface ResourceUsageItem {
  resourceType: ResourceType | string;
  label: string;
  current: number;
  limit: number;
  usagePercentage: number;
}

interface ResourceUsageOverviewProps {
  organizationId: string;
  onUpgradePress?: () => void;
}

/**
 * Komponent som visar en översikt över resursanvändning för en organisation.
 * 
 * Komponenten visar aktuell användning och begränsningar för olika resurstyper
 * samt en uppgraderingsknapp om några gränser är nära att uppnås.
 */
export const ResourceUsageOverview: React.FC<ResourceUsageOverviewProps> = ({
  organizationId,
  onUpgradePress,
}) => {
  const { organization, loading, resourceLimitFactory } = useOrganization(organizationId);
  const [resourceUsage, setResourceUsage] = useState<ResourceUsageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    if (!organization || !resourceLimitFactory) {
      return;
    }

    const fetchResourceUsage = async () => {
      setIsLoading(true);
      
      try {
        // Hämta användning för alla resurstyper
        const resourceTypes = [
          ResourceType.GOAL,
          ResourceType.COMPETITION,
          ResourceType.REPORT,
          ResourceType.DASHBOARD,
          'team',
          'teamMember'
        ];
        
        const usageItems: ResourceUsageItem[] = [];
        
        for (const type of resourceTypes) {
          if (type === 'team') {
            // Specialhantering för team
            const teamStrategy = resourceLimitFactory.getTeamStrategy();
            
            // Räkna antal team
            const teamCount = organization.teamIds.length;
            
            // Hämta information om begränsningar
            const limit = await teamStrategy.getLimit(organization.id);
            const usagePercentage = await teamStrategy.getUsagePercentage(organization.id, teamCount);
            
            usageItems.push({
              resourceType: 'team',
              label: 'Team',
              current: teamCount,
              limit,
              usagePercentage
            });
          } else if (type === 'teamMember') {
            // Specialhantering för teammedlemmar
            const memberStrategy = resourceLimitFactory.getTeamMemberStrategy();
            
            // Räkna antal medlemmar
            const memberCount = organization.members.length;
            
            // Hämta information om begränsningar
            const limit = await memberStrategy.getLimit(organization.id);
            const usagePercentage = await memberStrategy.getUsagePercentage(organization.id, memberCount);
            
            usageItems.push({
              resourceType: 'teamMember',
              label: 'Teammedlemmar',
              current: memberCount,
              limit,
              usagePercentage
            });
          } else {
            // Standardhantering för resurstyper
            const resourceType = type as ResourceType;
            const strategy = resourceLimitFactory.getStrategyForResourceType(resourceType);
            
            // Anropa backend för att hämta antalet resurser
            // Detta bör implementeras enligt din datamodell
            const resourceCount = await getResourceCount(organizationId, resourceType);
            
            // Hämta information om begränsningar
            const limit = await strategy.getLimit(organization.id);
            const usagePercentage = await strategy.getUsagePercentage(organization.id, resourceCount);
            
            usageItems.push({
              resourceType,
              label: getResourceLabel(resourceType),
              current: resourceCount,
              limit,
              usagePercentage
            });
          }
        }
        
        setResourceUsage(usageItems);
      } catch (error) {
        console.error('Fel vid hämtning av resursanvändning:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResourceUsage();
  }, [organization, resourceLimitFactory, organizationId]);

  if (loading || isLoading || !organization) {
    return (
      <Card style={styles.container}>
        <Card.Content>
          <Text style={styles.title}>Resursanvändning</Text>
          <Text>Laddar resursinformation...</Text>
        </Card.Content>
      </Card>
    );
  }

  // Kontrollera om användaren närmar sig någon begränsning (80% eller mer)
  const nearLimit = resourceUsage.some(item => item.usagePercentage >= 80);
  
  // Kontrollera om användaren har uppnått någon begränsning
  const atLimit = resourceUsage.some(item => item.usagePercentage >= 100);

  return (
    <Card style={styles.container}>
      <Card.Content>
        <Text style={styles.title}>Resursanvändning</Text>
        
        <ScrollView style={styles.scrollContainer}>
          {resourceUsage.map((item, index) => (
            <View key={`${item.resourceType}-${index}`} style={styles.resourceItem}>
              <View style={styles.resourceHeader}>
                <Text>{item.label}</Text>
                <Text>{`${item.current} / ${item.limit}`}</Text>
              </View>
              <ProgressBar
                progress={item.usagePercentage / 100}
                color={getProgressBarColor(item.usagePercentage, theme)}
                style={styles.progressBar}
              />
            </View>
          ))}
        </ScrollView>
        
        {(nearLimit || atLimit) && (
          <>
            <Divider style={styles.divider} />
            
            <View style={styles.upgradeContainer}>
              <Text style={[styles.warningText, atLimit && styles.errorText]}>
                {atLimit
                  ? 'Du har nått gränsen för en eller flera resurser.'
                  : 'Du närmar dig gränsen för en eller flera resurser.'}
              </Text>
              
              <Button
                mode="contained"
                onPress={onUpgradePress}
                style={styles.upgradeButton}
              >
                Uppgradera prenumeration
              </Button>
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );
};

/**
 * Hjälpfunktion för att hämta färg för progress bar baserat på användningsprocent.
 */
function getProgressBarColor(percentage: number, theme: any): string {
  if (percentage >= 100) {
    return theme.colors.error;
  } else if (percentage >= 80) {
    return theme.colors.warning || '#FFC107';
  } else {
    return theme.colors.primary;
  }
}

/**
 * Hjälpfunktion för att hämta svensk etikett för resurstyp.
 */
function getResourceLabel(resourceType: ResourceType): string {
  const label = ResourceTypeLabels[resourceType];
  // Första bokstaven versal
  return label.charAt(0).toUpperCase() + label.slice(1) + 'er';
}

/**
 * Temporär funktion för att hämta antalet resurser av en viss typ.
 * Detta bör ersättas med riktig data från ditt backend.
 */
async function getResourceCount(organizationId: string, resourceType: ResourceType): Promise<number> {
  // Här bör du implementera faktiskt resurshämtning från ditt API
  // För tillfället returnerar vi bara exempel-data
  switch (resourceType) {
    case ResourceType.GOAL:
      return 3;
    case ResourceType.COMPETITION:
      return 1;
    case ResourceType.REPORT:
      return 2;
    case ResourceType.DASHBOARD:
      return 1;
    default:
      return 0;
  }
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  scrollContainer: {
    maxHeight: 300,
  },
  resourceItem: {
    marginBottom: 12,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  divider: {
    marginVertical: 12,
  },
  upgradeContainer: {
    marginTop: 8,
  },
  warningText: {
    marginBottom: 8,
    color: '#FFC107',
  },
  errorText: {
    color: '#F44336',
  },
  upgradeButton: {
    marginTop: 8,
  },
}); 