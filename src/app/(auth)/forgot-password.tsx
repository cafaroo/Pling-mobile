import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { Link } from 'expo-router';
import { useAuth } from '@context/AuthContext'; // Korrekta sökvägen enligt projektets struktur

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  // const [isLoading, setIsLoading] = useState(false); // isLoading from useAuth
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { sendPasswordResetEmail, isLoading } = useAuth(); // Get reset function and isLoading

  const handleResetRequest = async () => {
    // setIsLoading(true); // Handled by useAuth
    setError(null);
    setSuccessMessage(null);
    try {
      await sendPasswordResetEmail(email);
      setSuccessMessage('Ett mejl med instruktioner för återställning har skickats till din e-postadress.');
    } catch (err: any) {
      setError(err.message || 'Kunde inte skicka återställningslänk.');
      // Alert.alert('Fel vid återställning', err.message || 'Ett oväntat fel inträffade.');
    } finally {
      // setIsLoading(false); // Handled by useAuth
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={styles.title}>
        Glömt lösenord
      </Text>
      <Text style={styles.instructions}>
        Ange din e-postadress nedan så skickar vi instruktioner för hur du återställer ditt lösenord.
      </Text>

      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      {successMessage && (
        <Text style={[styles.successText, { color: theme.colors.primary }]}>
          {successMessage}
        </Text>
      )}

      <TextInput
        label="E-postadress"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        disabled={isLoading}
      />

      <Button
        mode="contained"
        onPress={handleResetRequest}
        style={styles.button}
        loading={isLoading}
        disabled={isLoading}
      >
        {isLoading ? 'Skickar...' : 'Skicka återställningslänk'}
      </Button>

      <Link href="/login" asChild> // TODO: Verify path for login
        <Button
          mode="text"
          onPress={() => { /* Navigation handled by Link */ }}
          style={styles.linkButton}
          disabled={isLoading}
        >
          Tillbaka till inloggning
        </Button>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  instructions: {
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
  },
  linkButton: {
    marginTop: 16,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  successText: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
}); 