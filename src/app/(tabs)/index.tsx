import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Appbar, Text, Card, useTheme, Avatar, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@context/AuthContext';
import { Bell, Target, Trophy, Zap } from 'lucide-react-native'; // Import relevant icons

export default function PlingScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  const firstName = user?.name?.split(' ')[0] || 'Plingare'; // Get first name or use default

  // Define styles inside the component to access theme
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32, // Add padding at the bottom
    },
    welcomeSection: {
      marginBottom: 24,
      paddingHorizontal: 8, // Slight horizontal padding
    },
    cardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
      gap: 12, // Add gap between cards
    },
    infoCard: {
      flex: 1, // Make cards share width
      borderRadius: 16, // More rounded corners
    },
    highlightCard: {
      marginBottom: 16,
      borderRadius: 16,
    },
    placeholderCard: {
      marginTop: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant, // Now theme is accessible
      borderStyle: 'dashed',
    },
    cardContent: {
      alignItems: 'center',
      paddingVertical: 16, // Add more vertical padding
    },
    cardTitle: {
      marginTop: 8,
      fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Custom Header could be considered if Paper Appbar is too restrictive */}
      <Appbar.Header
        style={{ backgroundColor: theme.colors.surface, elevation: 0 }} // Use surface, remove shadow
        statusBarHeight={0}
      >
        <Appbar.Content title="Pling" titleStyle={{ color: theme.colors.primary, fontWeight: 'bold' }} />
        <Appbar.Action icon="bell-outline" onPress={() => console.log('Notifications')} color={theme.colors.primary} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text variant="headlineMedium" style={{ color: theme.colors.onBackground }}>Välkommen tillbaka,</Text>
          <Text variant="headlineLarge" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{firstName}! 👋</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            Här är en snabb överblick av vad som händer.
          </Text>
        </View>

        {/* Quick Action / Info Cards */}
        <View style={styles.cardRow}>
          <Card style={[styles.infoCard, { backgroundColor: theme.colors.primaryContainer }]} onPress={() => console.log('Go to Goals')}>
            <Card.Content style={styles.cardContent}>
              <Target size={28} color={theme.colors.onPrimaryContainer} />
              <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onPrimaryContainer }]}>Dina Mål</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>3 pågående</Text>
            </Card.Content>
          </Card>
          <Card style={[styles.infoCard, { backgroundColor: theme.colors.secondaryContainer }]} onPress={() => console.log('Go to Competitions')}>
            <Card.Content style={styles.cardContent}>
              <Trophy size={28} color={theme.colors.onSecondaryContainer} />
              <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSecondaryContainer }]}>Tävlingar</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer }}>1 aktiv</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Highlight Card - e.g., Latest Important Notification or Action */}
        <Card style={[styles.highlightCard, { backgroundColor: theme.colors.tertiaryContainer }]} onPress={() => console.log('Highlight Action')}>
           <Card.Title 
             title="Ny Utmaning!" 
             titleStyle={{ color: theme.colors.onTertiaryContainer, fontWeight: 'bold' }}
             left={(props) => <Zap {...props} color={theme.colors.onTertiaryContainer} />} 
           />
          <Card.Content>
            <Text variant="bodyMedium" style={{ color: theme.colors.onTertiaryContainer }}>
              Veckans "Sprint" har startat. Registrera dina Plings!
            </Text>
          </Card.Content>
           <Card.Actions>
             <Button textColor={theme.colors.onTertiaryContainer}>Se utmaning</Button>
           </Card.Actions>
        </Card>
        
        {/* Placeholder for future content like activity feed */}
         <Card style={styles.placeholderCard}>
           <Card.Content style={{alignItems: 'center'}}>
             <Bell size={40} color={theme.colors.onSurfaceVariant} style={{marginBottom: 8}}/>
             <Text style={{ color: theme.colors.onSurfaceVariant }}>Framtida aktivitetsflöde här...</Text>
           </Card.Content>
         </Card>

      </ScrollView>
    </SafeAreaView>
  );
} 