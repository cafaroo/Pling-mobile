import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, useTheme, Checkbox } from 'react-native-paper';
import { Link } from 'expo-router';
import { useAuth } from '@context/AuthContext'; // Korrekta sökvägen

export default function RegisterScreen() {
  const theme = useTheme();
  const [name, setName] = useState(''); // Keep name for potential future use (e.g., updating profile after signup)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  // const [isLoading, setIsLoading] = useState(false); // isLoading from useAuth
  const [error, setError] = useState<string | null>(null);
  const { signUp, isLoading } = useAuth(); // Get signUp and isLoading from useAuth

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte.');
      return;
    }
    if (!agreedToTerms) {
      setError('Du måste godkänna användarvillkoren.');
      return;
    }

    // setIsLoading(true); // Handled by useAuth
    setError(null);
    try {
      // Note: Current signUp in AuthContext only takes email and password.
      // The profile (with name) is created later in handleAuthChange.
      await signUp(email, password);
      // Navigation should be handled automatically by AuthProvider if signup is successful
      // and leads to an authenticated state.
      // Optionally, show a success message here before navigation happens.
      Alert.alert('Registrering lyckades', 'Kontrollera din e-post för att verifiera ditt konto.');
      // router.push('/login'); // Or let AuthProvider handle navigation
    } catch (err: any) {
      setError(err.message || 'Ett oväntat fel inträffade vid registrering.');
      // Alert.alert('Registreringsfel', err.message || 'Ett oväntat fel inträffade.');
    } finally {
      // setIsLoading(false); // Handled by useAuth
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={styles.title}>
        Skapa konto
      </Text>

      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      <TextInput
        label="Namn" // Eller "Användarnamn"
        value={name}
        onChangeText={setName}
        mode="outlined"
        style={styles.input}
        disabled={isLoading}
      />

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

      <TextInput
        label="Lösenord"
        value={password}
        onChangeText={setPassword}
        mode="outlined"
        style={styles.input}
        secureTextEntry
        disabled={isLoading}
      />

      <TextInput
        label="Bekräfta lösenord"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        mode="outlined"
        style={styles.input}
        secureTextEntry
        disabled={isLoading}
      />

      <View style={styles.checkboxContainer}>
        <Checkbox
          status={agreedToTerms ? 'checked' : 'unchecked'}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
          disabled={isLoading}
        />
        <Text style={styles.checkboxLabel}>Jag godkänner användarvillkoren</Text> 
        {/* TODO: Add link to terms and conditions */}
      </View>

      <Button
        mode="contained"
        onPress={handleRegister}
        style={styles.button}
        loading={isLoading}
        disabled={isLoading || !agreedToTerms}
      >
        {isLoading ? 'Registrerar...' : 'Registrera dig'}
      </Button>

      <Link href="/login" asChild> // TODO: Verify path for login
        <Button
          mode="text"
          onPress={() => { /* Navigation handled by Link */ }}
          style={styles.linkButton}
          disabled={isLoading}
        >
          Har du redan ett konto? Logga in
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginLeft: -8, // Align checkbox nicely
  },
  checkboxLabel: {
    marginLeft: 8,
  },
}); 