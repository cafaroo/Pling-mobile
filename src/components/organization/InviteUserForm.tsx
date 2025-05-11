import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useOrganization } from './OrganizationProvider';

interface InviteUserFormProps {
  organizationId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const InviteUserForm: React.FC<InviteUserFormProps> = ({
  organizationId,
  onSuccess,
  onCancel
}) => {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { inviteUserToOrganization } = useOrganization();
  
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const handleSubmit = async () => {
    // Rensa tidigare fel
    setError(null);
    
    // Validera email
    if (!email.trim()) {
      setError('E-post kan inte vara tomt');
      return;
    }
    
    if (!validateEmail(email.trim())) {
      setError('Vänligen ange en giltig e-postadress');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Använd userId om det finns, annars skicka ett tomt ID
      // Servern kommer att göra en lookup baserat på email
      const result = await inviteUserToOrganization(
        organizationId,
        userId.trim() || email.trim(), // Använd email som userId om inget explicit userId ges
        email.trim()
      );
      
      if (result.success) {
        if (onSuccess) onSuccess();
      } else {
        setError(result.error || 'Kunde inte bjuda in användaren');
      }
    } catch (error) {
      console.error('Fel vid inbjudan av användare:', error);
      setError('Ett oväntat fel inträffade');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bjud in användare</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>E-post</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Ange e-postadress"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSubmitting}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Användar-ID (valfritt)</Text>
        <TextInput
          style={styles.input}
          value={userId}
          onChangeText={setUserId}
          placeholder="Ange användar-ID om känt"
          editable={!isSubmitting}
        />
        <Text style={styles.helperText}>
          Lämna tomt om du bara vill bjuda in via e-post
        </Text>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Avbryt</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Bjud in</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  helperText: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  }
}); 