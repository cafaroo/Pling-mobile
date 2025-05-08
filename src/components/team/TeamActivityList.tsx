import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useTeamActivities } from '@/application/team/hooks/useTeamActivities';
import { TeamActivityDTO } from '@/application/team/useCases/getTeamActivities';
import { ActivityType, ActivityCategories } from '@/domain/team/value-objects/ActivityType';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

interface TeamActivityListProps {
  teamId: string;
  limit?: number;
  showFilters?: boolean;
  onSelectActivity?: (activity: TeamActivityDTO) => void;
}

// Hjälpfunktion för att få ikonnamn baserat på aktivitetstyp
const getIconForActivityType = (type: ActivityType): string => {
  switch (type) {
    case ActivityType.MEMBER_JOINED:
      return 'person-add';
    case ActivityType.MEMBER_LEFT:
      return 'person-remove';
    case ActivityType.ROLE_CHANGED:
      return 'shield';
    case ActivityType.TEAM_CREATED:
      return 'create';
    case ActivityType.TEAM_UPDATED:
      return 'pencil';
    case ActivityType.INVITATION_SENT:
      return 'mail';
    case ActivityType.INVITATION_ACCEPTED:
      return 'checkmark-circle';
    case ActivityType.INVITATION_DECLINED:
      return 'close-circle';
    case ActivityType.TEAM_SETTINGS_UPDATED:
      return 'settings';
    case ActivityType.GOAL_CREATED:
    case ActivityType.GOAL_UPDATED:
    case ActivityType.GOAL_COMPLETED:
      return 'flag';
    case ActivityType.ACTIVITY_CREATED:
    case ActivityType.ACTIVITY_COMPLETED:
    case ActivityType.ACTIVITY_JOINED:
      return 'fitness';
    default:
      return 'information-circle';
  }
};

// Hjälpfunktion för att få färg baserat på aktivitetstyp
const getColorForActivityType = (type: ActivityType): string => {
  if (ActivityCategories.MEMBER.includes(type)) {
    return '#4CAF50'; // Grön för medlemsrelaterade aktiviteter
  } else if (ActivityCategories.INVITATION.includes(type)) {
    return '#2196F3'; // Blå för inbjudningsrelaterade aktiviteter
  } else if (ActivityCategories.TEAM.includes(type)) {
    return '#FF9800'; // Orange för teamrelaterade aktiviteter
  } else if (ActivityCategories.GOAL.includes(type)) {
    return '#9C27B0'; // Lila för målrelaterade aktiviteter
  } else if (ActivityCategories.ACTIVITY.includes(type)) {
    return '#F44336'; // Röd för aktivitetsrelaterade aktiviteter
  }
  return '#757575'; // Grå för övrigt
};

const TeamActivityList: React.FC<TeamActivityListProps> = ({
  teamId,
  limit = 10,
  showFilters = true,
  onSelectActivity
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Beräkna aktiva filter baserat på selection
  const activeTypes = selectedFilter 
    ? (ActivityCategories as Record<string, ActivityType[]>)[selectedFilter] || null
    : null;
  
  const { 
    activities, 
    total, 
    hasMore, 
    isLoading, 
    error,
    refetch,
    activityStats
  } = useTeamActivities({
    teamId,
    activityTypes: activeTypes || undefined,
    limit,
    offset: currentPage * limit
  });
  
  // Hantera filterbyte
  const handleFilterChange = (category: string | null) => {
    setSelectedFilter(category === selectedFilter ? null : category);
    setCurrentPage(0);
  };
  
  // Rendera filterknappar för aktivitetstyper
  const renderFilters = () => {
    if (!showFilters) return null;
    
    return (
      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>Filtrera efter:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {Object.keys(ActivityCategories).map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                selectedFilter === category && styles.filterButtonActive,
                { borderColor: selectedFilter === category ? getColorForActivityType((ActivityCategories as any)[category][0]) : '#ccc' }
              ]}
              onPress={() => handleFilterChange(category)}
            >
              <Text 
                style={[
                  styles.filterText, 
                  selectedFilter === category && styles.filterTextActive
                ]}
              >
                {category}
              </Text>
              {activityStats && activityStats[(ActivityCategories as any)[category][0]] && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {Object.keys(activityStats)
                      .filter(type => (ActivityCategories as any)[category].includes(type))
                      .reduce((sum, type) => sum + (activityStats[type as ActivityType] || 0), 0)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };
  
  // Rendera en aktivitetsrad
  const renderActivityItem = ({ item }: { item: TeamActivityDTO }) => (
    <TouchableOpacity 
      style={styles.activityItem}
      onPress={() => onSelectActivity && onSelectActivity(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: getColorForActivityType(item.activityType) }]}>
        <Ionicons name={getIconForActivityType(item.activityType) as any} size={18} color="white" />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityDescription}>{item.description}</Text>
        <Text style={styles.activityTimestamp}>
          {format(new Date(item.timestamp), 'PPP, HH:mm', { locale: sv })}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  // Visar laddning
  if (isLoading && activities.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Hämtar aktiviteter...</Text>
      </View>
    );
  }
  
  // Visar fel
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Kunde inte ladda aktiviteter</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryText}>Försök igen</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Visar när inga aktiviteter finns
  if (activities.length === 0) {
    return (
      <View style={styles.container}>
        {renderFilters()}
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Inga aktiviteter hittades</Text>
          {selectedFilter && (
            <TouchableOpacity onPress={() => setSelectedFilter(null)}>
              <Text style={styles.clearFilterText}>Ta bort filter</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {renderFilters()}
      
      <FlatList
        data={activities}
        renderItem={renderActivityItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        onEndReached={() => {
          if (hasMore) {
            setCurrentPage(prev => prev + 1);
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          hasMore ? (
            <ActivityIndicator style={styles.footerLoader} size="small" color="#0000ff" />
          ) : activities.length > 0 ? (
            <Text style={styles.endListText}>
              Visar {activities.length} av {total} aktiviteter
            </Text>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    marginBottom: 10,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#3498db',
    borderRadius: 4,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  clearFilterText: {
    marginTop: 15,
    fontSize: 14,
    color: '#3498db',
    textDecorationLine: 'underline',
  },
  filtersContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButtonActive: {
    borderWidth: 1,
    backgroundColor: '#f8f8f8',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
  },
  filterTextActive: {
    fontWeight: '500',
    color: '#333',
  },
  filterBadge: {
    marginLeft: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 16,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    color: '#333',
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 20,
  },
  activityItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  activityTimestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  footerLoader: {
    marginVertical: 16,
  },
  endListText: {
    textAlign: 'center',
    padding: 16,
    color: '#999',
    fontSize: 12,
  },
});

export default TeamActivityList; 