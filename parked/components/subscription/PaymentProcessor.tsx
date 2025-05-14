import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useStripeSubscription } from '@/src/hooks/useStripeSubscription';
import { colors } from '@/constants/colors';
import { StripeProvider, CardField, useStripe } from '@stripe/stripe-react-native';
import * as WebBrowser from 'expo-web-browser';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51NiabcBCDEFghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface PaymentProcessorProps {
  organizationId: string;
  selectedPlanId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface BillingDetails {
  email: string;
  name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  vatNumber?: string;
}

export const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  organizationId,
  selectedPlanId,
  onSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState<'billing' | 'payment' | 'processing' | 'confirmation'>('billing');
  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    email: '',
    name: '',
    address: {
      line1: '',
      city: '',
      postalCode: '',
      country: 'SE',
    },
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [cardComplete, setCardComplete] = useState(false);
  const [setupIntentClientSecret, setSetupIntentClientSecret] = useState<string | null>(null);
  
  const { 
    loading, 
    error, 
    createSubscription, 
    clearError,
    subscription
  } = useStripeSubscription();
  
  // För webb-plattform
  const [webCardToken, setWebCardToken] = useState('');
  
  // Endast för React Native-miljö
  const { confirmPayment, createPaymentMethod, handleCardAction, initPaymentSheet, presentPaymentSheet } = useStripe?.() || {};

  useEffect(() => {
    if (error) {
      Alert.alert('Betalningsfel', error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [error, clearError]);
  
  useEffect(() => {
    if (subscription) {
      setStep('confirmation');
    }
  }, [subscription]);

  const validateBillingDetails = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!billingDetails.email) {
      errors.email = 'E-post krävs';
    } else if (!/^\S+@\S+\.\S+$/.test(billingDetails.email)) {
      errors.email = 'Ogiltig e-postadress';
    }
    
    if (!billingDetails.name) {
      errors.name = 'Namn krävs';
    }
    
    if (!billingDetails.address.line1) {
      errors.line1 = 'Adress krävs';
    }
    
    if (!billingDetails.address.city) {
      errors.city = 'Stad krävs';
    }
    
    if (!billingDetails.address.postalCode) {
      errors.postalCode = 'Postnummer krävs';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBillingNext = () => {
    if (validateBillingDetails()) {
      setStep('payment');
      
      // För React Native: skapa en setup intent för att hantera kortbetalning
      if (Platform.OS !== 'web' && createSetupIntent) {
        initializeStripeSheet();
      }
    }
  };
  
  const initializeStripeSheet = async () => {
    try {
      // Skapa en setup intent på servern och returnera client secret
      const response = await fetch('https://api.pling-app.se/stripe/setup-intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: billingDetails.email,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Kunde inte initiera betalningsformulär');
      }
      
      const { clientSecret } = await response.json();
      setSetupIntentClientSecret(clientSecret);
      
      // Initiera betalningsbladet med client secret
      if (initPaymentSheet) {
        const { error } = await initPaymentSheet({
          paymentIntentClientSecret: clientSecret,
          customerId: organizationId,
          customerEphemeralKeySecret: clientSecret,
          merchantDisplayName: 'Pling AB',
          allowsDelayedPaymentMethods: false,
          defaultBillingDetails: {
            name: billingDetails.name,
            email: billingDetails.email,
            address: {
              country: billingDetails.address.country,
              postalCode: billingDetails.address.postalCode,
              line1: billingDetails.address.line1,
              city: billingDetails.address.city,
            }
          }
        });
        
        if (error) {
          Alert.alert('Fel', error.message);
        }
      }
    } catch (error) {
      let message = 'Kunde inte förbereda betalningen';
      if (error instanceof Error) {
        message = error.message;
      }
      Alert.alert('Fel', message);
    }
  };

  const handlePaymentSubmit = async () => {
    setStep('processing');
    
    try {
      let paymentMethodId = '';
      
      if (Platform.OS === 'web') {
        // Web-specifik betalningshantering
        paymentMethodId = webCardToken;
      } else {
        // För React Native-miljö, presentera betalningsbladet eller använd CardField
        if (presentPaymentSheet && setupIntentClientSecret) {
          const { error, paymentOption } = await presentPaymentSheet();
          
          if (error) {
            throw new Error(error.message);
          }
          
          paymentMethodId = paymentOption?.id || '';
        } else if (createPaymentMethod) {
          // Använd CardField för att skapa en betalningsmetod
          const { error, paymentMethod } = await createPaymentMethod({
            type: 'Card',
            billingDetails,
          });
          
          if (error) {
            throw new Error(error.message);
          }
          
          paymentMethodId = paymentMethod.id;
        }
      }
      
      if (!paymentMethodId) {
        throw new Error('Ingen betalningsmetod tillgänglig');
      }
      
      // Skapa prenumerationen med betalningsmetoden
      await createSubscription(
        organizationId,
        selectedPlanId,
        paymentMethodId,
        billingDetails
      );
      
      // Steget uppdateras automatiskt till 'confirmation' via useEffect när subscription ändras
    } catch (err) {
      let message = 'Betalningen kunde inte genomföras';
      if (err instanceof Error) {
        message = err.message;
      }
      Alert.alert('Betalningsfel', message);
      setStep('payment');
    }
  };
  
  // För webbaserad Stripe-betalning
  const handleWebTokenChange = (token: string) => {
    setWebCardToken(token);
    setCardComplete(!!token);
  };

  // För React Native Stripe kortinmatning
  const handleCardChange = (complete: boolean) => {
    setCardComplete(complete);
  };

  const renderBillingForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>Faktureringsuppgifter</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>E-post</Text>
        <TextInput
          style={[styles.input, validationErrors.email && styles.inputError]}
          value={billingDetails.email}
          onChangeText={(text) => setBillingDetails({...billingDetails, email: text})}
          placeholder="E-postadress"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {validationErrors.email && (
          <Text style={styles.errorText}>{validationErrors.email}</Text>
        )}
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Namn</Text>
        <TextInput
          style={[styles.input, validationErrors.name && styles.inputError]}
          value={billingDetails.name}
          onChangeText={(text) => setBillingDetails({...billingDetails, name: text})}
          placeholder="Fullständigt namn"
        />
        {validationErrors.name && (
          <Text style={styles.errorText}>{validationErrors.name}</Text>
        )}
      </View>
      
      <Text style={styles.sectionTitle}>Adress</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gatuadress</Text>
        <TextInput
          style={[styles.input, validationErrors.line1 && styles.inputError]}
          value={billingDetails.address.line1}
          onChangeText={(text) => setBillingDetails({...billingDetails, address: {...billingDetails.address, line1: text}})}
          placeholder="Gatuadress"
        />
        {validationErrors.line1 && (
          <Text style={styles.errorText}>{validationErrors.line1}</Text>
        )}
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Stad</Text>
        <TextInput
          style={[styles.input, validationErrors.city && styles.inputError]}
          value={billingDetails.address.city}
          onChangeText={(text) => setBillingDetails({...billingDetails, address: {...billingDetails.address, city: text}})}
          placeholder="Stad"
        />
        {validationErrors.city && (
          <Text style={styles.errorText}>{validationErrors.city}</Text>
        )}
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Postnummer</Text>
        <TextInput
          style={[styles.input, validationErrors.postalCode && styles.inputError]}
          value={billingDetails.address.postalCode}
          onChangeText={(text) => setBillingDetails({...billingDetails, address: {...billingDetails.address, postalCode: text}})}
          placeholder="Postnummer"
          keyboardType="number-pad"
        />
        {validationErrors.postalCode && (
          <Text style={styles.errorText}>{validationErrors.postalCode}</Text>
        )}
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Momsregistreringsnummer (frivilligt)</Text>
        <TextInput
          style={styles.input}
          value={billingDetails.vatNumber}
          onChangeText={(text) => setBillingDetails({...billingDetails, vatNumber: text})}
          placeholder="SE000000000000"
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Avbryt</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.nextButton} onPress={handleBillingNext}>
          <Text style={styles.nextButtonText}>Fortsätt</Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPaymentForm = () => (
    <View style={styles.formContainer}>
      <Text style={styles.sectionTitle}>Betalningsuppgifter</Text>
      
      <View style={styles.cardContainer}>
        {Platform.OS === 'web' ? (
          // Web implementation
          <iframe
            id="card-element"
            title="Stripe Card Element"
            src="about:blank"
            style={{ 
              height: 100, 
              width: '100%', 
              border: 'none',
              backgroundColor: '#f9f9f9',
              borderRadius: 8 
            }}
            onLoad={(e) => {
              // Detta skulle i en riktig implementation ladda Stripe-elementet
              // I en mock-version sätter vi bara token direkt
              setTimeout(() => handleWebTokenChange('pm_mock_token_for_demo'), 1000);
            }}
          />
        ) : (
          // React Native implementation
          <CardField
            postalCodeEnabled={false}
            placeholder={{
              number: '4242 4242 4242 4242',
            }}
            cardStyle={{
              backgroundColor: '#FFFFFF',
              textColor: '#000000',
            }}
            style={{
              width: '100%',
              height: 50,
              marginVertical: 10,
            }}
            onCardChange={(cardDetails) => {
              handleCardChange(cardDetails.complete);
            }}
          />
        )}
      </View>
      
      <View style={styles.securityNote}>
        <Feather name="lock" size={16} color="#666666" />
        <Text style={styles.securityText}>Alla betalningar hanteras säkert via Stripe.</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setStep('billing')}
        >
          <Feather name="arrow-left" size={18} color="#333333" />
          <Text style={styles.backButtonText}>Tillbaka</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.paymentButton, !cardComplete && styles.disabledButton]} 
          onPress={handlePaymentSubmit}
          disabled={!cardComplete}
        >
          <Text style={styles.paymentButtonText}>Slutför betalning</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProcessingScreen = () => (
    <View style={styles.processingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.processingText}>Bearbetar din betalning...</Text>
      <Text style={styles.processingSubtext}>Var vänlig vänta, detta kan ta några sekunder.</Text>
    </View>
  );

  const renderConfirmationScreen = () => (
    <View style={styles.confirmationContainer}>
      <View style={styles.successIcon}>
        <Feather name="check-circle" size={64} color={colors.success} />
      </View>
      <Text style={styles.confirmationTitle}>Betalningen lyckades!</Text>
      <Text style={styles.confirmationText}>
        Ditt abonnemang har aktiverats och är nu klart att användas.
      </Text>
      <Text style={styles.confirmationDetails}>
        Du kommer att få ett bekräftelsemail med alla detaljer om din prenumeration.
      </Text>
      
      <TouchableOpacity style={styles.doneButton} onPress={onSuccess}>
        <Text style={styles.doneButtonText}>Fortsätt till din prenumeration</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'billing':
        return renderBillingForm();
      case 'payment':
        return renderPaymentForm();
      case 'processing':
        return renderProcessingScreen();
      case 'confirmation':
        return renderConfirmationScreen();
    }
  };

  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.se.pling-app"
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {renderCurrentStep()}
      </ScrollView>
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 20,
  },
  formContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333333',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666666',
  },
  input: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginRight: 8,
  },
  cardContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
    padding: 10,
    marginBottom: 15,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  securityText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#333333',
    fontSize: 16,
    marginLeft: 8,
  },
  paymentButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  processingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333333',
  },
  processingSubtext: {
    fontSize: 14,
    color: '#666666',
    marginTop: 10,
    textAlign: 'center',
  },
  confirmationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  successIcon: {
    marginBottom: 20,
  },
  confirmationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  confirmationText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 10,
  },
  confirmationDetails: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 30,
  },
  doneButton: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 