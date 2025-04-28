import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Building2, Plus, Users, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { getUserOrganizations } from '@/services/teamService';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Organization } from '@/types';

export default function OrganizationsScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const orgs = await getUserOrganizations(user?.id || '');
      setOrganizations(orgs);
    } catch (error) {
      console.error('Error loading organizations:', error);
      setError('Could not load organizations');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOrganizationItem = ({ item }: { item: Organization }) => (
    <TouchableOpacity
      onPress={() => router.push(`/organizations/${item.id}`)}
      activeOpacity={0.8}
    >
      <Card style={styles.orgCard}>
        <View style={styles.orgHeader}>
          <View style={styles.orgInfo}>
            <View style={[styles.orgIconContainer, { backgroundColor: colors.primary.light }]}>
              <Building2 color={colors.accent.yellow} size={24} />
            </View>
            <View>
              <Text style={[styles.orgName, { color: colors.text.main }]}>
                {item.name}
              </Text>
              <Text style={[styles.orgMeta, { color: colors.text.light }]}>
                {item.teamCount} {item.teamCount === 1 ? 'team' : 'teams'} • {item.role === 'admin' ? 'Admin' : 'Member'}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.text.light} />
        </View>
        
        <View style={styles.orgStats}>
          <View style={[styles.statItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
            <Users size={16} color={colors.text.light} />
            <Text style={[styles.statText, { color: colors.text.light }]}>
              12 members
            </Text>
          </View>
          
          <View style={[styles.statItem, { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
            <Text style={[styles.statValue, { color: colors.accent.yellow }]}>
              Pro
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.light }]}>
              Subscription
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.dark]}
        style={styles.background}
      />
      <Header 
        title="Organizations" 
        icon={Building2}
        onBackPress={() => router.push('/team')}
      />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text.light }]}>
            Loading organizations...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
          <Button
            title="Try Again"
            variant="outline"
            size="small"
            onPress={loadOrganizations}
            style={styles.retryButton}
          />
        </View>
      ) : organizations.length > 0 ? (
        <FlatList
          data={organizations}
          renderItem={renderOrganizationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={[styles.headerText, { color: colors.text.main }]}>
                Your Organizations
              </Text>
              <Text style={[styles.headerDescription, { color: colors.text.light }]}>
                Manage multiple teams and subscriptions
              </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary.light }]}>
            <Building2 size={48} color={colors.accent.yellow} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text.main }]}>
            No Organizations Yet
          </Text>
          <Text style={[styles.emptyDescription, { color: colors.text.light }]}>
            Create an organization to manage multiple teams and subscriptions in one place
          </Text>
          <Button
            title="Create Organization"
            icon={Plus}
            onPress={() => router.push('/organizations/create')}
            variant="primary"
            size="large"
            style={styles.createButton}
          />
        </View>
      )}
      
      {organizations.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.accent.yellow }]}
          onPress={() => router.push('/organizations/create')}
          activeOpacity={0.8}
        >
          <Plus color={colors.background.dark} size={24} />
        </TouchableOpacity>
      )}
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
    marginBottom: 16,
  },
  retryButton: {
    minWidth: 120,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  listHeader: {
    marginBottom: 24,
  },
  headerText: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: 8,
  },
  headerDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  orgCard: {
    marginBottom: 16,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  orgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orgInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  orgIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgName: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 4,
  },
  orgMeta: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  orgStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  statText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 300,
  },
  createButton: {
    minWidth: 200,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});