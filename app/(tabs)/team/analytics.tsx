import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChartBar as BarChart, TrendingUp, Users, Award } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTeamContext } from '@/context/TeamContext';
import { useRouter } from 'expo-router';
import { getTeamRanking } from '@/services/teamService';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import Tabs from '@/components/ui/Tabs';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';

interface TeamRankingData {
  rank: number;
  totalAmount: number;
  teamMembers: number;
  growth: number;
  competitions: number;
}

const MONTHLY_TARGET = 500000; // Kan flyttas till en config eller hämtas från API senare

export default function TeamAnalyticsScreen() {
  const { colors } = useTheme();
  const { selectedTeam, teams } = useTeamContext();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('performance');
  const [isLoading, setIsLoading] = useState(true);
  const [teamRanking, setTeamRanking] = useState<TeamRankingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeamData();
  }, [selectedTeam?.id]);

  const loadTeamData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!selectedTeam?.id) {
        setError('Inget team valt. Välj ett team först.');
        setIsLoading(false);
        return;
      }

      const ranking = await getTeamRanking(selectedTeam.id);
      setTeamRanking(ranking);
    } catch (error) {
      console.error('Error loading team data:', error);
      setError('Kunde inte ladda team-data. Försök igen senare.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedTeam && teams.length > 0) {
    return (
      <Container>
        <LinearGradient
          colors={[colors.background.dark, colors.primary.dark]}
          style={styles.background}
        />
        <Header 
          title="Team Analytics" 
          icon={BarChart} 
          onBackPress={() => router.back()}
        />
        <View style={styles.noTeamContainer}>
          <Text style={[styles.noTeamText, { color: colors.text.light }]}>
            Välj ett team för att se analytics
          </Text>
          <Button
            title="Gå till team-val"
            onPress={() => router.push('/team')}
            variant="primary"
          />
        </View>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container>
        <LinearGradient
          colors={[colors.background.dark, colors.primary.dark]}
          style={styles.background}
        />
        <Header 
          title="Team Analytics" 
          icon={BarChart} 
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text.light }]}>
            Laddar team analytics...
          </Text>
        </View>
      </Container>
    );
  }

  if (error || !teamRanking) {
    return (
      <Container>
        <LinearGradient
          colors={[colors.background.dark, colors.primary.dark]}
          style={styles.background}
        />
        <Header 
          title="Team Analytics" 
          icon={BarChart} 
          onBackPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error || 'Kunde inte ladda team-data'}
          </Text>
          {error?.includes('Inget team valt') && (
            <Button
              title="Gå till team-val"
              onPress={() => router.push('/team')}
              variant="primary"
              style={{ marginTop: 16 }}
            />
          )}
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.dark]}
        style={styles.background}
      />
      <Header 
        title="Team Analytics" 
        icon={BarChart} 
        onBackPress={() => router.back()}
      />

      <Tabs
        tabs={[
          { id: 'performance', label: 'Prestanda' },
          { id: 'members', label: 'Medlemmar' },
          { id: 'competitions', label: 'Tävlingar' },
        ]}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === 'performance' && (
          <>
            <Card style={styles.rankingCard}>
              <View style={styles.rankingHeader}>
                <Text style={[styles.rankingTitle, { color: colors.text.main }]}>
                  Team Ranking
                </Text>
                <View style={[styles.rankBadge, { backgroundColor: colors.accent.yellow }]}>
                  <Text style={[styles.rankText, { color: colors.background.dark }]}>
                    #{teamRanking.rank}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.totalSales, { color: colors.text.light }]}>
                Total försäljning: {new Intl.NumberFormat('sv-SE').format(teamRanking.totalAmount)} kr
              </Text>
              
              <View style={styles.targetSection}>
                <Text style={[styles.targetLabel, { color: colors.text.light }]}>
                  Månadsmål: {new Intl.NumberFormat('sv-SE').format(MONTHLY_TARGET)} kr
                </Text>
                <View style={styles.progressContainer}>
                  <ProgressBar
                    progress={(teamRanking.totalAmount / MONTHLY_TARGET) * 100}
                    height={8}
                    backgroundColor={colors.neutral[700]}
                    progressColor={colors.accent.yellow}
                  />
                  <Text style={[styles.progressText, { color: colors.text.light }]}>
                    {Math.round((teamRanking.totalAmount / MONTHLY_TARGET) * 100)}% av målet
                  </Text>
                </View>
              </View>
            </Card>
            
            <Card style={styles.statsCard}>
              <Text style={[styles.statsTitle, { color: colors.text.main }]}>
                Prestationsmått
              </Text>
              
              <View style={styles.statsGrid}>
                <View style={[styles.statItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
                  <TrendingUp size={20} color={colors.accent.yellow} />
                  <Text style={[styles.statValue, { color: colors.text.main }]}>
                    {teamRanking.growth > 0 ? '+' : ''}{teamRanking.growth}%
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text.light }]}>
                    Tillväxt
                  </Text>
                </View>
                
                <View style={[styles.statItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
                  <Users size={20} color={colors.accent.yellow} />
                  <Text style={[styles.statValue, { color: colors.text.main }]}>
                    {teamRanking.teamMembers}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text.light }]}>
                    Medlemmar
                  </Text>
                </View>
                
                <View style={[styles.statItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
                  <Award size={20} color={colors.accent.yellow} />
                  <Text style={[styles.statValue, { color: colors.text.main }]}>
                    {teamRanking.competitions}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text.light }]}>
                    Tävlingar
                  </Text>
                </View>
              </View>
            </Card>
            
            <Card style={styles.trendsCard}>
              <Text style={[styles.trendsTitle, { color: colors.text.main }]}>
                Försäljningstrender
              </Text>
              
              <View style={styles.chartPlaceholder}>
                <Text style={[styles.chartText, { color: colors.text.light }]}>
                  Försäljningsdiagram kommer att visas här
                </Text>
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  noTeamContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  noTeamText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: 8,
  },
  rankingCard: {
    padding: 16,
  },
  rankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankingTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  rankBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rankText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  totalSales: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  targetSection: {
    gap: 8,
  },
  targetLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  progressContainer: {
    gap: 4,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'right',
  },
  statsCard: {
    padding: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  trendsCard: {
    padding: 16,
  },
  trendsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
  },
  chartText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});