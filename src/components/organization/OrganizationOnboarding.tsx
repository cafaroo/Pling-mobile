import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Image,
  Switch
} from 'react-native';
import { useOrganization } from './OrganizationProvider';
import { InviteUserForm } from './InviteUserForm';

interface OrganizationOnboardingProps {
  organizationId: string;
  onComplete: () => void;
  onSkip?: () => void;
}

enum OnboardingStep {
  WELCOME = 0,
  BASIC_SETTINGS = 1,
  INVITE_MEMBERS = 2,
  CREATE_TEAMS = 3,
  FINISH = 4
}

export const OrganizationOnboarding: React.FC<OrganizationOnboardingProps> = ({
  organizationId,
  onComplete,
  onSkip
}) => {
  const { getOrganizationById, updateOrganization, createTeam } = useOrganization();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(OnboardingStep.WELCOME);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Inställningar
  const [orgName, setOrgName] = useState('');
  const [teamCreated, setTeamCreated] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [allowPublicTeams, setAllowPublicTeams] = useState(false);
  const [membersInvited, setMembersInvited] = useState(false);

  // Ladda organisationsdata
  const fetchOrganizationData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const org = await getOrganizationById(organizationId);
      if (org) {
        setOrgName(org.name);
      }
    } catch (err) {
      console.error('Fel vid hämtning av organisationsdata:', err);
      setError('Kunde inte hämta organisationsinformation');
    } finally {
      setLoading(false);
    }
  };

  // Spara grundinställningar
  const saveBasicSettings = async () => {
    if (!orgName.trim()) {
      setError('Organisationsnamn kan inte vara tomt');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await updateOrganization(organizationId, { name: orgName });
      
      if (result.success) {
        nextStep();
      } else {
        setError(result.error || 'Kunde inte uppdatera organisationsinställningar');
      }
    } catch (err) {
      console.error('Fel vid uppdatering av organisation:', err);
      setError('Ett oväntat fel inträffade');
    } finally {
      setLoading(false);
    }
  };

  // Skapa team
  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      setError('Teamnamn kan inte vara tomt');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await createTeam(organizationId, {
        name: teamName.trim(),
        description: teamDescription.trim()
      });
      
      if (result.success) {
        setTeamCreated(true);
        nextStep();
      } else {
        setError(result.error || 'Kunde inte skapa team');
      }
    } catch (err) {
      console.error('Fel vid skapande av team:', err);
      setError('Ett oväntat fel inträffade');
    } finally {
      setLoading(false);
    }
  };

  // Hantera framsteg
  const nextStep = () => {
    setCurrentStep(prevStep => {
      const nextStep = prevStep + 1;
      return nextStep > OnboardingStep.FINISH ? OnboardingStep.FINISH : nextStep;
    });
    setError(null);
  };

  const prevStep = () => {
    setCurrentStep(prevStep => {
      const prevStepVal = prevStep - 1;
      return prevStepVal < OnboardingStep.WELCOME ? OnboardingStep.WELCOME : prevStepVal;
    });
    setError(null);
  };

  // Visa felmeddelande
  const renderError = () => {
    if (!error) return null;
    
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  };

  // Steg 1: Välkomstskärm
  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <Image 
        source={{ 
          uri: 'https://via.placeholder.com/150/0080ff/FFFFFF?text=Pling' 
        }} 
        style={styles.welcomeImage} 
      />
      <Text style={styles.welcomeTitle}>Välkommen till Pling Organisationer!</Text>
      <Text style={styles.welcomeDescription}>
        Låt oss hjälpa dig att konfigurera din organisation. Det tar bara några minuter att komma igång.
      </Text>
      <Text style={styles.welcomeSteps}>
        I denna guide kommer du att:
      </Text>
      <View style={styles.welcomeStepsList}>
        <Text style={styles.welcomeStepItem}>• Konfigurera grundläggande organisationsinställningar</Text>
        <Text style={styles.welcomeStepItem}>• Bjuda in teammedlemmar</Text>
        <Text style={styles.welcomeStepItem}>• Skapa ditt första team</Text>
      </View>

      <View style={styles.buttonContainer}>
        {onSkip && (
          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipButtonText}>Hoppa över</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
          <Text style={styles.nextButtonText}>Kom igång</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Steg 2: Grundinställningar
  const renderBasicSettingsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Grundinställningar</Text>
      <Text style={styles.stepDescription}>
        Låt oss börja med de grundläggande inställningarna för din organisation.
      </Text>

      {renderError()}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Organisationsnamn</Text>
        <TextInput
          style={styles.input}
          value={orgName}
          onChangeText={setOrgName}
          placeholder="Ange organisationsnamn"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Tillåt publika team</Text>
        <View style={styles.switchContainer}>
          <Switch
            value={allowPublicTeams}
            onValueChange={setAllowPublicTeams}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={allowPublicTeams ? "#007AFF" : "#f4f3f4"}
          />
          <Text style={styles.switchLabel}>
            {allowPublicTeams ? 'Aktiverad' : 'Inaktiverad'}
          </Text>
        </View>
        <Text style={styles.helpText}>
          Publika team kan hittas och bli ansökta om av andra användare.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={prevStep}>
          <Text style={styles.backButtonText}>Tillbaka</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.nextButton, loading && styles.disabledButton]} 
          onPress={saveBasicSettings}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.nextButtonText}>Spara och fortsätt</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Steg 3: Bjud in medlemmar
  const renderInviteMembersStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Bjud in teammedlemmar</Text>
      <Text style={styles.stepDescription}>
        Samarbeta med ditt team! Bjud in medlemmar till din organisation.
      </Text>

      <InviteUserForm 
        organizationId={organizationId}
        onSuccess={() => {
          setMembersInvited(true);
          nextStep();
        }}
        onCancel={() => {
          // Tillåt användaren att hoppa över detta steg
          nextStep();
        }}
      />
      
      <View style={styles.skipStepContainer}>
        <TouchableOpacity onPress={nextStep}>
          <Text style={styles.skipStepText}>Hoppa över detta steg</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={prevStep}>
          <Text style={styles.backButtonText}>Tillbaka</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Steg 4: Skapa team
  const renderCreateTeamStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Skapa ditt första team</Text>
      <Text style={styles.stepDescription}>
        Team hjälper dig att organisera arbete och samarbeta effektivt inom din organisation.
      </Text>

      {renderError()}

      <View style={styles.formGroup}>
        <Text style={styles.label}>Teamnamn</Text>
        <TextInput
          style={styles.input}
          value={teamName}
          onChangeText={setTeamName}
          placeholder="Ange teamnamn"
          autoCapitalize="words"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Beskrivning (valfritt)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={teamDescription}
          onChangeText={setTeamDescription}
          placeholder="Beskriv teamets syfte"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={prevStep}>
          <Text style={styles.backButtonText}>Tillbaka</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.nextButton, loading && styles.disabledButton]} 
          onPress={handleCreateTeam}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.nextButtonText}>Skapa team</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.skipStepContainer}>
        <TouchableOpacity onPress={nextStep}>
          <Text style={styles.skipStepText}>Hoppa över detta steg</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Steg 5: Färdig
  const renderFinishStep = () => (
    <View style={styles.stepContainer}>
      <Image 
        source={{ 
          uri: 'https://via.placeholder.com/150/00C851/FFFFFF?text=Success' 
        }} 
        style={styles.welcomeImage} 
      />
      <Text style={styles.finishTitle}>Grattis!</Text>
      <Text style={styles.finishDescription}>
        Din organisation är nu konfigurerad och redo att användas.
      </Text>

      <View style={styles.accomplishmentsList}>
        <Text style={styles.accomplishmentTitle}>Du har:</Text>
        <Text style={styles.accomplishmentItem}>
          ✓ Konfigurerat organisationsinställningar
        </Text>
        {membersInvited && (
          <Text style={styles.accomplishmentItem}>
            ✓ Bjudit in medlemmar till din organisation
          </Text>
        )}
        {teamCreated && (
          <Text style={styles.accomplishmentItem}>
            ✓ Skapat ditt första team
          </Text>
        )}
      </View>

      <Text style={styles.finishHint}>
        Du kan alltid uppdatera inställningar, bjuda in fler medlemmar, 
        och skapa nya team från organisationens administratörspanel.
      </Text>

      <TouchableOpacity 
        style={styles.finishButton} 
        onPress={onComplete}
      >
        <Text style={styles.finishButtonText}>Börja använda din organisation</Text>
      </TouchableOpacity>
    </View>
  );

  // Render relevant step content
  const renderStepContent = () => {
    switch (currentStep) {
      case OnboardingStep.WELCOME:
        return renderWelcomeStep();
      case OnboardingStep.BASIC_SETTINGS:
        return renderBasicSettingsStep();
      case OnboardingStep.INVITE_MEMBERS:
        return renderInviteMembersStep();
      case OnboardingStep.CREATE_TEAMS:
        return renderCreateTeamStep();
      case OnboardingStep.FINISH:
        return renderFinishStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        {Array.from({ length: 5 }).map((_, index) => (
          <View 
            key={`step-${index}`}
            style={[
              styles.progressDot,
              currentStep >= index && styles.activeProgressDot
            ]}
          />
        ))}
      </View>
      
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {renderStepContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E6E6E6',
    marginHorizontal: 6,
  },
  activeProgressDot: {
    backgroundColor: '#007AFF',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  // Welcome step styles
  welcomeImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  welcomeSteps: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  welcomeStepsList: {
    alignSelf: 'flex-start',
    marginBottom: 32,
  },
  welcomeStepItem: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 6,
  },
  // Common step styles
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  // Form styles
  formGroup: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    marginLeft: 8,
    fontSize: 16,
  },
  helpText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 6,
  },
  // Button styles
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginLeft: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  backButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  skipButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  // Error styles
  errorContainer: {
    backgroundColor: '#FFEEEE',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  // Skip step styles
  skipStepContainer: {
    marginTop: 16,
  },
  skipStepText: {
    color: '#007AFF',
    fontSize: 16,
  },
  // Finish step styles
  finishTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#00C851',
  },
  finishDescription: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  accomplishmentsList: {
    alignSelf: 'stretch',
    marginBottom: 24,
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
  },
  accomplishmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  accomplishmentItem: {
    fontSize: 16,
    marginBottom: 8,
  },
  finishHint: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
  },
  finishButton: {
    backgroundColor: '#00C851',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 