import { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Building2, Plus, Users, CreditCard, BarChart } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { createOrganization } from '@/services/teamService';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function CreateOrganizationScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateOrganization = async () => {
    if (!name.trim()) {
      setError('Please enter an organization name');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const organizationId = await createOrganization(name.trim());
      if (organizationId) {
        router.replace(`/organizations/${organizationId}`);
      } else {
        setError('Failed to create organization');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      setError('Failed to create organization');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.dark]}
        style={styles.background}
      />
      <Header 
        title="Create Organization" 
        icon={Building2} 
        onBackPress={() => router.back()}
      />

      <View style={styles.container}>
        <Card style={styles.card}>
          <Text style={[styles.title, { color: colors.text.main }]}>
            Create a New Organization
          </Text>
          <Text style={[styles.description, { color: colors.text.light }]}>
            Organizations allow you to manage multiple teams and subscriptions in one place
          </Text>

          {error && (
            <View style={[styles.errorContainer, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text.main }]}>
              Organization Name
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: colors.neutral[500],
                  color: colors.text.main,
                  backgroundColor: 'rgba(0, 0, 0, 0.2)'
                }
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Enter organization name"
              placeholderTextColor={colors.neutral[400]}
            />
          </View>

          <View style={styles.benefits}>
            <Text style={[styles.benefitsTitle, { color: colors.text.main }]}>
              Benefits of Organizations
            </Text>
            <View style={styles.benefitItem}>
              <View style={[styles.benefitIcon, { backgroundColor: colors.primary.light }]}>
                <Users size={16} color={colors.accent.yellow} />
              </View>
              <Text style={[styles.benefitText, { color: colors.text.light }]}>
                Manage multiple teams under one account
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={[styles.benefitIcon, { backgroundColor: colors.primary.light }]}>
                <CreditCard size={16} color={colors.accent.yellow} />
              </View>
              <Text style={[styles.benefitText, { color: colors.text.light }]}>
                Centralized billing and subscription management
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={[styles.benefitIcon, { backgroundColor: colors.primary.light }]}>
                <BarChart size={16} color={colors.accent.yellow} />
              </View>
              <Text style={[styles.benefitText, { color: colors.text.light }]}>
                Cross-team analytics and reporting
              </Text>
            </View>
          </View>

          <Button
            title="Create Organization"
            icon={Plus}
            onPress={handleCreateOrganization}
            variant="primary"
            size="large"
            style={styles.button}
          />
        </Card>
      </View>
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
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  benefits: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  benefitText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    flex: 1,
  },
  button: {
    width: '100%',
  },
});