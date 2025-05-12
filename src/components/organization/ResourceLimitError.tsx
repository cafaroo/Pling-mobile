import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LimitCheckResult } from '@/domain/organization/strategies/ResourceLimitStrategy';
import { useOrganization } from './OrganizationProvider';

interface ResourceLimitErrorProps {
  error?: string;
  limitResult?: LimitCheckResult;
  onUpgrade?: () => void;
  style?: any;
}

/**
 * Komponent som visar resursbegränsningsfel för användaren.
 * 
 * Presenterar en användarvänlig förklaring av begränsningen tillsammans med en
 * "Uppgradera"-knapp om det är möjligt att uppgradera prenumerationen.
 */
export const ResourceLimitError: React.FC<ResourceLimitErrorProps> = ({
  error,
  limitResult,
  onUpgrade,
  style
}) => {
  const { currentOrganization } = useOrganization();
  
  // Om inget fel finns, visa ingenting
  if (!error && (!limitResult || limitResult.allowed)) {
    return null;
  }
  
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else if (currentOrganization) {
      // Här skulle vi kunna navigera till en uppgraderingssida
      console.log('Navigera till uppgraderingssida');
    }
  };
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <MaterialIcons name="error-outline" size={24} color="#f44336" />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.errorText}>
          {error || (limitResult?.reason || 'Du har nått en resursbegränsning')}
        </Text>
        
        {limitResult && (
          <View style={styles.detailsContainer}>
            <View style={styles.usageBarContainer}>
              <View 
                style={[
                  styles.usageBar, 
                  { 
                    width: `${limitResult.usagePercentage || 0}%`,
                    backgroundColor: 
                      (limitResult.usagePercentage || 0) > 90 ? '#f44336' : 
                      (limitResult.usagePercentage || 0) > 70 ? '#ff9800' : 
                      '#4caf50'
                  }
                ]} 
              />
            </View>
            
            <Text style={styles.usageText}>
              {limitResult.currentUsage || 0} av {limitResult.limit || 0} ({limitResult.usagePercentage || 0}%)
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.upgradeButton}
        onPress={handleUpgrade}
      >
        <Text style={styles.upgradeButtonText}>Uppgradera</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  iconContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  detailsContainer: {
    marginTop: 8,
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
  upgradeButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 12,
  },
  upgradeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
}); 