import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { updateTeam, getTeam } from '../../services/teamService';
import { Team } from '../../types/team';
import useImageUpload from '../../hooks/useImageUpload';
import TeamAvatar from './TeamAvatar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import ErrorBoundary from '../../components/ErrorBoundary';
import LottieView from 'lottie-react-native';
import ProgressBar from '../ProgressBar';

type TeamSettingsProps = {
  teamId: string;
  initialData?: Team;
  onSuccess?: () => void;
};

type FormData = {
  name: string;
  description: string;
};

const TeamSettings: React.FC<TeamSettingsProps> = ({ teamId, initialData, onSuccess }) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [team, setTeam] = useState<Team | null>(initialData || null);
  const { uploadImage, uploading, uploadProgress } = useImageUpload('team-avatars');
  
  const { control, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
    }
  });

  const updateTeamMutation = useMutation({
    mutationFn: (data: { teamId: string, updates: Partial<Team> }) => 
      updateTeam(data.teamId, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      Toast.show({
        type: 'success',
        text1: 'Inställningar sparade',
        text2: 'Teamets inställningar har uppdaterats framgångsrikt',
        position: 'bottom',
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      setError(error.message || 'Ett fel inträffade vid uppdatering av teamet');
      Toast.show({
        type: 'error',
        text1: 'Kunde inte spara inställningar',
        text2: error.message || 'Försök igen senare',
        position: 'bottom',
      });
    }
  });

  useEffect(() => {
    if (!initialData) {
      fetchTeamData();
    }
  }, [teamId, initialData]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTeam(teamId);
      if (response.success && response.data) {
        setTeam(response.data);
        setValue('name', response.data.name || '');
        setValue('description', response.data.description || '');
      } else {
        setError(response.error?.message || 'Kunde inte hämta teaminformation');
      }
    } catch (err: any) {
      setError(err.message || 'Ett fel inträffade vid hämtning av teaminformation');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    updateTeamMutation.mutate({
      teamId,
      updates: {
        name: data.name,
        description: data.description,
      }
    });
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        const fileInfo = await uploadImage(imageUri, `team_${teamId}`);
        
        if (fileInfo) {
          updateTeamMutation.mutate({
            teamId,
            updates: {
              profile_image: fileInfo.publicUrl
            }
          });
        }
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Bilduppladdning misslyckades',
        text2: error.message || 'Kunde inte ladda upp bilden',
        position: 'bottom',
      });
    }
  };

  const renderUploadProgress = () => {
    if (!uploading) return null;
    
    return (
      <View style={styles.progressContainer}>
        <ProgressBar 
          progress={uploadProgress} 
          color={theme.colors.primary}
          style={styles.progressBar}
        />
        <Text style={styles.progressText}>
          Laddar upp: {Math.round(uploadProgress * 100)}%
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Laddar teaminställningar...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <LottieView
          source={require('../../assets/animations/error.json')}
          autoPlay
          loop={false}
          style={styles.errorAnimation}
        />
        <Text style={styles.errorTitle}>Något gick fel</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          mode="contained" 
          onPress={fetchTeamData} 
          style={styles.retryButton}
        >
          Försök igen
        </Button>
      </View>
    );
  }

  return (
    <ErrorBoundary fallback={<Text>Ett fel inträffade i TeamSettings</Text>}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.avatarContainer}>
              <TeamAvatar 
                teamId={teamId} 
                imageUrl={team?.profile_image} 
                size={120} 
                onPress={handleImagePick}
                editable
              />
              {renderUploadProgress()}
              <Text style={styles.avatarHelpText}>
                Tryck på bilden för att ändra teamets profilbild
              </Text>
            </View>

            <Controller
              control={control}
              rules={{
                required: 'Teamnamn krävs',
                minLength: {
                  value: 3,
                  message: 'Teamnamnet måste vara minst 3 tecken'
                }
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Teamnamn"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  style={styles.input}
                  error={!!errors.name}
                  mode="outlined"
                  disabled={updateTeamMutation.isPending}
                />
              )}
              name="name"
            />
            {errors.name && (
              <Text style={styles.errorText}>{errors.name.message}</Text>
            )}

            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Beskrivning"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  style={styles.input}
                  multiline
                  numberOfLines={4}
                  mode="outlined"
                  disabled={updateTeamMutation.isPending}
                />
              )}
              name="description"
            />

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                style={styles.button}
                loading={updateTeamMutation.isPending}
                disabled={updateTeamMutation.isPending || uploading}
              >
                Spara ändringar
              </Button>
            </View>
            
            {updateTeamMutation.isError && (
              <Text style={styles.errorText}>
                {updateTeamMutation.error?.message || 'Ett fel inträffade vid uppdatering'}
              </Text>
            )}
            
            {updateTeamMutation.isSuccess && (
              <Text style={styles.successText}>
                Inställningarna har sparats!
              </Text>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  container: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorAnimation: {
    width: 150,
    height: 150,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarHelpText: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    marginTop: 16,
  },
  progressContainer: {
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
  },
  successText: {
    color: 'green',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default TeamSettings; 