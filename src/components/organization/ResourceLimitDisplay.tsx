import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useOrganization } from './OrganizationProvider';
import { ResourceType } from '@/domain/organization/strategies/ResourceLimitStrategy';
import { ResourceLimitError } from './ResourceLimitError';

interface ResourceLimitDisplayProps {
  organizationId: string;
  resourceType?: ResourceType;
  currentCount?: number;
  showAddButton?: boolean;
  onAddPress?: () => void;
  onUpgradePress?: () => void;
  style?: any;
}

/**
 * Komponent som visar resursbegränsningsinformation för en organisation.
 * 
 * Visar en progressbar med nuvarande användning och begränsning,
 * samt en "Lägg till"-knapp om det är möjligt att lägga till fler resurser.
 */
export const ResourceLimitDisplay: React.FC<ResourceLimitDisplayProps> = ({
  organizationId,
  resourceType = ResourceType.GOAL,
  currentCount = 0,
  showAddButton = true,
  onAddPress,
  onUpgradePress,
  style
}) => {
  const { 
    canAddMoreResources, 
    canAddMoreMembers, 
    canAddMoreTeams,
    getOrganizationById
  } = useOrganization();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limitInfo, setLimitInfo] = useState<{
    allowed: boolean;
    limit?: number;
    currentUsage?: number;
    usagePercentage?: number;
    reason?: string;
  } | null>(null);
  
  useEffect(() => {
    const checkLimit = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let result;
        
        // Använd rätt metod beroende på resurstyp
        if (resourceType === 'members') {
          result = await canAddMoreMembers(organizationId);
        } else if (resourceType === 'teams') {
          result = await canAddMoreTeams(organizationId);
        } else {
          // För övriga resurstyper
          result = await canAddMoreResources(
            organizationId,
            resourceType as ResourceType,
            currentCount
          );
        }
        
        if (!result.allowed) {
          setError(result.error || null);
        }
        
        if (result.result) {
          setLimitInfo({
            allowed: result.result.allowed,
            limit: result.result.limit,
            currentUsage: result.result.currentUsage,
            usagePercentage: result.result.usagePercentage,
            reason: result.result.reason
          });
        }
      } catch (error) {
        setError(`Kunde inte kontrollera resursbegränsning: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setLoading(false);
      }
    };
    
    checkLimit();
  }, [organizationId, resourceType, currentCount]);
  
  // Om komponenten laddar, visa laddningsindikator
  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="small" color="#ff9800" />
        <Text style={styles.loadingText}>Kontrollerar resursbegränsningar...</Text>
      </View>
    );
  }
  
  // Om det finns ett fel eller begränsning har nåtts, visa ResourceLimitError
  if (error || (limitInfo && !limitInfo.allowed)) {
    return (
      <ResourceLimitError 
        error={error || limitInfo?.reason}
        limitResult={limitInfo ? {
          allowed: limitInfo.allowed,
          limit: limitInfo.limit,
          currentUsage: limitInfo.currentUsage,
          usagePercentage: limitInfo.usagePercentage,
          reason: limitInfo.reason
        } : undefined}
        onUpgrade={onUpgradePress}
        style={style}
      />
    );
  }
  
  // Om allt är ok, visa användning och en "Lägg till"-knapp om önskat
  return (
    <View style={[styles.container, style]}>
      {limitInfo && (
        <View style={styles.usageContainer}>
          <View style={styles.usageBarContainer}>
            <View 
              style={[
                styles.usageBar, 
                { 
                  width: `${limitInfo.usagePercentage || 0}%`,
                  backgroundColor: 
                    (limitInfo.usagePercentage || 0) > 90 ? '#f44336' : 
                    (limitInfo.usagePercentage || 0) > 70 ? '#ff9800' : 
                    '#4caf50'
                }
              ]} 
            />
          </View>
          
          <Text style={styles.usageText}>
            {limitInfo.currentUsage || 0} av {limitInfo.limit || 0} ({limitInfo.usagePercentage || 0}%)
          </Text>
        </View>
      )}
      
      {showAddButton && limitInfo?.allowed && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={onAddPress}
          disabled={!limitInfo.allowed}
        >
          <MaterialIcons name="add" size={18} color="white" />
          <Text style={styles.addButtonText}>Lägg till</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginVertical: 8,
  },
  usageContainer: {
    flex: 1,
  },
  usageBarContainer: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  usageBar: {
    height: '100%',
    borderRadius: 3,
  },
  usageText: {
    fontSize: 12,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
}); 