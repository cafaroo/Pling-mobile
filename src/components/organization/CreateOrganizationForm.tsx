import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useOrganization } from './OrganizationProvider';

interface CreateOrganizationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateOrganizationForm: React.FC<CreateOrganizationFormProps> = ({ 
  onSuccess, 
  onCancel 
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createOrganization } = useOrganization();

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Organisationsnamn kan inte vara tomt');
      return;
    }

    if (name.trim().length < 2) {
      setError('Organisationsnamn måste vara minst 2 tecken');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await createOrganization(name.trim());
      
      if (result.success) {
        if (onSuccess) onSuccess();
      } else {
        setError(result.error || 'Något gick fel');
      }
    } catch (err) {
      setError('Något gick fel vid skapande av organisation');
      console.error('Fel vid skapande av organisation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Skapa ny organisation</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Organisationsnamn</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ange organisationsnamn"
          autoFocus
          maxLength={50}
          editable={!isSubmitting}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
      
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
            <Text style={styles.submitButtonText}>Skapa</Text>
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
    marginBottom: 20,
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
  errorText: {
    color: 'red',
    marginTop: 8,
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