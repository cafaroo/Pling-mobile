import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChartBar as BarChart, TrendingUp, Users, Award } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'expo-router';
import { getTeamRanking } from '@/services/teamService';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Tabs from '@/components/ui/Tabs';
import ProgressBar from '@/components/ui/ProgressBar';

export default function TeamAnalyticsScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('performance');
  const [isLoading, setIsLoading] = useState(true);
  const [teamRanking, setTeamRanking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.team?.id) {
      loadTeamData();
    }
  }, [user?.team?.id]);

  const loadTeamData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user?.team?.id) {
        setError('No team found');
        return;
      }

      const ranking = await getTeamRanking(user.team.id);
      setTeamRanking(ranking);
    } catch (error) {
      console.error('Error loading team data:', error);
      setError('Could not load team data');
    } finally {
      setIsLoading(false);
    }
  };

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
            Loading team analytics...
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
            {error || 'Could not load team data'}
          </Text>
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
          { id: 'performance', label: 'Performance' },
          { id: 'members', label: 'Members' },
          { id: 'competitions', label: 'Competitions' },
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
                Total Sales: {new Intl.NumberFormat('sv-SE').format(teamRanking.totalAmount)} kr
              </Text>
              
              <View style={styles.targetSection}>
                <Text style={[styles.targetLabel, { color: colors.text.light }]}>
                  Monthly Target: {new Intl.NumberFormat('sv-SE').format(500000)} kr
                </Text>
                <View style={styles.progressContainer}>
                  <ProgressBar
                    progress={(teamRanking.totalAmount / 500000) * 100}
                    height={8}
                    backgroundColor={colors.neutral[700]}
                    progressColor={colors.accent.yellow}
                  />
                  <Text style={[styles.progressText, { color: colors.text.light }]}>
                    {Math.round((teamRanking.totalAmount / 500000) * 100)}% of target
                  </Text>
                </View>
              </View>
            </Card>
            
            <Card style={styles.statsCard}>
              <Text style={[styles.statsTitle, { color: colors.text.main }]}>
                Performance Metrics
              </Text>
              
              <View style={styles.statsGrid}>
                <View style={[styles.statItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
                  <TrendingUp size={20} color={colors.accent.yellow} />
                  <Text style={[styles.statValue, { color: colors.text.main }]}>
                    +12%
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text.light }]}>
                    Growth
                  </Text>
                </View>
                
                <View style={[styles.statItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
                  <Users size={20} color={colors.accent.yellow} />
                  <Text style={[styles.statValue, { color: colors.text.main }]}>
                    {teamRanking.teamMembers || 5}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text.light }]}>
                    Members
                  </Text>
                </View>
                
                <View style={[styles.statItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
                  <Award size={20} color={colors.accent.yellow} />
                  <Text style={[styles.statValue, { color: colors.text.main }]}>
                    3
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text.light }]}>
                    Competitions
                  </Text>
                </View>
              </View>
            </Card>
            
            <Card style={styles.trendsCard}>
              <Text style={[styles.trendsTitle, { color: colors.text.main }]}>
                Sales Trends
              </Text>
              
              <View style={styles.chartPlaceholder}>
                <Text style={[styles.chartText, { color: colors.text.light }]}>
                  Sales chart visualization will appear here
                </Text>
              </View>
              
              <View style={styles.insightsList}>
                <View style={[styles.insightItem, { borderLeftColor: colors.success }]}>
                  <Text style={[styles.insightText, { color: colors.text.light }]}>
                    Your team's best day is Thursday with an average of 15,200 kr in sales
                  </Text>
                </View>
                
                <View style={[styles.insightItem, { borderLeftColor: colors.accent.yellow }]}>
                  <Text style={[styles.insightText, { color: colors.text.light }]}>
                    Team sales have increased by 23% compared to last month
                  </Text>
                </View>
                
                <View style={[styles.insightItem, { borderLeftColor: colors.accent.pink }]}>
                  <Text style={[styles.insightText, { color: colors.text.light }]}>
                    You're on track to reach your monthly target of 500,000 kr
                  </Text>
                </View>
              </View>
            </Card>
          </>
        )}
        
        {activeTab === 'members' && (
          <Card style={styles.membersCard}>
            <Text style={[styles.membersTitle, { color: colors.text.main }]}>
              Member Performance
            </Text>
            
            <View style={styles.membersList}>
              {[
                { name: 'Anna Andersson', sales: 42500, growth: 15 },
                { name: 'Erik Johansson', sales: 38200, growth: -5 },
                { name: 'Sofia Larsson', sales: 35000, growth: 8 },
                { name: 'Johan Persson', sales: 28700, growth: 12 },
                { name: 'Maria Nilsson', sales: 25600, growth: 3 }
              ].map((member, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.memberRow,
                    index < 4 && { borderBottomColor: colors.neutral[700], borderBottomWidth: 1 }
                  ]}
                >
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.text.main }]}>
                      {member.name}
                    </Text>
                    <Text style={[styles.memberSales, { color: colors.text.light }]}>
                      {new Intl.NumberFormat('sv-SE').format(member.sales)} kr
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.growthBadge, 
                    { 
                      backgroundColor: member.growth >= 0 ? 
                        'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' 
                    }
                  ]}>
                    <Text style={[
                      styles.growthText, 
                      { 
                        color: member.growth >= 0 ? 
                          colors.success : colors.error 
                      }
                    ]}>
                      {member.growth > 0 ? '+' : ''}{member.growth}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}
        
        {activeTab === 'competitions' && (
          <Card style={styles.competitionsCard}>
            <Text style={[styles.competitionsTitle, { color: colors.text.main }]}>
              Team Competitions
            </Text>
            
            <View style={styles.competitionsList}>
              {[
                { 
                  title: 'Summer Challenge', 
                  status: 'active', 
                  progress: 68, 
                  rank: 2,
                  endDate: '2025-08-15'
                },
                { 
                  title: 'Q2 Sales Drive', 
                  status: 'ended', 
                  progress: 100, 
                  rank: 1,
                  endDate: '2025-06-30'
                },
                { 
                  title: 'Customer Satisfaction', 
                  status: 'upcoming', 
                  progress: 0, 
                  rank: null,
                  endDate: '2025-09-30'
                }
              ].map((competition, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.competitionItem,
                    index < 2 && { borderBottomColor: colors.neutral[700], borderBottomWidth: 1 }
                  ]}
                >
                  <View style={styles.competitionHeader}>
                    <Text style={[styles.competitionTitle, { color: colors.text.main }]}>
                      {competition.title}
                    </Text>
                    <View style={[
                      styles.statusBadge, 
                      { 
                        backgroundColor: 
                          competition.status === 'active' ? colors.success :
                          competition.status === 'upcoming' ? colors.primary.light :
                          colors.neutral[500]
                      }
                    ]}>
                      <Text style={styles.statusText}>
                        {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.competitionDetails}>
                    {competition.status !== 'upcoming' && (
                      <>
                        <View style={styles.progressContainer}>
                          <ProgressBar
                            progress={competition.progress}
                            height={6}
                            backgroundColor={colors.neutral[700]}
                            progressColor={colors.accent.yellow}
                          />
                          <Text style={[styles.progressText, { color: colors.text.light }]}>
                            {competition.progress}% complete
                          </Text>
                        </View>
                        
                        {competition.rank && (
                          <View style={[styles.rankBadge, { backgroundColor: colors.accent.yellow }]}>
                            <Text style={[styles.rankText, { color: colors.background.dark }]}>
                              #{competition.rank}
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                    
                    <Text style={[styles.endDate, { color: colors.text.light }]}>
                      {competition.status === 'upcoming' ? 'Starts' : 'Ends'}: {new Date(competition.endDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
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
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  rankingCard: {
    padding: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  rankingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankingTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },
  rankBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  rankText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  totalSales: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    marginBottom: 20,
  },
  targetSection: {
    marginTop: 8,
  },
  targetLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  statsCard: {
    padding: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  statsTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: 100,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginVertical: 8,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  trendsCard: {
    padding: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  trendsTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    borderLeftWidth: 3,
    paddingLeft: 12,
  },
  insightText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  membersCard: {
    padding: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  membersTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  membersList: {
    gap: 16,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 4,
  },
  memberSales: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  growthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  growthText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  competitionsCard: {
    padding: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  competitionsTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  competitionsList: {
    gap: 16,
  },
  competitionItem: {
    paddingVertical: 16,
  },
  competitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  competitionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: 'white',
  },
  competitionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  endDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
});