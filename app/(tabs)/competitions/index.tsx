import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Award, Clock, Users, ChevronRight, Trophy, Plus, Target, Filter, Crown, Star } from 'lucide-react-native';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { getCompetitions } from '@/services/competitionService';
import { supabase } from '@services/supabaseClient';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import FilterModal from '@/components/competition/FilterModal';
import { Competition } from '@/types';
import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';

export default function CompetitionsScreen() {
  const [filters, setFilters] = useState({
    status: [],
    type: [],
    hasPrize: null,
    startDate: null,
    endDate: null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const { colors } = useTheme();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadCompetitions();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('competition_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadCompetitions = async () => {
    try {
      setIsLoading(true);
      const data = await getCompetitions(selectedCategory, filters);
      
      setCompetitions(data);
    } catch (error) {
      console.error('Error loading competitions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return colors.primary.light;
      case 'active':
        return colors.success;
      case 'ended':
        return colors.neutral[400];
      default:
        return colors.neutral[400];
    }
  };

  const getCompetitionStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) {
      return 'upcoming';
    } else if (now > end) {
      return 'ended';
    }
    return 'active';
  };

  const renderCompetitionItem = ({ item }: { item: Competition }) => {
    const daysLeft = differenceInDays(new Date(item.endDate), new Date());
    const hoursLeft = differenceInHours(new Date(item.endDate), new Date());
    const timeLeft = daysLeft > 0 ? `${daysLeft} dagar kvar` : `${hoursLeft} timmar kvar`;
    const status = getCompetitionStatus(item.startDate, item.endDate);
    
    return (
      <TouchableOpacity
        onPress={() => router.push(`/competitions/${item.id}`)}
        style={styles.itemContainer}
        activeOpacity={0.8}
      >
        <Card style={styles.card}>
          <View style={styles.imageContainer}>
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.2)', 'transparent']}
              style={styles.imageGradient}
            />
            <Image
              source={{ 
                uri: item.imageUrl || 
                'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1200'
              }}
              style={styles.coverImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.imageOverlay}
            />
            {item.prize && (
              <View style={[styles.prizeBadge, { backgroundColor: colors.accent.yellow }]}>
                <Trophy size={14} color={colors.background.dark} />
                <Text style={styles.prizeText}>{item.prize}</Text>
              </View>
            )}
            <View style={styles.badgeContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                <Text style={styles.statusText}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.accent.yellow }]}>
                <Text style={styles.badgeText}>
                  {item.type === 'team' ? 'Lagtävling' : 'Individuell'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.cardContent}>
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: colors.text.main }]}>
                {item.title}
              </Text>
            </View>

            <Text style={[styles.description, { color: colors.text.light }]} numberOfLines={2}>
              {item.description || 'Tävla med dina kollegor och nå nya höjder tillsammans! Vem kommer att ta hem segern?'}
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.infoItem}>
                <Clock size={16} color={colors.text.light} />
                <Text style={[styles.infoText, { color: colors.text.light }]}>
                  {timeLeft}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Target size={16} color={colors.text.light} />
                <Text style={[styles.infoText, { color: colors.text.light }]}>
                  {new Intl.NumberFormat('sv-SE').format(item.targetValue)} kr
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Users size={16} color={colors.text.light} />
                <Text style={[styles.infoText, { color: colors.text.light }]}>
                  {item.totalParticipants} deltagare
                </Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.text.light }]}>
                  Framsteg mot målet
                </Text>
                <Text style={[styles.progressValue, { color: colors.accent.yellow }]}>
                  {new Intl.NumberFormat('sv-SE').format(item.currentValue)} kr
                </Text>
              </View>
              <ProgressBar
                progress={(item.currentValue / item.targetValue) * 100}
                height={8}
                style={styles.progressBar}
                colors={[colors.accent.yellow, colors.accent.pink]}
              />
            </View>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.accent.yellow }]}
              onPress={() => router.push(`/competitions/${item.id}`)}
            >
              <Text style={[styles.actionButtonText, { color: colors.background.dark }]}>
                Se detaljer
              </Text>
              <ChevronRight size={16} color={colors.background.dark} />
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.main]}
        style={styles.background}
      />
      <Header 
        title="Tävlingar" 
        icon={Award}
        rightIcon={Filter}
        onRightIconPress={() => setShowFilters(true)}
      />
      
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
          loadCompetitions();
        }}
        initialFilters={filters}
      />
      
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.categoriesContainer, { borderBottomColor: colors.neutral[700] }]}
          contentContainerStyle={styles.categoriesList}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategory && { backgroundColor: colors.accent.yellow }
            ]}
            onPress={() => {
              setSelectedCategory(null);
              loadCompetitions();
            }}
          >
            <Text style={[
              styles.categoryText,
              !selectedCategory && { color: colors.background.dark }
            ]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && { backgroundColor: category.color }
              ]}
              onPress={() => {
                setSelectedCategory(category.id);
                loadCompetitions();
              }}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && { color: colors.background.dark }
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text.light }]}>
            Laddar tävlingar...
          </Text>
        </View>
      ) : competitions.length > 0 ? (
        <FlatList
          data={competitions}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={renderCompetitionItem}
          contentContainerStyle={[
            styles.listContent,
            competitions.length === 0 && styles.emptyList
          ]}
          ListHeaderComponent={() => (
            <View style={styles.featuredCompetition}>
              <LinearGradient
                colors={['rgba(250, 204, 21, 0.2)', 'transparent']}
                style={styles.featuredBackground}
              />
              <Crown size={24} color={colors.accent.yellow} style={styles.featuredIcon} />
              <Text style={[styles.featuredTitle, { color: colors.text.main }]}>
                Månadens utmaning
              </Text>
              <Text style={[styles.featuredDescription, { color: colors.text.light }]}>
                Tävla om titeln som månadens bästa säljare och vinn fantastiska priser!
              </Text>
              <View style={styles.featuredStats}>
                <View style={styles.featuredStat}>
                  <Trophy size={16} color={colors.accent.yellow} />
                  <Text style={[styles.featuredStatText, { color: colors.text.light }]}>
                    12 deltagare
                  </Text>
                </View>
                <View style={styles.featuredStat}>
                  <Star size={16} color={colors.accent.yellow} />
                  <Text style={[styles.featuredStatText, { color: colors.text.light }]}>
                    3 priser
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.featuredButton, { backgroundColor: colors.accent.yellow }]}
                onPress={() => router.push('/competitions/featured')}
              >
                <Text style={[styles.featuredButtonText, { color: colors.background.dark }]}>
                  Delta nu
                </Text>
                <ChevronRight size={16} color={colors.background.dark} />
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary.light }]}>
            <Trophy size={48} color={colors.accent.yellow} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text.main }]}>
            Inga aktiva tävlingar
          </Text>
          <Text style={[styles.emptyDescription, { color: colors.text.light }]}>
            Det finns inga pågående tävlingar just nu. Skapa en ny tävling för att börja tävla med ditt team!
          </Text>
          <Button
            title="Skapa tävling"
            Icon={Plus}
            onPress={() => router.push('/competitions/create')}
            variant="primary"
            size="large"
            style={styles.createButton}
          />
        </View>
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.accent.yellow }]}
        onPress={() => router.push('/competitions/create')}
        activeOpacity={0.8}
      >
        <Plus color={colors.background.dark} size={24} />
      </TouchableOpacity>
    </Container>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyList: {
    flexGrow: 1,
  },
  itemContainer: {
    marginBottom: 16,
  },
  card: {
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  imageContainer: {
    height: 160,
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  imageGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    zIndex: 1,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  badgeContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#1E1B4B',
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: 140,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  progressBar: {
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  progressValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  prizeBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  prizeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#1E1B4B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 300,
  },
  createButton: {
    minWidth: 200,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FACC15',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  categoriesContainer: {
    height: 56,
    borderBottomWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  categoriesList: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    height: 36,
    justifyContent: 'center',
  },
  categoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: 'white',
    textTransform: 'capitalize',
  },
  featuredCompetition: {
    padding: 24,
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    overflow: 'hidden',
  },
  featuredBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  featuredIcon: {
    marginBottom: 16,
  },
  featuredTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: 8,
  },
  featuredDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  featuredStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  featuredStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featuredStatText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  featuredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  featuredButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
});