import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Appbar, Text, Card, useTheme, Avatar, List, Divider, FAB, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, ChevronRight, MessageSquare } from 'lucide-react-native'; // Assuming lucide-react-native is installed

// Mock data - Replace with actual data fetching logic
const mockTeams = [
  { id: '1', name: 'Team Alpha', members: 5, lastActivity: 'Idag, 14:30', unreadMessages: 3 },
  { id: '2', name: 'Säljarna Sthlm', members: 8, lastActivity: 'Igår, 09:15', unreadMessages: 0 },
  { id: '3', name: 'Göteborgs Vargar', members: 4, lastActivity: '2024-05-06', unreadMessages: 1 },
  { id: '4', name: 'Region Syd', members: 12, lastActivity: '2024-05-05', unreadMessages: 0 },
];

export default function TeamScreen() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter teams based on search query (simple implementation)
  const filteredTeams = mockTeams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTeamItem = ({ item }: { item: typeof mockTeams[0] }) => (
    <List.Item
      title={item.name}
      description={`Medlemmar: ${item.members} | Senaste aktivitet: ${item.lastActivity}`}
      titleStyle={{ color: theme.colors.onSurface, fontWeight: 'bold' }}
      descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
      left={props => <Avatar.Icon {...props} icon="account-group" style={{backgroundColor: theme.colors.primaryContainer}} color={theme.colors.onPrimaryContainer} />}
      right={props => (
        <View style={styles.listItemRightContainer}>
          {item.unreadMessages > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: theme.colors.errorContainer }]}>
              <Text style={[styles.unreadText, { color: theme.colors.onErrorContainer }]}>{item.unreadMessages}</Text>
            </View>
          )}
          <ChevronRight {...props} color={theme.colors.onSurfaceVariant} />
        </View>
      )}
      onPress={() => console.log('Navigera till team:', item.name)}
      style={styles.listItem}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header 
        style={{ backgroundColor: theme.colors.surface }}
        statusBarHeight={0}
      >
        <Appbar.Content title="Team" titleStyle={{ color: theme.colors.primary }} />
        {/* <Appbar.Action icon="magnify" onPress={() => { /* Implement search logic */ }} color={theme.colors.primary} /> */}
        {/* Add other actions if needed */}
      </Appbar.Header>
      
      <Searchbar
         placeholder="Sök team..."
         onChangeText={setSearchQuery}
         value={searchQuery}
         style={styles.searchbar}
         inputStyle={{ color: theme.colors.onSurface }}
         placeholderTextColor={theme.colors.onSurfaceVariant}
         iconColor={theme.colors.onSurfaceVariant}
         elevation={1}
       />

      <FlatList
        data={filteredTeams}
        renderItem={renderTeamItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyListContainer}>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Inga team hittades.</Text>
          </View>
        )}
      />
      <FAB
        icon="plus"
        label="Skapa team"
        style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
        color={theme.colors.onPrimaryContainer}
        onPress={() => console.log('Navigera till Skapa Team')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchbar: {
    margin: 16,
    marginBottom: 8, 
  },
  listItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listItemRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 5,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
}); 