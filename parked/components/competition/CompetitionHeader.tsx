import { View, Text, StyleSheet, Image } from 'react-native';
import { Trophy, Users, Clock } from 'lucide-react-native';
import { format } from 'date-fns';
import { useTheme } from '@/context/ThemeContext';
import { Competition } from '@/types';
import Card from '@/components/ui/Card';

type CompetitionHeaderProps = {
  competition: Competition;
  style?: object;
};

export default function CompetitionHeader({ competition, style }: CompetitionHeaderProps) {
  const { colors } = useTheme();

  return (
    <Card style={[styles.headerCard, style]}>
      <View style={styles.imageContainer}>
        <Image
          source={{ 
            uri: competition.imageUrl || 
            'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1200'
          }}
          style={styles.coverImage}
          contentFit="cover"
        />
      </View>

      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text.main }]}>
          {competition.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.light }]}>
          {competition.description || 'Tävla med dina kollegor och nå nya höjder tillsammans! Vem kommer att ta hem segern?'}
        </Text>

        <View style={styles.typeContainer}>
          {competition.type === 'team' ? (
            <Users color={colors.accent.yellow} size={20} />
          ) : (
            <Trophy color={colors.accent.yellow} size={20} />
          )}
          <Text style={[styles.typeText, { color: colors.text.light }]}>
            {competition.type === 'team' ? 'Lagtävling' : 'Individuell tävling'}
          </Text>
        </View>
      </View>

      <View style={styles.dateContainer}>
        <Clock size={16} color={colors.text.light} />
        <Text style={[styles.dateText, { color: colors.text.light }]}>
          {format(new Date(competition.startDate), 'd MMM')} - {format(new Date(competition.endDate), 'd MMM')}
        </Text>
      </View>

      {competition.prize && (
        <View style={[styles.prizeBadge, { backgroundColor: colors.accent.yellow }]}>
          <Text style={styles.prizeText}>
            {competition.prize}
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    margin: -20,
    marginBottom: 20,
    height: 200,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    marginBottom: 12,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  dateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginLeft: 8,
  },
  prizeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 16,
  },
  prizeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#1E1B4B',
  },
});