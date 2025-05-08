import React from 'react';
import { View, StyleSheet, FlatList, ImageBackground } from 'react-native';
import { Appbar, Text, Card, useTheme, Chip, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, Calendar, Users } from 'lucide-react-native';

const mockCompetitions = [
  {
    id: '1',
    title: 'SommarOffensiven 2024',
    description: 'Vinn en resa till Barcelona!',
    endDate: '2024-08-31',
    participants: 24,
    status: 'Pågår',
    image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=1966&auto=format&fit=crop',
    progress: 0.65 // Example progress for a user in this competition
  },
  {
    id: '2',
    title: 'HöstRacet Q3',
    description: 'Bli kvartalets Toppsäljare och vinn en bonus.',
    endDate: '2024-09-30',
    participants: 18,
    status: 'Pågår',
    image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=2068&auto=format&fit=crop',
    progress: 0.40
  },
  {
    id: '3',
    title: 'Vinterkampanjen Kick-off',
    description: 'Förberedelser och mål inför vinterns stora kampanj.',
    endDate: '2024-11-15',
    participants: 30,
    status: 'Kommande',
    image: 'https://images.unsplash.com/photo-1489367874814-f552b075a138?q=80&w=2070&auto=format&fit=crop',
    progress: 0
  },
];

export default function CompetitionsScreen() {
  const theme = useTheme();

  const renderCompetitionItem = ({ item }: { item: typeof mockCompetitions[0] }) => (
    <Card style={styles.card}>
      <ImageBackground source={{ uri: item.image }} style={styles.imageBackground} imageStyle={{ borderRadius: theme.roundness * 2 }}>
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
        <Card.Content style={styles.cardContent}>
          <Text variant="titleLarge" style={[styles.title, { color: '#FFFFFF' }]}>{item.title}</Text>
          <Text variant="bodyMedium" style={[styles.description, { color: '#E0E0E0' }]}>{item.description}</Text>
          <View style={styles.infoRow}>
            <Chip icon={() => <Calendar size={16} color={theme.colors.onSecondaryContainer} />} 
                  style={[styles.chip, { backgroundColor: theme.colors.secondaryContainer}]} 
                  textStyle={{color: theme.colors.onSecondaryContainer}}>
              Slutar: {item.endDate}
            </Chip>
            <Chip icon={() => <Users size={16} color={theme.colors.onSecondaryContainer} />} 
                  style={[styles.chip, { backgroundColor: theme.colors.secondaryContainer}]} 
                  textStyle={{color: theme.colors.onSecondaryContainer}}>
              {item.participants} Deltagare
            </Chip>
          </View>
          {item.status === 'Pågår' && (
             <View style={{ marginTop: 8 }}>
               <Text style={{color: '#E0E0E0', fontSize: 12, marginBottom: 4}}>Din framgång:</Text>
               <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                 <View style={[styles.progressBarContainer, {backgroundColor: 'rgba(255,255,255,0.3)'}]}>
                    <View style={[styles.progressBar, { width: `${item.progress * 100}%`, backgroundColor: theme.colors.tertiary }]} />
                 </View>
                 <Text style={{color: '#FFFFFF', fontSize: 12, marginLeft: 8}}>{(item.progress * 100).toFixed(0)}%</Text>
               </View>
             </View>
           )}
        </Card.Content>
      </ImageBackground>
      <Card.Actions style={{ backgroundColor: theme.colors.surfaceVariant, borderBottomLeftRadius: theme.roundness * 2, borderBottomRightRadius: theme.roundness * 2 }}>
        <Button 
          textColor={theme.colors.primary}
          onPress={() => console.log('View details for', item.title)}
        >
          Visa Detaljer
        </Button>
        {item.status === 'Pågår' && <Button textColor={theme.colors.tertiary}>Delta</Button>}
        {item.status === 'Kommande' && <Button textColor={theme.colors.secondary}>Anmäl intresse</Button>}
      </Card.Actions>
    </Card>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }} statusBarHeight={0}>
        <Appbar.Content title="Tävlingar" titleStyle={{ color: theme.colors.primary }} />
        <Appbar.Action icon="magnify" onPress={() => console.log('Search competitions')} color={theme.colors.primary} />
        <Appbar.Action icon="filter-variant" onPress={() => console.log('Filter competitions')} color={theme.colors.primary} />
      </Appbar.Header>
      <FlatList
        data={mockCompetitions}
        renderItem={renderCompetitionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 20,
    overflow: 'hidden',
  },
  imageBackground: {
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    height: 32, // Ensure chips are not too tall
    alignItems: 'center',
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    flex: 1,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
}); 