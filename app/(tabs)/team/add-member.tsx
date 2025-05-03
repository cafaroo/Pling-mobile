import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { TeamPermission } from '../../../types';
import { useRouter } from 'expo-router';
import { supabase } from '../../../services/supabaseClient';
import Container from '../../../components/ui/Container';
import Header from '../../../components/ui/Header';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { UserPlus, Shield, UserCog, MessageSquare, User } from 'lucide-react-native';

export default function AddMemberScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<TeamPermission>('member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email) {
      setError('Vänligen ange en e-postadress');
      return;
    }

    if (!email.includes('@')) {
      setError('Vänligen ange en giltig e-postadress');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Kontrollera om användaren redan finns i teamet
      const { data: existingMember, error: checkError } = await supabase
        .from('team_members_new')
        .select('id')
        .eq('team_id', router.params?.teamId)
        .eq('email', email)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingMember) {
        setError('Användaren är redan medlem i teamet');
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from('team_members_new')
        .insert([
          {
            team_id: router.params?.teamId,
            email: email.toLowerCase(),
            role: selectedRole
          }
        ])
        .select()
        .single();

      if (supabaseError) {
        if (supabaseError.code === '23505') {
          setError('Användaren är redan medlem i teamet');
        } else {
          throw supabaseError;
        }
        return;
      }
      
      router.back();
    } catch (error) {
      console.error('Error adding member:', error);
      setError('Det gick inte att bjuda in medlemmen. Försök igen.');
    } finally {
      setIsLoading(false);
    }
  };

  const roles: { value: TeamPermission; label: string; icon: any; description: string }[] = [
    { 
      value: 'org_admin',
      label: 'Organisationsadmin',
      icon: Shield,
      description: 'Kan hantera alla aspekter av organisationen'
    },
    { 
      value: 'admin',
      label: 'Teamadmin',
      icon: UserCog,
      description: 'Kan hantera teamet och dess medlemmar'
    },
    { 
      value: 'moderator',
      label: 'Moderator',
      icon: MessageSquare,
      description: 'Kan moderera innehåll och hantera meddelanden'
    },
    { 
      value: 'member',
      label: 'Medlem',
      icon: User,
      description: 'Standardmedlem med grundläggande rättigheter'
    }
  ];

  return (
    <Container>
      <Header 
        title="Lägg till medlem" 
        icon={UserPlus} 
        showBack 
        onBack={() => router.back()} 
      />
      
      <View style={styles.content}>
        <Input
          label="E-postadress"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError(null);
          }}
          placeholder="Ange e-postadress"
          keyboardType="email-address"
          autoCapitalize="none"
          error={error}
        />

        <View style={styles.roleSelector}>
          <Text style={[styles.roleLabel, { color: colors.text.main }]}>
            Roll
          </Text>
          <View style={styles.roleButtons}>
            {roles.map(({ value, label, icon: Icon, description }) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.roleButton,
                  {
                    backgroundColor:
                      selectedRole === value
                        ? colors.accent.yellow
                        : colors.neutral[700]
                  }
                ]}
                onPress={() => setSelectedRole(value)}
              >
                <Icon 
                  size={16} 
                  color={selectedRole === value ? colors.text.main : colors.text.secondary} 
                  style={styles.roleIcon}
                />
                <View style={styles.roleTextContainer}>
                  <Text
                    style={[
                      styles.roleButtonText,
                      { 
                        color: selectedRole === value 
                          ? colors.text.main 
                          : colors.text.secondary 
                      }
                    ]}
                  >
                    {label}
                  </Text>
                  <Text
                    style={[
                      styles.roleDescription,
                      { 
                        color: selectedRole === value 
                          ? colors.text.main 
                          : colors.text.secondary,
                        opacity: 0.8
                      }
                    ]}
                  >
                    {description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          variant="primary"
          onPress={handleSubmit}
          loading={isLoading}
          style={styles.submitButton}
        >
          Lägg till
        </Button>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 20,
  },
  roleSelector: {
    gap: 8,
  },
  roleLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  roleButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  roleIcon: {
    marginRight: 12,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  roleDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  submitButton: {
    marginTop: 20,
  },
}); 