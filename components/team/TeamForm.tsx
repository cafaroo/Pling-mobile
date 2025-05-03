import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import TextInput from '@/components/ui/TextInput';
import Button from '@/components/ui/Button';

interface TeamFormProps {
  initialValues?: {
    name: string;
  };
  onSubmit: (name: string) => void;
  submitLabel: string;
}

export default function TeamForm({ initialValues, onSubmit, submitLabel }: TeamFormProps) {
  const { colors } = useTheme();
  const [name, setName] = useState(initialValues?.name || '');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Ange ett teamnamn');
      return;
    }
    onSubmit(name.trim());
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Teamnamn"
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError('');
        }}
        placeholder="Ange teamets namn"
        error={error}
        autoFocus
      />
      
      <Button
        title={submitLabel}
        onPress={handleSubmit}
        variant="primary"
        size="large"
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  button: {
    marginTop: 8,
  },
}); 