import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Switch,
  Alert,
  Linking,
  ScrollView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useStripeSubscription } from '@/src/hooks/useStripeSubscription';
import { colors } from '@/constants/colors';
import { formatDate } from '@/utils/dateUtils';
import * as WebBrowser from 'expo-web-browser';

interface BillingInfoProps {
  organizationId: string;
  subscriptionId: string;
  onAddPaymentMethod?: () => void;
  onUpgrade?: () => void;
}

interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'draft';
  created: Date;
  dueDate?: Date;
  pdfUrl: string;
}

export const BillingInfo: React.FC<BillingInfoProps> = ({
  organizationId,
  subscriptionId,
  onAddPaymentMethod,
  onUpgrade,
}) => {
  const [activeTab, setActiveTab] = useState<'method' | 'history'>('method');
  const [autoRenew, setAutoRenew] = useState(true);
  
  const {
    subscription,
    loading,
    error,
    invoices,
    getPaymentMethods,
    toggleAutoRenewal,
    getInvoiceLink,
    loadSubscription,
  } = useStripeSubscription(subscriptionId);
  
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<any>(null);
  
  useEffect(() => {
    if (subscription && subscription.payment?.customerId) {
      loadPaymentMethods(subscription.payment.customerId);
    }
  }, [subscription]);
  
  useEffect(() => {
    if (subscription) {
      setAutoRenew(!subscription.cancelAtPeriodEnd);
    }
  }, [subscription]);
  
  const loadPaymentMethods = async (customerId: string) => {
    try {
      const methods = await getPaymentMethods(customerId);
      setPaymentMethods(methods);
      
      // Sätt standardbetalningsmetoden
      if (methods.length > 0) {
        const defaultMethod = methods.find(m => 
          m.id === subscription?.payment?.paymentMethodId
        ) || methods[0];
        setDefaultPaymentMethod(defaultMethod);
      }
    } catch (err) {
      console.error('Fel vid hämtning av betalningsmetoder:', err);
    }
  };
  
  const handleAutoRenewalToggle = async (value: boolean) => {
    if (!subscription) return;
    
    try {
      const updatedSubscription = await toggleAutoRenewal(value);
      
      if (updatedSubscription) {
        setAutoRenew(value);
        
        Alert.alert(
          value ? 'Automatisk förnyelse aktiverad' : 'Automatisk förnyelse inaktiverad',
          value 
            ? 'Din prenumeration kommer att förnyas automatiskt i slutet av faktureringsperioden.' 
            : 'Din prenumeration kommer att avslutas i slutet av faktureringsperioden.',
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.error('Fel vid ändring av automatisk förnyelse:', err);
      // Återställ till tidigare värde
      setAutoRenew(!value);
      
      Alert.alert(
        'Fel',
        'Det gick inte att ändra inställningen för automatisk förnyelse. Försök igen senare.',
        [{ text: 'OK' }]
      );
    }
  };
  
  const openInvoice = async (invoiceId: string) => {
    try {
      const { url } = await getInvoiceLink(invoiceId);
      
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        const supported = await Linking.canOpenURL(url);
        
        if (supported) {
          await WebBrowser.openBrowserAsync(url);
        } else {
          Alert.alert('Fel', 'Kunde inte öppna fakturavisningen');
        }
      }
    } catch (err) {
      Alert.alert('Fel', 'Kunde inte öppna fakturan');
    }
  };
  
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('sv-SE', { 
      style: 'currency', 
      currency: currency || 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };
  
  const renderPaymentMethodInfo = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
    }
    
    if (!subscription) {
      return (
        <View style={styles.emptyStateContainer}>
          <Feather name="credit-card" size={48} color={colors.border} />
          <Text style={styles.emptyStateText}>Ingen prenumerationsinformation tillgänglig</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.planInfoContainer}>
          <Text style={styles.sectionTitle}>Plandetaljer</Text>
          <View style={styles.planDetails}>
            <View style={styles.planDetailRow}>
              <Text style={styles.planDetailLabel}>Nuvarande plan:</Text>
              <Text style={styles.planDetailValue}>{subscription.planName || 'Standard'}</Text>
            </View>
            <View style={styles.planDetailRow}>
              <Text style={styles.planDetailLabel}>Faktureringsperiod:</Text>
              <Text style={styles.planDetailValue}>
                {formatDate(subscription.currentPeriodStart.toString())} - {formatDate(subscription.currentPeriodEnd.toString())}
              </Text>
            </View>
            <View style={styles.planDetailRow}>
              <Text style={styles.planDetailLabel}>Status:</Text>
              <View style={styles.statusContainer}>
                <View style={[styles.statusIndicator, 
                  { backgroundColor: subscription.status === 'active' ? colors.success : colors.warning }
                ]} />
                <Text style={styles.planDetailValue}>
                  {subscription.status === 'active' ? 'Aktiv' : 
                   subscription.status === 'past_due' ? 'Förfallen betalning' : 
                   subscription.status === 'canceled' ? 'Avslutad' : 'Ofullständig'}
                </Text>
              </View>
            </View>
          </View>
          
          {subscription.status === 'active' && (
            <View style={styles.autoRenewContainer}>
              <Text style={styles.autoRenewLabel}>Automatisk förnyelse</Text>
              <Switch
                value={autoRenew}
                onValueChange={handleAutoRenewalToggle}
                trackColor={{ false: '#D1D1D6', true: colors.primary + '80' }}
                thumbColor={autoRenew ? colors.primary : '#F4F3F4'}
              />
            </View>
          )}
          
          {!autoRenew && subscription.status === 'active' && (
            <Text style={styles.cancelNote}>
              Din prenumeration avslutas {formatDate(subscription.currentPeriodEnd.toString())}
            </Text>
          )}
          
          {subscription.status === 'active' && onUpgrade && (
            <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
              <Text style={styles.upgradeButtonText}>Uppgradera din plan</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.paymentMethodsContainer}>
          <Text style={styles.sectionTitle}>Betalningsmetoder</Text>
          
          {paymentMethods.length === 0 ? (
            <View style={styles.emptyPaymentMethodContainer}>
              <Text style={styles.emptyPaymentText}>Inga sparade betalningsmetoder</Text>
              {onAddPaymentMethod && (
                <TouchableOpacity 
                  style={styles.addPaymentButton} 
                  onPress={onAddPaymentMethod}
                >
                  <Feather name="plus" size={18} color="#FFFFFF" />
                  <Text style={styles.addPaymentButtonText}>Lägg till betalningsmetod</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              {paymentMethods.map((method, index) => (
                <View key={method.id} style={styles.paymentMethodCard}>
                  <View style={styles.cardTypeContainer}>
                    <Feather 
                      name={method.type === 'card' ? 'credit-card' : 'hard-drive'} 
                      size={24} 
                      color={colors.primary} 
                    />
                    {method.id === defaultPaymentMethod?.id && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Standard</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.cardDetailsContainer}>
                    {method.type === 'card' && method.card ? (
                      <>
                        <Text style={styles.cardNumber}>
                          {method.card.brand.toUpperCase()} **** {method.card.last4}
                        </Text>
                        <Text style={styles.cardExpiry}>
                          Utgår {method.card.expMonth}/{method.card.expYear}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.cardNumber}>{method.type}</Text>
                    )}
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => onAddPaymentMethod?.()}
                  >
                    <Feather name="edit-2" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>
              ))}
              
              {onAddPaymentMethod && (
                <TouchableOpacity 
                  style={styles.addAnotherMethodButton} 
                  onPress={onAddPaymentMethod}
                >
                  <Feather name="plus" size={16} color={colors.primary} />
                  <Text style={styles.addAnotherMethodText}>Lägg till en betalningsmetod</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    );
  };
  
  const renderBillingHistory = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
    }
    
    if (!invoices || invoices.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Feather name="file-text" size={48} color={colors.border} />
          <Text style={styles.emptyStateText}>Ingen faktureringshistorik tillgänglig</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.tabContent}>
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.invoiceItem}
              onPress={() => openInvoice(item.id)}
            >
              <View style={styles.invoiceDetails}>
                <Text style={styles.invoiceNumber}>Faktura #{item.number}</Text>
                <Text style={styles.invoiceDate}>{formatDate(item.created)}</Text>
                <View style={styles.invoiceStatusContainer}>
                  <View 
                    style={[
                      styles.invoiceStatusIndicator, 
                      { backgroundColor: item.status === 'paid' ? colors.success : 
                                         item.status === 'open' ? colors.warning :
                                         colors.error }
                    ]} 
                  />
                  <Text style={styles.invoiceStatus}>
                    {item.status === 'paid' ? 'Betald' : 
                     item.status === 'open' ? 'Obetald' : 
                     item.status === 'void' ? 'Makulerad' : 
                     'Förfallen'}
                  </Text>
                </View>
              </View>
              <View style={styles.invoiceAmount}>
                <Text style={styles.invoiceAmountText}>
                  {formatCurrency(item.amount_due, item.currency)}
                </Text>
                <Feather name="chevron-right" size={20} color={colors.text} />
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.invoicesList}
        />
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'method' && styles.activeTab]}
          onPress={() => setActiveTab('method')}
        >
          <Text style={[styles.tabText, activeTab === 'method' && styles.activeTabText]}>
            Betalningsmetod
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Fakturahistorik
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {activeTab === 'method' ? renderPaymentMethodInfo() : renderBillingHistory()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: '#666666',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  loader: {
    marginTop: 40,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  planInfoContainer: {
    marginBottom: 24,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  planDetails: {
    marginBottom: 16,
  },
  planDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planDetailLabel: {
    fontSize: 15,
    color: '#666666',
  },
  planDetailValue: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  autoRenewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  autoRenewLabel: {
    fontSize: 15,
    color: '#333333',
  },
  cancelNote: {
    fontSize: 13,
    color: colors.warning,
    marginTop: 8,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  paymentMethodsContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
  },
  emptyPaymentMethodContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyPaymentText: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 16,
  },
  addPaymentButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addPaymentButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 8,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTypeContainer: {
    marginRight: 16,
    alignItems: 'center',
  },
  defaultBadge: {
    backgroundColor: colors.success + '20',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 6,
  },
  defaultBadgeText: {
    fontSize: 10,
    color: colors.success,
    fontWeight: 'bold',
  },
  cardDetailsContainer: {
    flex: 1,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  cardExpiry: {
    fontSize: 14,
    color: '#666666',
  },
  editButton: {
    padding: 8,
  },
  addAnotherMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  addAnotherMethodText: {
    fontSize: 15,
    color: colors.primary,
    marginLeft: 8,
  },
  invoicesList: {
    paddingVertical: 8,
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  invoiceDetails: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  invoiceStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invoiceStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  invoiceStatus: {
    fontSize: 14,
    color: '#666666',
  },
  invoiceAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invoiceAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 8,
  },
}); 