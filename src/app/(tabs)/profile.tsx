import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Appbar, Text, Card, useTheme, Avatar, List, Divider, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Settings, LogOut, ChevronRight, Edit } from 'lucide-react-native';
import { useAuth } from '@context/AuthContext';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuth(); // Get user data and signOut function

  // Mock data for demonstration
  const mockUser = {
    name: user?.name || 'Gustav Testsson',
    email: user?.email || 'gustav.test@example.com',
    avatarUrl: user?.avatarUrl || undefined, // Use actual avatar if available
    title: 'Toppsäljare',
    team: 'Team Alpha',
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation to login screen is handled by AuthProvider
    } catch (error) {
      console.error("Sign out error:", error);
      // Optionally show an error message to the user
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header 
        style={{ backgroundColor: theme.colors.surface }}
        statusBarHeight={0}
      >
        <Appbar.Content title="Profil" titleStyle={{ color: theme.colors.primary }} />
        <Appbar.Action icon="dots-vertical" onPress={() => console.log('More options')} color={theme.colors.primary} />
      </Appbar.Header>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Avatar.Image 
            size={100} 
            source={mockUser.avatarUrl ? { uri: mockUser.avatarUrl } : require('../../../assets/images/avatar-placeholder.png')} 
            style={{ backgroundColor: theme.colors.primaryContainer }}
          />
          <TouchableOpacity style={styles.editIconContainer}>
             <Edit size={18} color={theme.colors.onPrimaryContainer} />
           </TouchableOpacity>
          <Text variant="headlineSmall" style={[styles.userName, { color: theme.colors.onBackground }]}>{mockUser.name}</Text>
          <Text variant="titleMedium" style={[styles.userTitle, { color: theme.colors.primary }]}>{mockUser.title}</Text>
          <Text variant="bodyMedium" style={[styles.userTeam, { color: theme.colors.onSurfaceVariant }]}>Medlem i {mockUser.team}</Text>
        </View>

        {/* Profile Menu */}
        <Card style={[styles.menuCard, { backgroundColor: theme.colors.surfaceVariant }]}>
          <List.Section style={{ marginTop: 0 }}>
            <List.Item
              title="Personlig information"
              description="Hantera namn, e-post och kontaktuppgifter"
              left={props => <List.Icon {...props} icon="account-details" color={theme.colors.primary} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => console.log('Navigate to Personal Info')}
              titleStyle={{ color: theme.colors.onSurfaceVariant }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}
            />
            <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />
             <List.Item
              title="Inställningar"
              description="Appens utseende, notiser och språk"
              left={props => <List.Icon {...props} icon="cog" color={theme.colors.primary} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => console.log('Navigate to Settings')}
              titleStyle={{ color: theme.colors.onSurfaceVariant }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}
            />
             <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />
            <List.Item
              title="Hjälp & Support"
              description="Vanliga frågor och kontakta support"
              left={props => <List.Icon {...props} icon="help-circle-outline" color={theme.colors.primary} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => console.log('Navigate to Help')}
              titleStyle={{ color: theme.colors.onSurfaceVariant }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}
            />
          </List.Section>
        </Card>

        {/* Sign Out Button */}
        <Button 
          mode="contained" 
          icon="logout" 
          onPress={handleSignOut} 
          style={styles.signOutButton}
          buttonColor={theme.colors.errorContainer}
          textColor={theme.colors.onErrorContainer}
        >
          Logga ut
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
  },
  editIconContainer: {
    position: 'absolute',
    top: 16 + 100 - 28, // Align to bottom right of avatar image
    left: '50%', // Center horizontally
    marginLeft: 100/2 - 28/2, // Adjust for icon size and avatar radius
    backgroundColor: '#6200ee', // Hardcoded primary color
    borderRadius: 14,
    padding: 5,
    zIndex: 1,
  },
  userName: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  userTitle: {
    marginTop: 4,
  },
  userTeam: {
    marginTop: 4,
  },
  menuCard: {
    marginBottom: 24,
  },
  signOutButton: {
    marginTop: 16,
  },
}); 