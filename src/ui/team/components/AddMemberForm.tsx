import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { ProgressInfo } from '@/application/shared/hooks/useStandardizedHook';
import { ProgressBar } from '@/ui/shared/components/ProgressBar';

interface AddMemberFormProps {
  /** Callback när formuläret skickas */
  onSubmit: (userId: string, role: string) => void;
  /** Om formuläret håller på att skickas */
  isLoading?: boolean;
  /** Laddningsprogressinformation */
  progress?: ProgressInfo | null;
}

/**
 * Formulär för att lägga till en teammedlem
 */
export const AddMemberForm = ({ onSubmit, isLoading, progress }: AddMemberFormProps) => {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState<string | null>(null);
  
  const roles = [
    { id: 'member', label: 'Medlem' },
    { id: 'admin', label: 'Admin' }
  ];
  
  const handleSubmit = () => {
    // Validering
    if (!userId.trim()) {
      setError('Användare-ID är obligatoriskt');
      return;
    }
    
    // Återställ fel
    setError(null);
    
    // Anropa callback
    onSubmit(userId, role);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lägg till ny medlem</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Användare-ID:</Text>
        <TextInput 
          style={styles.input}
          value={userId}
          onChangeText={setUserId}
          placeholder="Ange användar-ID"
          editable={!isLoading}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Roll:</Text>
        <View style={styles.roleContainer}>
          {roles.map((roleItem) => (
            <TouchableOpacity
              key={roleItem.id}
              style={[
                styles.roleButton,
                role === roleItem.id && styles.roleButtonSelected
              ]}
              disabled={isLoading}
              onPress={() => setRole(roleItem.id)}
            >
              <Text 
                style={[
                  styles.roleButtonText,
                  role === roleItem.id && styles.roleButtonTextSelected
                ]}
              >
                {roleItem.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {isLoading && progress && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {progress.message || 'Lägger till medlem...'}
          </Text>
          {progress.percent !== undefined && (
            <ProgressBar 
              progress={progress.percent}
              width={250}
              color="#0066cc"
            />
          )}
        </View>
      )}
      
      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Text style={styles.submitButtonText}>
          {isLoading ? 'Lägger till...' : 'Lägg till medlem'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    fontSize: 16,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 4,
  },
  roleButtonSelected: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  roleButtonText: {
    color: '#333',
  },
  roleButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#f44336',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  progressText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#0066cc',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9e9e9e',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 