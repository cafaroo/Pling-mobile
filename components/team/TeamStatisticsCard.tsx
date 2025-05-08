import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { TeamStatistics } from '@/domain/team/value-objects/TeamStatistics';
import { BarChart, Activity, Users } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTeamStatistics } from '@/application/team/hooks/useTeamStatistics';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface TeamStatisticsCardProps {
  teamId: string;
}

const TeamStatisticsCard: React.FC<TeamStatisticsCardProps> = ({ teamId }) => {
  const { colors } = useTheme();
  const { data: statistics, isLoading, error } = useTeamStatistics(teamId);

  // Beräkna kategorifärger baserat på tema
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'MEMBER':
        return colors.primary;
      case 'TEAM':
        return colors.secondary;
      case 'GOAL':
        return colors.success;
      case 'CHAT':
        return colors.info;
      default:
        return colors.muted;
    }
  };

  // Visa laddningsindikator
  if (isLoading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Laddar teamstatistik...
          </Text>
        </View>
      </View>
    );
  }

  // Visa felmeddelande
  if (error || !statistics) {
    return (
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error ? `Fel: ${error}` : 'Kunde inte ladda statistik'}
          </Text>
        </View>
      </View>
    );
  }

  // Visa team-statistik
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.header}>
        <BarChart color={colors.primary} size={24} />
        <Text style={[styles.title, { color: colors.text }]}>
          Teamstatistik
        </Text>
      </View>
      
      <View style={styles.statsContainer}>
        {/* Medlemmar och aktiviteter */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Users color={colors.primary} size={20} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {statistics.memberCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              Medlemmar
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {statistics.getActiveMembersPercentage()}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              Aktiva
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Activity color={colors.secondary} size={20} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {statistics.activityCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              Aktiviteter
            </Text>
          </View>
        </View>
        
        {/* Activity metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {statistics.getActivityPerMember()}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
              Aktiviteter/medlem
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {statistics.getActivityPerDay()}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
              Aktiviteter/dag
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {statistics.activeDaysPercentage}%
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
              Aktiva dagar
            </Text>
          </View>
        </View>
        
        {/* Activity breakdown */}
        <View style={styles.breakdownContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Aktivitetsfördelning
          </Text>
          
          {Object.entries(statistics.activityBreakdown).map(([category, count]) => (
            <View key={category} style={styles.breakdownItem}>
              <View style={styles.breakdownLabelContainer}>
                <View 
                  style={[
                    styles.categoryIndicator, 
                    { backgroundColor: getCategoryColor(category) }
                  ]} 
                />
                <Text style={[styles.breakdownLabel, { color: colors.text }]}>
                  {category}
                </Text>
              </View>
              <Text style={[styles.breakdownValue, { color: colors.text }]}>
                {count} ({statistics.activityCount > 0 
                  ? Math.round((count / statistics.activityCount) * 100) 
                  : 0}%)
              </Text>
            </View>
          ))}
        </View>
        
        {/* Last activity */}
        {statistics.lastActivityDate && (
          <View style={styles.lastActivityContainer}>
            <Text style={[styles.lastActivityLabel, { color: colors.textMuted }]}>
              Senaste aktivitet:
            </Text>
            <Text style={[styles.lastActivityDate, { color: colors.text }]}>
              {format(statistics.lastActivityDate, 'd MMMM yyyy', { locale: sv })}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statsContainer: {
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  breakdownContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  breakdownLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  breakdownLabel: {
    fontSize: 13,
  },
  breakdownValue: {
    fontSize: 13,
  },
  lastActivityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  lastActivityLabel: {
    fontSize: 12,
  },
  lastActivityDate: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
  },
});

export default TeamStatisticsCard; 