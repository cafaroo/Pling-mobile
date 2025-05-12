import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Divider, FAB, Chip, useTheme } from 'react-native-paper';
import { ResourceType, ResourceTypeLabels } from '@/domain/organization/strategies/ResourceLimitStrategy';
import { useOrganization } from './OrganizationProvider';
import { ResourceUsageOverview } from './ResourceUsageOverview';

interface ResourceItemProps {
  title: string;
  count: number;
  limit: number;
  usagePercentage: number;
  onManagePress: () => void;
}

/**
 * Komponent för att visa och hantera resursanvändning i en organisation.
 */
export const ResourceManagementTab: React.FC<{
  organizationId: string;
  onUpgradePress?: () => void;
}> = ({ organizationId, onUpgradePress }) => {
  const theme = useTheme();
  const { organization, loading, resourceLimitFactory } = useOrganization(organizationId);
  const [activeResourceType, setActiveResourceType] = useState<string | null>(null);
  const [resourceData, setResourceData] = useState<{
    [key: string]: {
      count: number;
      limit: number;
      usagePercentage: number;
    }
  }>({});

  useEffect(() => {
    if (!organization || !resourceLimitFactory) return;
    
    const fetchResourceData = async () => {
      try {
        // Notera att detta är en förenklad implementation och skulle hämta faktisk data från API
        const data: { [key: string]: { count: number; limit: number; usagePercentage: number } } = {};
        
        // Temporär testdata - skulle ersättas med faktiska API-anrop
        const resourceTypes = [
          { type: ResourceType.GOAL, count: 8 },
          { type: ResourceType.COMPETITION, count: 3 },
          { type: ResourceType.REPORT, count: 5 },
          { type: ResourceType.DASHBOARD, count: 2 },
          { type: ResourceType.MEDIA, count: 50 },
          { type: 'team', count: organization.teamIds.length },
          { type: 'teamMember', count: organization.members.length }
        ];
        
        for (const { type, count } of resourceTypes) {
          let strategy;
          
          if (type === 'team') {
            strategy = resourceLimitFactory.getTeamStrategy();
          } else if (type === 'teamMember') {
            strategy = resourceLimitFactory.getTeamMemberStrategy();
          } else {
            strategy = resourceLimitFactory.getStrategyForResourceType(type as ResourceType);
          }
          
          const limit = await strategy.getLimit(organization.id);
          const usagePercentage = await strategy.getUsagePercentage(organization.id, count);
          
          data[type] = { count, limit, usagePercentage };
        }
        
        setResourceData(data);
      } catch (error) {
        console.error('Fel vid hämtning av resursdata:', error);
      }
    };
    
    fetchResourceData();
  }, [organization, resourceLimitFactory]);

  if (loading || !organization) {
    return (
      <View style={styles.container}>
        <Text>Laddar resursdata...</Text>
      </View>
    );
  }

  const getResourceLabel = (type: string): string => {
    if (type === 'team') return 'Team';
    if (type === 'teamMember') return 'Teammedlemmar';
    
    const resourceType = type as ResourceType;
    const label = ResourceTypeLabels[resourceType];
    if (!label) return 'Resurser';
    
    return label.charAt(0).toUpperCase() + label.slice(1);
  };
  
  const renderActiveResourceDetails = () => {
    if (!activeResourceType || !resourceData[activeResourceType]) {
      return null;
    }
    
    const { count, limit, usagePercentage } = resourceData[activeResourceType];
    const label = getResourceLabel(activeResourceType);
    
    return (
      <Card style={styles.detailsCard}>
        <Card.Title title={`${label} - Detaljerad information`} />
        <Card.Content>
          <Text style={styles.detailsText}>
            Din organisation använder för närvarande {count} av {limit} tillgängliga {label.toLowerCase()}.
          </Text>
          
          <Text style={styles.detailsText}>
            Detta utgör {usagePercentage}% av den tillgängliga kapaciteten.
          </Text>
          
          {usagePercentage >= 80 && (
            <Text style={[styles.warningText, usagePercentage >= 100 && styles.errorText]}>
              {usagePercentage >= 100
                ? `Du har nått gränsen för antal ${label.toLowerCase()}.`
                : `Du närmar dig gränsen för antal ${label.toLowerCase()}.`}
            </Text>
          )}
          
          <Text style={styles.detailsText}>
            {activeResourceType === 'teamMember'
              ? 'Avancerade funktioner för teammedlemmar finns tillgängliga med en uppgraderad prenumeration, inklusive fler medlemmar per team, avancerade roller och behörigheter.'
              : activeResourceType === 'team'
              ? 'Avancerade teamfunktioner finns tillgängliga med en uppgraderad prenumeration, inklusive fler team, teammallar och statistik.'
              : `Avancerade funktioner för ${label.toLowerCase()} finns tillgängliga med en uppgraderad prenumeration.`}
          </Text>
          
          <View style={styles.detailsActions}>
            <Button
              mode="contained"
              onPress={() => setActiveResourceType(null)}
              style={styles.detailsBackButton}
            >
              Tillbaka
            </Button>
            
            {(usagePercentage >= 80) && (
              <Button
                mode="contained"
                onPress={onUpgradePress}
                style={styles.upgradeButton}
                buttonColor={theme.colors.primary}
              >
                Uppgradera nu
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  const renderResourceList = () => {
    return (
      <>
        <ResourceUsageOverview 
          organizationId={organizationId} 
          onUpgradePress={onUpgradePress}
        />
        
        <Card style={styles.resourceListCard}>
          <Card.Title title="Hantera resurstyper" />
          <Card.Content>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipContainer}
            >
              {Object.keys(resourceData).map((type) => (
                <Chip
                  key={type}
                  selected={activeResourceType === type}
                  onPress={() => setActiveResourceType(type)}
                  style={styles.chip}
                  selectedColor={theme.colors.primary}
                >
                  {getResourceLabel(type)}
                </Chip>
              ))}
            </ScrollView>
            
            <Divider style={styles.divider} />
            
            <ScrollView style={styles.resourceItemsContainer}>
              {Object.entries(resourceData).map(([type, data]) => (
                <ResourceItem
                  key={type}
                  title={getResourceLabel(type)}
                  count={data.count}
                  limit={data.limit}
                  usagePercentage={data.usagePercentage}
                  onManagePress={() => setActiveResourceType(type)}
                />
              ))}
            </ScrollView>
          </Card.Content>
        </Card>
      </>
    );
  };

  return (
    <View style={styles.container}>
      {activeResourceType ? renderActiveResourceDetails() : renderResourceList()}
      
      {!activeResourceType && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => {
            // Här skulle du öppna en dialog eller navigera till skärm för att skapa resurs
            console.log('Öppna dialog för att skapa resurs');
          }}
        />
      )}
    </View>
  );
};

/**
 * Komponent för att visa en resurstyp i listan.
 */
const ResourceItem: React.FC<ResourceItemProps> = ({
  title,
  count,
  limit,
  usagePercentage,
  onManagePress
}) => {
  const theme = useTheme();
  
  // Bestäm färg baserat på användningsprocent
  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return theme.colors.error;
    if (percentage >= 80) return theme.colors.warning || '#FFC107';
    return theme.colors.primary;
  };
  
  const statusColor = getStatusColor(usagePercentage);
  
  return (
    <Card style={styles.resourceItem} mode="outlined">
      <Card.Content style={styles.resourceItemContent}>
        <View style={styles.resourceItemInfo}>
          <Text style={styles.resourceItemTitle}>{title}</Text>
          <Text style={styles.resourceItemCount}>
            {count} / {limit} ({usagePercentage}%)
          </Text>
          
          {usagePercentage >= 100 && (
            <Text style={[styles.resourceItemStatus, { color: statusColor }]}>
              Gräns uppnådd
            </Text>
          )}
          
          {usagePercentage >= 80 && usagePercentage < 100 && (
            <Text style={[styles.resourceItemStatus, { color: statusColor }]}>
              Närmar sig gräns
            </Text>
          )}
        </View>
        
        <Button 
          mode="outlined"
          onPress={onManagePress}
          style={styles.manageButton}
        >
          Hantera
        </Button>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  resourceListCard: {
    marginTop: 16,
    marginBottom: 80, // Extra utrymme för FAB
  },
  detailsCard: {
    marginVertical: 16,
  },
  chipContainer: {
    paddingVertical: 8,
  },
  chip: {
    marginRight: 8,
  },
  divider: {
    marginVertical: 16,
  },
  resourceItemsContainer: {
    maxHeight: 400,
  },
  resourceItem: {
    marginBottom: 8,
  },
  resourceItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resourceItemInfo: {
    flex: 1,
  },
  resourceItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resourceItemCount: {
    fontSize: 14,
    marginTop: 4,
  },
  resourceItemStatus: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: 'bold',
  },
  manageButton: {
    marginLeft: 8,
  },
  detailsText: {
    marginBottom: 12,
    fontSize: 16,
  },
  warningText: {
    color: '#FFC107',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  errorText: {
    color: '#F44336',
  },
  detailsActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  detailsBackButton: {
    flex: 1,
    marginRight: 8,
  },
  upgradeButton: {
    flex: 1,
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
}); 