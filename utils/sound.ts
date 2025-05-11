import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { supabase } from '@services/supabaseClient';

// Define the sound types
type SoundType = 'pling' | 'success' | 'levelUp';

// Map sound types to their file paths
const soundPaths: Record<SoundType, string> = {
  pling: 'sounds/pling.mp3',
  success: 'sounds/success.mp3',
  levelUp: 'sounds/level-up.mp3',
};

// Store loaded sounds
let sounds: Record<SoundType, Audio.Sound | null> = {
  pling: null,
  success: null,
  levelUp: null,
};

// Load a sound file
const loadSound = async (type: SoundType): Promise<Audio.Sound | null> => {
  // Skip on web for now (would need hosted sound files)
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    // Get the public URL for the sound file
    const { data } = await supabase
      .storage
      .from('sounds')
      .createSignedUrl(soundPaths[type], 3600); // 1 hour expiry

    if (!data?.signedUrl) {
      console.warn(`Sound file not found: ${soundPaths[type]}`);
      return null;
    }

    // Load the sound from the public URL
    const { sound } = await Audio.Sound.createAsync(
      { uri: data.signedUrl },
      { shouldPlay: false }
    );

    return sound;
  } catch (error) {
    console.error('Error loading sound:', error);
    return null;
  }
};

// Play a sound effect
export const playSoundEffect = async (type: SoundType) => {
  try {
    // Skip on web for now
    if (Platform.OS === 'web') {
      return;
    }

    // Load the sound if it's not already loaded
    if (!sounds[type]) {
      sounds[type] = await loadSound(type);
    }

    // Play the sound if available
    if (sounds[type]) {
      await sounds[type]!.setPositionAsync(0);
      await sounds[type]!.playAsync();
    }
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

// Clean up sounds when the app is closed
const unloadSounds = async () => {
  for (const type of Object.keys(sounds) as SoundType[]) {
    if (sounds[type]) {
      await sounds[type]!.unloadAsync();
      sounds[type] = null;
    }
  }
};