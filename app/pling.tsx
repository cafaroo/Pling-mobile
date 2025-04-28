import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Coins, Package, MessageSquare, ArrowLeft, Bell } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { addSale } from '@/services/salesService';
import { playSoundEffect } from '@/utils/sound';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import PlingAnimation from '@/components/animations/PlingAnimation';

export default function PlingScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [product, setProduct] = useState('');
  const [comment, setComment] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePling = async () => {
    if (!amount || parseInt(amount) <= 0) {
      setError('Ange ett giltigt belopp');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Play sound effect
      playSoundEffect('pling');
      
      // Show animation
      setShowAnimation(true);
      
      // Add sale to database
      await addSale({
        userId: user?.id || '',
        amount: parseFloat(amount),
        product: product || undefined,
        comment: comment || undefined,
      });

      // Reset form after successful submission
      setAmount('');
      setProduct('');
      setComment('');
      
      // Hide animation after 2 seconds
      setTimeout(() => {
        setShowAnimation(false);
        // Navigate back
        router.back();
      }, 2000);
    } catch (error) {
      console.error('Error adding sale:', error);
      setError('Kunde inte registrera försäljningen. Försök igen.');
      setShowAnimation(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.main]}
        style={styles.background}
      />
      
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
        >
          <ArrowLeft color={colors.text.light} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.main }]}>
          Registrera försäljning
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        {/* Welcome Card */}
        <View style={[styles.welcomeCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
          <Bell color={colors.accent.yellow} size={32} style={styles.welcomeIcon} />
          <Text style={[styles.welcomeTitle, { color: colors.text.main }]}>
            Dags för en PLING!
          </Text>
          <Text style={[styles.welcomeText, { color: colors.text.light }]}>
            Registrera din försäljning och se den direkt i teamets statistik. 
            Varje PLING räknas mot dina mål och tävlingar!
          </Text>
        </View>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error }]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
          <View style={styles.labelContainer}>
            <Text style={[styles.label, { color: colors.text.main }]}>Belopp (kr)</Text>
            <Text style={[styles.labelHint, { color: colors.text.light }]}>
              Ange försäljningens totala belopp
            </Text>
          </View>

          <View style={styles.amountContainer}>
            <View style={[styles.amountIconContainer, { backgroundColor: colors.accent.yellow }]}>
              <Coins color={colors.background.dark} size={24} />
            </View>
            <TextInput
              style={[
                styles.amountInput,
                { 
                  color: colors.text.main,
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderColor: colors.neutral[700],
                }
              ]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={colors.neutral[400]}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.labelContainer}>
            <Text style={[styles.label, { color: colors.text.main }]}>Produkt/tjänst</Text>
            <Text style={[styles.labelHint, { color: colors.text.light }]}>
              Valfritt - Specificera vad du sålde
            </Text>
          </View>

          <View style={[
            styles.inputContainer,
            { 
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderColor: colors.neutral[700],
            }
          ]}>
            <Package color={colors.neutral[400]} size={20} />
            <TextInput
              style={[styles.input, { color: colors.text.main }]}
              value={product}
              onChangeText={setProduct}
              placeholder="Produkt eller tjänst..."
              placeholderTextColor={colors.neutral[400]}
            />
          </View>
          
          <View style={styles.labelContainer}>
            <Text style={[styles.label, { color: colors.text.main }]}>Kommentar</Text>
            <Text style={[styles.labelHint, { color: colors.text.light }]}>
              Valfritt - Lägg till extra information
            </Text>
          </View>

          <View style={[
            styles.inputContainer,
            { 
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderColor: colors.neutral[700],
            }
          ]}>
            <MessageSquare color={colors.neutral[400]} size={20} />
            <TextInput
              style={[styles.input, { color: colors.text.main }]}
              value={comment}
              onChangeText={setComment}
              placeholder="Lägg till en kommentar..."
              placeholderTextColor={colors.neutral[400]}
              multiline
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="PLING!"
          icon={Bell}
          onPress={handlePling}
          variant="primary"
          size="large"
          loading={isSubmitting}
          disabled={!amount || parseInt(amount) <= 0 || isSubmitting}
          style={styles.submitButton}
        />
      </View>

      {showAnimation && <PlingAnimation amount={amount} />}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  welcomeIcon: {
    marginBottom: 16,
  },
  welcomeTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 24,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 4,
  },
  labelHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    opacity: 0.8,
  },
  amountContainer: {
  },
  amountContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  amountIconContainer: {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  amountInput: {
    height: 80,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 72,
    paddingRight: 24,
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 24,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    paddingVertical: 8,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  submitButton: {
    width: '100%',
  },
});