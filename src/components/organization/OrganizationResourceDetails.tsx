import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrganization } from './OrganizationProvider';
import { OrganizationResource } from '@/domain/organization/entities/OrganizationResource';
import { ResourceTypeLabels } from '@/domain/organization/value-objects/ResourceType';
import { ResourcePermissionLabels } from '@/domain/organization/value-objects/ResourcePermission';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/styles/theme';

interface OrganizationResourceDetailsProps {
  resourceId: string;
  onBack: () => void;
  onDelete: () => void;
  onEdit: (resource: OrganizationResource) => void;
  onAddPermission: (resource: OrganizationResource) => void;
}

export const OrganizationResourceDetails: React.FC<OrganizationResourceDetailsProps> = ({
  resourceId,
  onBack,
  onDelete,
  onEdit,
  onAddPermission
}) => {
  const { getResourceById, deleteResource } = useOrganization();
  const { user } = useAuth();
  
  const [resource, setResource] = useState<OrganizationResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Hämta resursen
  const fetchResource = useCallback(async () => {
    try {
      setError(null);
      
      const fetchedResource = await getResourceById(resourceId);
      setResource(fetchedResource);
    } catch (err) {
      console.error('Fel vid hämtning av resurs:', err);
      setError('Kunde inte hämta resursen. Försök igen senare.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [resourceId, getResourceById]);
  
  useEffect(() => {
    fetchResource();
  }, [fetchResource]);
  
  // Hantera refresh (pull-to-refresh)
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchResource();
  }, [fetchResource]);
  
  // Hantera borttagning
  const handleDelete = () => {
    Alert.alert(
      'Ta bort resurs',
      `Är du säker på att du vill ta bort "${resource?.name}"? Denna åtgärd kan inte ångras.`,
      [
        {
          text: 'Avbryt',
          style: 'cancel'
        },
        {
          text: 'Ta bort',
          style: 'destructive',
          onPress: async () => {
            if (!resource) return;
            
            try {
              setDeleting(true);
              await deleteResource(resource.id.toString());
              onDelete();
            } catch (err) {
              console.error('Fel vid borttagning av resurs:', err);
              Alert.alert('Fel', 'Kunde inte ta bort resursen. Försök igen senare.');
              setDeleting(false);
            }
          }
        }
      ]
    );
  };
  
  // Kontrollera om användaren har en specifik behörighet
  const hasPermission = (permission: string): boolean => {
    if (!resource || !user) return false;
    
    // Användaren är ägare, så de har alla behörigheter
    if (user.id === resource.ownerId.toString()) {
      return true;
    }
    
    // Kontrollera specifika behörigheter
    const userPermission = resource.permissionAssignments.find(
      p => p.userId && p.userId.toString() === user.id
    );
    
    if (userPermission) {
      return userPermission.permissions.includes(permission);
    }
    
    // Kontrollera team-behörigheter (skulle kräva kontext om användarens team)
    // ...
    
    return false;
  };
  
  // Visa laddningsindikator
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Laddar resursdetaljer...</Text>
      </View>
    );
  }
  
  // Visa felmeddelande
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={theme.colors.red[500]} />
        <Text style={styles.errorText}>{error}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>Tillbaka</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retryButton} onPress={fetchResource}>
            <Text style={styles.retryButtonText}>Försök igen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  // Visa meddelande om resursen inte hittades
  if (!resource) {
    return (
      <View style={styles.notFoundContainer}>
        <Ionicons name="help-circle" size={64} color={theme.colors.gray[400]} />
        <Text style={styles.notFoundText}>Resursen finns inte</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Tillbaka</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButtonIcon} 
          onPress={onBack}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {resource.name}
        </Text>
        <View style={styles.headerActions}>
          {hasPermission('edit') && (
            <TouchableOpacity 
              style={styles.headerActionButton} 
              onPress={() => onEdit(resource)}
              disabled={deleting}
            >
              <Ionicons name="pencil" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          {hasPermission('delete') && (
            <TouchableOpacity 
              style={[styles.headerActionButton, styles.deleteButton]} 
              onPress={handleDelete}
              disabled={deleting}
            >
              <Ionicons name="trash" size={20} color={theme.colors.red[500]} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.resourceCard}>
          <View style={styles.resourceHeader}>
            <View style={styles.resourceTypeContainer}>
              <Text style={styles.resourceType}>
                {ResourceTypeLabels[resource.type]}
              </Text>
            </View>
            <Text style={styles.dateText}>
              Uppdaterad: {new Date(resource.updatedAt).toLocaleDateString('sv-SE')}
            </Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Beskrivning</Text>
            <Text style={styles.descriptionText}>
              {resource.description || 'Ingen beskrivning tillgänglig'}
            </Text>
          </View>
          
          {Object.keys(resource.metadata || {}).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Metadata</Text>
              {Object.entries(resource.metadata || {}).map(([key, value]) => (
                <View key={key} style={styles.metadataItem}>
                  <Text style={styles.metadataKey}>{key}:</Text>
                  <Text style={styles.metadataValue}>
                    {typeof value === 'object' 
                      ? JSON.stringify(value) 
                      : String(value)}
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Behörigheter</Text>
              {hasPermission('manage_permissions') && (
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => onAddPermission(resource)}
                  disabled={deleting}
                >
                  <Text style={styles.addButtonText}>Lägg till</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {resource.permissionAssignments.length > 0 ? (
              <View style={styles.permissionsContainer}>
                {resource.permissionAssignments.map((permission, index) => (
                  <View key={index} style={styles.permissionItem}>
                    <View style={styles.permissionEntity}>
                      <Ionicons 
                        name={
                          permission.userId 
                            ? "person" 
                            : permission.teamId 
                              ? "people" 
                              : "shield"
                        } 
                        size={18} 
                        color={theme.colors.gray[600]} 
                        style={styles.permissionIcon}
                      />
                      <Text style={styles.permissionEntityText}>
                        {permission.userId 
                          ? `Användare: ${permission.userId.toString().substring(0, 8)}...`
                          : permission.teamId 
                            ? `Team: ${permission.teamId.toString().substring(0, 8)}...`
                            : `Roll: ${permission.role}`
                        }
                      </Text>
                    </View>
                    <View style={styles.permissionBadges}>
                      {permission.permissions.map(perm => (
                        <View 
                          key={perm} 
                          style={[
                            styles.permissionBadge,
                            perm === 'delete' && styles.permissionBadgeDelete,
                            perm === 'edit' && styles.permissionBadgeEdit,
                            perm === 'view' && styles.permissionBadgeView
                          ]}
                        >
                          <Text style={styles.permissionBadgeText}>
                            {ResourcePermissionLabels[perm]}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noPermissionsText}>
                Inga specifika behörigheter tilldelade
              </Text>
            )}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Information</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Skapat:</Text>
              <Text style={styles.infoValue}>
                {new Date(resource.createdAt).toLocaleString('sv-SE')}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ägare:</Text>
              <Text style={styles.infoValue}>
                {resource.ownerId.toString()}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Resurs-ID:</Text>
              <Text style={styles.infoValue}>
                {resource.id.toString()}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {deleting && (
        <View style={styles.deletingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.white} />
          <Text style={styles.deletingText}>Tar bort resurs...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray[100]
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.white
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.gray[600]
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.white
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 16,
    color: theme.colors.gray[700],
    textAlign: 'center'
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.white
  },
  notFoundText: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 18,
    color: theme.colors.gray[700],
    textAlign: 'center'
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.gray[300],
    borderRadius: 8,
    marginHorizontal: 6
  },
  backButtonText: {
    color: theme.colors.gray[800],
    fontWeight: '500'
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    marginHorizontal: 6
  },
  retryButtonText: {
    color: theme.colors.white,
    fontWeight: '500'
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  backButtonIcon: {
    padding: 4
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.gray[900],
    marginLeft: 12
  },
  headerActions: {
    flexDirection: 'row'
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  deleteButton: {
    backgroundColor: theme.colors.red[50]
  },
  content: {
    flex: 1
  },
  resourceCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2.5,
    elevation: 2
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  resourceTypeContainer: {
    backgroundColor: theme.colors.gray[100],
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16
  },
  resourceType: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.gray[700]
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.gray[500]
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.gray[900],
    marginBottom: 8
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  descriptionText: {
    fontSize: 15,
    color: theme.colors.gray[800],
    lineHeight: 22
  },
  metadataItem: {
    flexDirection: 'row',
    marginBottom: 6
  },
  metadataKey: {
    fontSize: 14,
    color: theme.colors.gray[700],
    fontWeight: '500',
    marginRight: 4
  },
  metadataValue: {
    fontSize: 14,
    color: theme.colors.gray[900],
    flex: 1
  },
  addButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 6
  },
  addButtonText: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '500'
  },
  permissionsContainer: {
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderRadius: 8,
    overflow: 'hidden'
  },
  permissionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200]
  },
  permissionEntity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  permissionIcon: {
    marginRight: 8
  },
  permissionEntityText: {
    fontSize: 14,
    color: theme.colors.gray[800],
    fontWeight: '500'
  },
  permissionBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  permissionBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.gray[200],
    marginRight: 6,
    marginBottom: 4
  },
  permissionBadgeDelete: {
    backgroundColor: theme.colors.red[100]
  },
  permissionBadgeEdit: {
    backgroundColor: theme.colors.blue[100]
  },
  permissionBadgeView: {
    backgroundColor: theme.colors.green[100]
  },
  permissionBadgeText: {
    fontSize: 12,
    color: theme.colors.gray[800],
    fontWeight: '500'
  },
  noPermissionsText: {
    fontSize: 14,
    color: theme.colors.gray[500],
    fontStyle: 'italic'
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 8
  },
  infoLabel: {
    width: 80,
    fontSize: 14,
    color: theme.colors.gray[600],
    fontWeight: '500'
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.gray[900]
  },
  deletingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  deletingText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12
  }
}); 