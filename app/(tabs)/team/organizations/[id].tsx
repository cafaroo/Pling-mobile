import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Building2, Users, CreditCard, Settings, Plus, ChevronRight } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { getOrganizationTeams } from '@/services/teamService';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function OrganizationDetailsScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [organization, setOrganization] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('teams');

  useEffect(() => {
    loadOrganizationData();
  }, [id]);

  const loadOrganizationData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // In a real app, you would fetch the organization details here
      setOrganization({
        id,
        name: 'Acme Corporation',
        role: 'admin',
        memberCount: 15,
        subscription: {
          tier: 'business',
          status: 'active',
          renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }
      });

      const teamsData = await getOrganizationTeams(id as string);
      setTeams(teamsData.length > 0 ? teamsData : [
        {
          id: '1',
          name: 'Sales Team',
          memberCount: 8,
          ownerName: 'Anna Andersson'
        },
        {
          id: '2',
          name: 'Marketing Team',
          memberCount: 5,
          ownerName: 'Erik Johansson'
        },
        {
          id: '3',
          name: 'Support Team',
          memberCount: 3,
          ownerName: 'Sofia Larsson'
        }
      ]);
    } catch (error) {
      console.error('Error loading organization data:', error);
      setError('Could not load organization data');
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
          title="Organization" 
          icon={Building2} 
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text.light }]}>
            Loading organization...
          </Text>
        </View>
      </Container>
    );
  }

  if (error || !organization) {
    return (
      <Container>
        <LinearGradient
          colors={[colors.background.dark, colors.primary.dark]}
          style={styles.background}
        />
        <Header 
          title="Organization" 
          icon={Building2} 
          onBackPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error || 'Organization not found'}
          </Text>
          <Button
            title="Go Back"
            variant="outline"
            size="medium"
            onPress={() => router.back()}
            style={styles.backButton}
          />
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
        title="Organization" 
        icon={Building2} 
        onBackPress={() => router.back()}
        rightIcon={Settings}
        onRightIconPress={() => router.push(`/organizations/${id}/settings`)}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Card style={styles.orgCard}>
          <Text style={[styles.orgName, { color: colors.text.main }]}>
            {organization.name}
          </Text>
          
          <View style={styles.orgMeta}>
            <View style={styles.metaItem}>
              <Users size={16} color={colors.text.light} />
              <Text style={[styles.metaText, { color: colors.text.light }]}>
                {organization.memberCount} members
              </Text>
            </View>
            
            <View style={styles.metaItem}>
              <CreditCard size={16} color={colors.text.light} />
              <Text style={[styles.metaText, { color: colors.text.light }]}>
                {organization.subscription.tier.charAt(0).toUpperCase() + organization.subscription.tier.slice(1)} Plan
              </Text>
            </View>
          </View>
          
          {organization.role === 'admin' && (
            <View style={styles.adminActions}>
              <Button
                title="Manage Members"
                icon={Users}
                variant="outline"
                size="small"
                onPress={() => router.push(`/organizations/${id}/members`)}
                style={styles.adminButton}
              />
              
              <Button
                title="Subscription"
                icon={CreditCard}
                variant="outline"
                size="small"
                onPress={() => router.push(`/organizations/${id}/subscription`)}
                style={styles.adminButton}
              />
            </View>
          )}
        </Card>
        
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'teams' && { borderBottomColor: colors.accent.yellow, borderBottomWidth: 2 }
            ]}
            onPress={() => setActiveTab('teams')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'teams' ? colors.accent.yellow : colors.text.light }
            ]}>
              Teams
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'analytics' && { borderBottomColor: colors.accent.yellow, borderBottomWidth: 2 }
            ]}
            onPress={() => setActiveTab('analytics')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'analytics' ? colors.accent.yellow : colors.text.light }
            ]}>
              Analytics
            </Text>
          </TouchableOpacity>
        </View>
        
        {activeTab === 'teams' && (
          <View style={styles.teamsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
                Teams
              </Text>
              {organization.role === 'admin' && (
                <Button
                  title="Add Team"
                  icon={Plus}
                  variant="outline"
                  size="small"
                  onPress={() => router.push(`/organizations/${id}/add-team`)}
                />
              )}
            </View>
            
            {teams.map((team: any) => (
              <Card 
                key={team.id}
                style={styles.teamCard}
                onPress={() => router.push(`/teams/${team.id}`)}
              >
                <View style={styles.teamHeader}>
                  <View>
                    <Text style={[styles.teamName, { color: colors.text.main }]}>
                      {team.name}
                    </Text>
                    <Text style={[styles.teamMeta, { color: colors.text.light }]}>
                      {team.memberCount} members • Owner: {team.ownerName}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.text.light} />
                </View>
              </Card>
            ))}
          </View>
        )}
        
        {activeTab === 'analytics' && (
          <Card style={styles.analyticsCard}>
            <Text style={[styles.analyticsTitle, { color: colors.text.main }]}>
              Organization Analytics
            </Text>
            <Text style={[styles.analyticsDescription, { color: colors.text.light }]}>
              Analytics features will be available in the next update
            </Text>
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
    marginBottom: 24,
  },
  backButton: {
    minWidth: 120,
  },
  orgCard: {
    padding: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  orgName: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: 12,
  },
  orgMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  adminActions: {
    flexDirection: 'row',
    gap: 12,
  },
  adminButton: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 16,
  },
  tabText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  teamsContainer: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },
  teamCard: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamName: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 4,
  },
  teamMeta: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  analyticsCard: {
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  analyticsTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginBottom: 12,
  },
  analyticsDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
});