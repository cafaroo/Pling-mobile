import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useSubscription } from './SubscriptionProvider';
import { useStripeSubscription } from '../../hooks/useStripeSubscription';
import { PaymentMethod } from '../../domain/subscription/services/StripeIntegrationService';
import { SubscriptionPlan } from '../../domain/subscription/entities/SubscriptionPlan';

interface SubscriptionPaymentFormProps {
  organizationId: string;
  selectedPlanId: string;
  selectedPlan: SubscriptionPlan;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const SubscriptionPaymentForm: React.FC<SubscriptionPaymentFormProps> = ({
  organizationId,
  selectedPlanId,
  selectedPlan,
  onSuccess,
  onCancel,
}) => {
  const { subscriptionStatus, refreshSubscriptionData } = useSubscription();
  const { 
    loading, 
    error, 
    clearError,
    createSubscription, 
    updateSubscription,
    getPaymentMethods,
  } = useStripeSubscription();

  // Form state
  const [billingEmail, setBillingEmail] = useState('');
  const [billingName, setBillingName] = useState('');
  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    postalCode: '',
    country: 'SE', // Default to Sweden
  });
  const [vatNumber, setVatNumber] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  // Om det finns en befintlig prenumeration, ladda eventuella betalningsmetoder
  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (subscriptionStatus?.status && subscriptionStatus.status !== 'canceled') {
        try {
          setLoadingPaymentMethods(true);
          // Detta skulle använda rätt customer ID från den faktiska prenumerationen
          // men i denna simulering använder vi ett dummy-värde
          const methods = await getPaymentMethods('cus_dummy');
          setPaymentMethods(methods);
          if (methods.length > 0) {
            setSelectedPaymentMethod(methods[0].id);
          }
        } catch (error) {
          console.error('Fel vid hämtning av betalningsmetoder:', error);
        } finally {
          setLoadingPaymentMethods(false);
        }
      }
    };

    loadPaymentMethods();
  }, [subscriptionStatus, getPaymentMethods]);

  const handleSubmit = async () => {
    if (!billingEmail || !billingName || !address.line1 || !address.city || !address.postalCode) {
      Alert.alert('Ofullständig information', 'Vänligen fyll i alla obligatoriska fält.');
      return;
    }

    try {
      // Om det redan finns en prenumeration, uppdatera den
      if (subscriptionStatus?.status && subscriptionStatus.status !== 'canceled') {
        // Här skulle du använda det riktiga subscription ID:t
        await updateSubscription('sub_dummy', {
          planId: selectedPlanId,
          paymentMethodId: selectedPaymentMethod,
          billing: {
            email: billingEmail,
            name: billingName,
            address,
            vatNumber,
          },
        });
      } else {
        // Annars skapa en ny prenumeration
        await createSubscription(
          organizationId,
          selectedPlanId,
          selectedPaymentMethod || 'pm_dummy', // I en riktig app skulle detta vara ett giltigt payment method ID
          {
            email: billingEmail,
            name: billingName,
            address,
            vatNumber,
          }
        );
      }

      // Uppdatera prenumerationsdata efter framgångsrik ändring
      await refreshSubscriptionData();
      
      // Anropa success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Fel vid prenumerationsbetalning:', error);
      Alert.alert('Betalningsfel', 'Det uppstod ett fel vid betalningen. Vänligen försök igen.');
    }
  };

  // Visa laddningsindikator om vi håller på att skapa/uppdatera prenumerationen
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5C6BC0" />
        <Text style={styles.loadingText}>Behandlar betalning...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Betalningsinformation</Text>
      
      {/* Visa felmeddelande om det finns */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.errorDismiss}>Stäng</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Prenumerationsdetaljer */}
      <View style={styles.planContainer}>
        <Text style={styles.planTitle}>{selectedPlan.displayName}</Text>
        <Text style={styles.planPrice}>
          {selectedPlan.price.monthly} {selectedPlan.price.currency}/månad
        </Text>
        <Text style={styles.planDescription}>{selectedPlan.description}</Text>
      </View>
      
      {/* Befintliga betalningsmetoder */}
      {paymentMethods.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Betalningsmetoder</Text>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentMethodItem,
                selectedPaymentMethod === method.id && styles.selectedPaymentMethod,
              ]}
              onPress={() => setSelectedPaymentMethod(method.id)}
            >
              <Text style={styles.paymentMethodText}>
                {method.card?.brand.toUpperCase()} •••• {method.card?.last4}
              </Text>
              <Text style={styles.paymentMethodExpiry}>
                Giltigt till {method.card?.expMonth}/{method.card?.expYear}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* Faktureringsinformation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Faktureringsinformation</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>E-post *</Text>
          <TextInput
            style={styles.input}
            value={billingEmail}
            onChangeText={setBillingEmail}
            placeholder="Din e-postadress"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Namn / Företagsnamn *</Text>
          <TextInput
            style={styles.input}
            value={billingName}
            onChangeText={setBillingName}
            placeholder="Ditt namn eller företagsnamn"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Adress rad 1 *</Text>
          <TextInput
            style={styles.input}
            value={address.line1}
            onChangeText={(text) => setAddress({ ...address, line1: text })}
            placeholder="Gatuadress"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Adress rad 2</Text>
          <TextInput
            style={styles.input}
            value={address.line2}
            onChangeText={(text) => setAddress({ ...address, line2: text })}
            placeholder="Lägenhet, våning, etc."
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Ort *</Text>
          <TextInput
            style={styles.input}
            value={address.city}
            onChangeText={(text) => setAddress({ ...address, city: text })}
            placeholder="Ort"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Postnummer *</Text>
          <TextInput
            style={styles.input}
            value={address.postalCode}
            onChangeText={(text) => setAddress({ ...address, postalCode: text })}
            placeholder="Postnummer"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Land *</Text>
          <TextInput
            style={styles.input}
            value={address.country}
            onChangeText={(text) => setAddress({ ...address, country: text })}
            placeholder="Land"
            defaultValue="SE"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>VAT-nummer (för företag inom EU)</Text>
          <TextInput
            style={styles.input}
            value={vatNumber}
            onChangeText={setVatNumber}
            placeholder="SE1234567890"
          />
        </View>
      </View>
      
      {/* Knappar */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Avbryt</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Slutför betalning</Text>
        </TouchableOpacity>
      </View>
      
      {/* Betalningsinformation */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          * = Obligatoriskt fält
        </Text>
        
        <Text style={styles.termsText}>
          Genom att slutföra betalningen godkänner du våra{' '}
          <Text style={styles.termsLink}>användarvillkor</Text> och{' '}
          <Text style={styles.termsLink}>integritetspolicy</Text>.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333333',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#D32F2F',
    flex: 1,
  },
  errorDismiss: {
    color: '#5C6BC0',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  planContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 16,
    color: '#5C6BC0',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: '#666666',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  paymentMethodItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedPaymentMethod: {
    borderColor: '#5C6BC0',
    backgroundColor: '#EDE7F6',
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  paymentMethodExpiry: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  submitButton: {
    flex: 2,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#5C6BC0',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  infoContainer: {
    marginBottom: 32,
  },
  infoText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  termsLink: {
    color: '#5C6BC0',
    textDecorationLine: 'underline',
  },
}); 