import React from 'react';
import { FlatList, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Team } from '@/types/team';
import { TeamCard } from '@/components/ui/TeamCard';
import { UserGroup } from 'lucide-react-native';

/**
 * Props för TeamList-komponenten
 * 
 * @interface TeamListProps
 * @property {Team[]} teams - Lista med team att visa
 * @property {(teamId: string) => void} onSelectTeam - Callback som anropas när ett team väljs
 * @property {string} [selectedTeamId] - ID för det valda teamet (om något)
 * @property {boolean} [isLoading] - Om listan håller på att laddas
 * @property {boolean} [isRefreshing] - Om listan håller på att uppdateras
 * @property {() => void} [onRefresh] - Callback för att uppdatera listan
 * @property {'default' | 'compact' | 'detailed'} [cardVariant] - Visningsvariant för TeamCard
 */
interface TeamListProps {
  teams: Team[];
  onSelectTeam: (teamId: string) => void;
  selectedTeamId?: string;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  cardVariant?: 'default' | 'compact' | 'detailed';
}

/**
 * Lista som visar team med stöd för laddningstillstånd och uppdatering
 * 
 * Denna komponent renderar en lista med TeamCard-komponenter och hanterar
 * laddningstillstånd, tom lista, och uppdatering (pull-to-refresh).
 * 
 * @param {TeamListProps} props - Komponentens props
 * @returns {React.ReactElement} Den renderade komponenten
 * 
 * @example
 * <TeamList
 *   teams={teams}
 *   onSelectTeam={handleSelectTeam}
 *   selectedTeamId={selectedTeamId}
 *   isLoading={isLoading}
 *   isRefreshing={isRefreshing}
 *   onRefresh={handleRefresh}
 * />
 */
export const TeamList: React.FC<TeamListProps> = ({
  teams,
  onSelectTeam,
  selectedTeamId,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  cardVariant = 'default'
}) => {
  const { colors } = useTheme();
  
  // Renderingsfunktion för varje team i listan
  const renderTeamItem = ({ item }: { item: Team }) => {
    return (
      <TeamCard
        team={item}
        onPress={() => onSelectTeam(item.id)}
        isSelected={selectedTeamId === item.id}
        variant={cardVariant}
        showMemberCount={true}
        showPrivacy={true}
        testID={`team-card-${item.id}`}
      />
    );
  };
  
  // Om det inte finns några team och listan inte håller på att laddas, visa en tom lista
  if (teams.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyContainer} testID="empty-state">
        <UserGroup size={48} color={colors.text.light} />
        <Text style={[styles.emptyText, { color: colors.text.main }]}>
          Inga team hittades
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.text.light }]}>
          Du är inte medlem i något team ännu
        </Text>
      </View>
    );
  }
  
  // Renderingsfunktion för laddningstillstånd
  const renderLoading = () => {
    if (!isLoading) return null;
    
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator 
          size="large" 
          color={colors.primary.main}
          testID="loading-indicator"
        />
      </View>
    );
  };
  
  // Renderingsfunktion för listhuvud (används när isLoading är true)
  const renderListHeader = () => {
    if (!isLoading || teams.length > 0) return null;
    
    return (
      <View style={styles.loadingHeader}>
        <Text style={[styles.loadingText, { color: colors.text.main }]}>
          Laddar team...
        </Text>
      </View>
    );
  };
  
  return (
    <FlatList
      data={teams}
      renderItem={renderTeamItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      ListHeaderComponent={renderListHeader}
      ListFooterComponent={renderLoading}
      showsVerticalScrollIndicator={false}
      testID="team-list"
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingHeader: {
    padding: 12,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
  },
}); 