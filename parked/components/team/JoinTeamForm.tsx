import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

interface JoinTeamFormProps {
  onSubmit: (code: string) => void;
  submitLabel?: string;
  error?: string | null;
}

export default function JoinTeamForm({ 
  onSubmit, 
  submitLabel = 'Gå med', 
  error 
}: JoinTeamFormProps) {
  const { colors } = useTheme();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Validera inbjudningskoden
    if (!code.trim()) {
      setValidationError('Ange en inbjudningskod');
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(code.trim());
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Ett fel uppstod');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Inbjudningskod"
        value={code}
        onChangeText={setCode}
        placeholder="Ange inbjudningskod"
        error={validationError || error}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.input}
      />

      {(validationError || error) && (
        <Text 
          style={[styles.errorText, { color: colors.error }]}
        >
          {validationError || error}
        </Text>
      )}

      <Button
        title={submitLabel}
        onPress={handleSubmit}
        variant="primary"
        size="large"
        loading={isSubmitting}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    minWidth: 200,
    alignSelf: 'center',
  },
}); 