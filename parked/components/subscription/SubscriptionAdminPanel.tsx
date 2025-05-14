import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { formatDate } from '@/utils/dateUtils';

interface SubscriptionAdminPanelProps {
  organizationId: string;
}

interface SubscriptionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  subscriptionStatus: string;
  lastActive: Date;
}

interface SubscriptionStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  teamMembersUsage: number;
  teamMembersLimit: number;
  mediaStorageUsage: number;
  mediaStorageLimit: number;
}

interface SubscriptionEvent {
  id: string;
  type: 'created' | 'updated' | 'canceled' | 'payment_succeeded' | 'payment_failed';
  date: Date;
  description: string;
  metadata?: Record<string, any>;
}

export const SubscriptionAdminPanel: React.FC<SubscriptionAdminPanelProps> = ({
  organizationId,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'history'>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [users, setUsers] = useState<SubscriptionUser[]>([]);
  const [events, setEvents] = useState<SubscriptionEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Hämta data vid start
  useEffect(() => {
    fetchData();
  }, []);

  // Simulera datahämtning
  const fetchData = async () => {
    setLoading(true);

    // Simulera API-anrop för att hämta statistik
    setTimeout(() => {
      // Mockdata för statistik
      setStats({
        totalUsers: 15,
        activeUsers: 12,
        totalRevenue: 29700,
        monthlyRecurringRevenue: 9900,
        teamMembersUsage: 12,
        teamMembersLimit: 25,
        mediaStorageUsage: 750,
        mediaStorageLimit: 5000,
      });

      // Mockdata för användare
      setUsers([
        {
          id: 'user1',
          name: 'Anna Andersson',
          email: 'anna@example.com',
          role: 'Admin',
          subscriptionStatus: 'active',
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          id: 'user2',
          name: 'Bengt Bengtsson',
          email: 'bengt@example.com',
          role: 'Medlem',
          subscriptionStatus: 'active',
          lastActive: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'user3',
          name: 'Camilla Carlsson',
          email: 'camilla@example.com',
          role: 'Medlem',
          subscriptionStatus: 'active',
          lastActive: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      ]);

      // Mockdata för historik
      setEvents([
        {
          id: 'event1',
          type: 'created',
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          description: 'Prenumeration startad',
        },
        {
          id: 'event2',
          type: 'payment_succeeded',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          description: 'Betalning genomförd',
          metadata: {
            amount: 9900,
            currency: 'SEK',
            invoiceId: 'inv_123456',
          },
        },
        {
          id: 'event3',
          type: 'updated',
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          description: 'Plan uppgraderad från Basic till Pro',
        },
      ]);

      setLoading(false);
    }, 1000);
  };

  // Formatera valuta
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Filtrera användare baserat på sökfråga
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Rendera användarlista
  const renderUserItem = ({ item }: { item: SubscriptionUser }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userDetail}>
          {item.role} · Senast aktiv {formatDate(item.lastActive)}
        </Text>
      </View>
      <View style={styles.userActions}>
        <View
          style={[
            styles.statusBadge,
            item.subscriptionStatus === 'active' && styles.statusActive,
            item.subscriptionStatus === 'inactive' && styles.statusInactive,
          ]}
        >
          <Text style={styles.statusText}>
            {item.subscriptionStatus === 'active' ? 'Aktiv' : 'Inaktiv'}
          </Text>
        </View>
        <TouchableOpacity style={styles.userActionButton}>
          <Feather name="more-vertical" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Rendera händelselogg
  const renderEventItem = ({ item }: { item: SubscriptionEvent }) => (
    <View style={styles.eventItem}>
      <View style={styles.eventIconContainer}>
        <View
          style={[
            styles.eventIcon,
            item.type === 'created' && styles.eventCreated,
            item.type === 'updated' && styles.eventUpdated,
            item.type === 'canceled' && styles.eventCanceled,
            item.type === 'payment_succeeded' && styles.eventPaymentSuccess,
            item.type === 'payment_failed' && styles.eventPaymentFailed,
          ]}
        >
          <Feather
            name={
              item.type === 'created'
                ? 'plus'
                : item.type === 'updated'
                ? 'edit'
                : item.type === 'canceled'
                ? 'x'
                : item.type === 'payment_succeeded'
                ? 'check'
                : 'alert-circle'
            }
            size={16}
            color={colors.white}
          />
        </View>
      </View>
      <View style={styles.eventContent}>
        <Text style={styles.eventDescription}>{item.description}</Text>
        <Text style={styles.eventDate}>{formatDate(item.date)}</Text>
        {item.metadata && (
          <View style={styles.eventMetadata}>
            {Object.entries(item.metadata).map(([key, value]) => (
              <Text key={key} style={styles.metadataText}>
                {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  // Hantera uppdatering av plan manuellt
  const handleUpdatePlan = () => {
    Alert.alert(
      'Uppdatera prenumerationsplan',
      'Vill du verkligen ändra plan för denna organisation?',
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Uppdatera',
          onPress: () => {
            // Simulera planuppdatering
            Alert.alert('Plan uppdaterad', 'Prenumerationsplanen har uppdaterats.');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Laddar prenumerationsdata...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prenumerationsadministration</Text>

      {/* Flikar */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text
            style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}
          >
            Översikt
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text
            style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}
          >
            Användare
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text
            style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}
          >
            Historik
          </Text>
        </TouchableOpacity>
      </View>

      {/* Innehåll baserat på aktiv flik */}
      {activeTab === 'overview' && stats && (
        <ScrollView style={styles.contentContainer}>
          {/* Prenumerationskort */}
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <View>
                <Text style={styles.subscriptionTitle}>Pling Pro</Text>
                <Text style={styles.subscriptionPrice}>{formatCurrency(990)}/månad</Text>
              </View>
              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleUpdatePlan}
              >
                <Text style={styles.updateButtonText}>Ändra plan</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <View style={styles.subscriptionInfo}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Status</Text>
                <View style={styles.statusBadge}>
                  <View style={[styles.statusDot, styles.statusActive]} />
                  <Text style={styles.statusText}>Aktiv</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Nästa faktura</Text>
                <Text style={styles.infoValue}>{formatDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000))}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Faktureringsperiod</Text>
                <Text style={styles.infoValue}>Månadsvis</Text>
              </View>
            </View>
          </View>

          {/* Statistik */}
          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Nyckeltal</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalUsers}</Text>
                <Text style={styles.statLabel}>Totalt antal användare</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.activeUsers}</Text>
                <Text style={styles.statLabel}>Aktiva användare</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatCurrency(stats.totalRevenue)}</Text>
                <Text style={styles.statLabel}>Total intäkt</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatCurrency(stats.monthlyRecurringRevenue)}</Text>
                <Text style={styles.statLabel}>Månatlig intäkt</Text>
              </View>
            </View>
          </View>

          {/* Resursutnyttjande */}
          <View style={styles.resourcesContainer}>
            <Text style={styles.sectionTitle}>Resursutnyttjande</Text>
            
            <View style={styles.resourceItem}>
              <View style={styles.resourceHeader}>
                <Text style={styles.resourceLabel}>Teammedlemmar</Text>
                <Text style={styles.resourceValue}>
                  {stats.teamMembersUsage} av {stats.teamMembersLimit}
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${(stats.teamMembersUsage / stats.teamMembersLimit) * 100}%` },
                    stats.teamMembersUsage / stats.teamMembersLimit > 0.8 && styles.progressWarning,
                  ]} 
                />
              </View>
            </View>
            
            <View style={styles.resourceItem}>
              <View style={styles.resourceHeader}>
                <Text style={styles.resourceLabel}>Medialagring</Text>
                <Text style={styles.resourceValue}>
                  {stats.mediaStorageUsage} MB av {stats.mediaStorageLimit} MB
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${(stats.mediaStorageUsage / stats.mediaStorageLimit) * 100}%` },
                    stats.mediaStorageUsage / stats.mediaStorageLimit > 0.8 && styles.progressWarning,
                  ]} 
                />
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {activeTab === 'users' && (
        <View style={styles.contentContainer}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Sök användare..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            contentContainerStyle={styles.userList}
            ListEmptyComponent={
              <Text style={styles.emptyStateText}>
                Inga användare hittades
              </Text>
            }
          />
        </View>
      )}

      {activeTab === 'history' && (
        <View style={styles.contentContainer}>
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            renderItem={renderEventItem}
            contentContainerStyle={styles.eventList}
            ListEmptyComponent={
              <Text style={styles.emptyStateText}>
                Ingen historik tillgänglig
              </Text>
            }
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    margin: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  subscriptionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  subscriptionPrice: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  updateButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  updateButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  subscriptionInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.success,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusActive: {
    backgroundColor: colors.success,
  },
  statusInactive: {
    backgroundColor: colors.textSecondary,
  },
  statsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resourcesContainer: {
    marginBottom: 24,
  },
  resourceItem: {
    marginBottom: 16,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resourceLabel: {
    fontSize: 16,
    color: colors.text,
  },
  resourceValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressWarning: {
    backgroundColor: colors.warning,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: colors.text,
  },
  userList: {
    paddingBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  userDetail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userActionButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 32,
  },
  eventList: {
    paddingBottom: 16,
  },
  eventItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  eventIconContainer: {
    marginRight: 16,
    alignItems: 'center',
  },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventCreated: {
    backgroundColor: colors.success,
  },
  eventUpdated: {
    backgroundColor: colors.primary,
  },
  eventCanceled: {
    backgroundColor: colors.danger,
  },
  eventPaymentSuccess: {
    backgroundColor: colors.success,
  },
  eventPaymentFailed: {
    backgroundColor: colors.danger,
  },
  eventContent: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  eventMetadata: {
    backgroundColor: colors.lightGray,
    padding: 8,
    borderRadius: 8,
  },
  metadataText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
}); 