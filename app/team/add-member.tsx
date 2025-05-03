import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../services/supabaseClient';
import { useUser } from '../../context/UserContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TeamPermission } from '../../types';
import { Picker } from '@react-native-picker/picker';

export default function AddMemberScreen() {
  const { teamId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUser();
  
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<TeamPermission>('view');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddMember = async () => {
    if (!email) {
      setError('Vänligen ange en e-postadress');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: userToAdd, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (userError || !userToAdd) {
        setError('Kunde inte hitta användaren med den angivna e-postadressen');
        return;
      }

      const { error: memberError } = await supabase
        .from('team_members_new')
        .insert([
          {
            team_id: teamId,
            user_id: userToAdd.id,
            role: selectedRole
          }
        ]);

      if (memberError) {
        if (memberError.code === '23505') {
          setError('Användaren är redan medlem i teamet');
        } else {
          setError('Ett fel uppstod när medlemmen skulle läggas till');
        }
        return;
      }

      router.back();
    } catch (err) {
      setError('Ett oväntat fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: TeamPermission): string => {
    switch (role) {
      case 'view':
        return 'Endast visning';
      case 'chat':
        return 'Chattmedlem';
      case 'manage_members':
        return 'Medlemsadmin';
      case 'manage_team':
        return 'Teamadmin';
      default:
        return role;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lägg till teammedlem</Text>
      
      <View style={styles.form}>
        <Text style={styles.label}>E-postadress</Text>
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="Ange e-postadress"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Roll</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedRole}
            onValueChange={(value) => setSelectedRole(value as TeamPermission)}
            style={styles.picker}
          >
            <Picker.Item label="Endast visning" value="view" />
            <Picker.Item label="Chattmedlem" value="chat" />
            <Picker.Item label="Medlemsadmin" value="manage_members" />
            <Picker.Item label="Teamadmin" value="manage_team" />
          </Picker>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.buttonContainer}>
          <Button
            title="Avbryt"
            onPress={() => router.back()}
            variant="secondary"
            style={styles.button}
          />
          <Button
            title="Lägg till"
            onPress={handleAddMember}
            loading={loading}
            style={styles.button}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  error: {
    color: '#EF4444',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
  },
}); 