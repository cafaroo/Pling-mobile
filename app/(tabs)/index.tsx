import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, TrendingUp, Target, Trophy, Users, ChevronRight, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PlingModal from '@/components/sales/PlingModal';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  
  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.main]}
        style={styles.background}
      />
      <Header title="Start" icon={Bell} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.welcomeContent}>
            <Text style={[styles.welcomeTitle, { color: colors.text.main }]}>
              Välkommen tillbaka, {user?.name?.split(' ')[0] || 'säljare'}! 👋
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.text.light }]}>
              Låt oss göra denna vecka till den bästa hittills
            </Text>
          </View>
          <Button
            title="PLING!"
            icon={Plus}
            onPress={() => router.push('/pling')}
            variant="primary"
            size="large"
            style={styles.plingButton}
          />
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <TrendingUp color={colors.accent.yellow} size={24} />
            <Text style={[styles.statValue, { color: colors.text.main }]}>
              {new Intl.NumberFormat('sv-SE').format(125000)} kr
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.light }]}>
              Denna vecka
            </Text>
          </Card>
          
          <Card style={styles.statCard}>
            <Target color={colors.accent.pink} size={24} />
            <Text style={[styles.statValue, { color: colors.text.main }]}>
              82%
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.light }]}>
              Av målet
            </Text>
          </Card>
          
          <Card style={styles.statCard}>
            <Trophy color={colors.success} size={24} />
            <Text style={[styles.statValue, { color: colors.text.main }]}>
              #2
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.light }]}>
              Ranking
            </Text>
          </Card>
        </View>

        {/* Active Competitions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
              Aktiva tävlingar
            </Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={[styles.viewAllText, { color: colors.accent.yellow }]}>
                Visa alla
              </Text>
              <ChevronRight color={colors.accent.yellow} size={16} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.competitionsContainer}>
            <Card style={styles.competitionCard}>
              <Image
                source={{ uri: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1200' }}
                style={styles.competitionImage}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.competitionOverlay}
              />
              <View style={styles.competitionContent}>
                <Text style={[styles.competitionTitle, { color: colors.text.main }]}>
                  Sommarens utmaning
                </Text>
                <View style={styles.competitionStats}>
                  <View style={styles.competitionStat}>
                    <Trophy size={16} color={colors.accent.yellow} />
                    <Text style={[styles.competitionStatText, { color: colors.text.light }]}>
                      #2 av 12
                    </Text>
                  </View>
                  <View style={styles.competitionStat}>
                    <Target size={16} color={colors.accent.yellow} />
                    <Text style={[styles.competitionStatText, { color: colors.text.light }]}>
                      82% av mål
                    </Text>
                  </View>
                </View>
              </View>
            </Card>

            <Card style={styles.competitionCard}>
              <Image
                source={{ uri: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1200' }}
                style={styles.competitionImage}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.competitionOverlay}
              />
              <View style={styles.competitionContent}>
                <Text style={[styles.competitionTitle, { color: colors.text.main }]}>
                  Team Challenge
                </Text>
                <View style={styles.competitionStats}>
                  <View style={styles.competitionStat}>
                    <Trophy size={16} color={colors.accent.yellow} />
                    <Text style={[styles.competitionStatText, { color: colors.text.light }]}>
                      #1 av 8
                    </Text>
                  </View>
                  <View style={styles.competitionStat}>
                    <Target size={16} color={colors.accent.yellow} />
                    <Text style={[styles.competitionStatText, { color: colors.text.light }]}>
                      95% av mål
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </ScrollView>
        </View>

        {/* Team Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
              Teamets aktivitet
            </Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={[styles.viewAllText, { color: colors.accent.yellow }]}>
                Visa alla
              </Text>
              <ChevronRight color={colors.accent.yellow} size={16} />
            </TouchableOpacity>
          </View>

          <Card style={styles.teamCard}>
            <View style={styles.teamHeader}>
              <View style={styles.teamInfo}>
                <Users color={colors.accent.yellow} size={24} />
                <Text style={[styles.teamName, { color: colors.text.main }]}>
                  Team Awesome
                </Text>
              </View>
              <Text style={[styles.teamRank, { color: colors.accent.yellow }]}>
                #2 av 12
              </Text>
            </View>

            <View style={styles.teamMembers}>
              {[
                {
                  name: 'Anna A.',
                  avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=300',
                  sales: 125000
                },
                {
                  name: 'Erik J.',
                  avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=300',
                  sales: 98500
                },
                {
                  name: 'Sofia L.',
                  avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300',
                  sales: 87000
                }
              ].map((member, index) => (
                <View key={index} style={styles.teamMember}>
                  <View style={styles.memberInfo}>
                    <Image 
                      source={{ uri: member.avatar }}
                      style={styles.memberAvatar}
                    />
                    <Text style={[styles.memberName, { color: colors.text.main }]}>
                      {member.name}
                    </Text>
                  </View>
                  <Text style={[styles.memberSales, { color: colors.accent.yellow }]}>
                    {new Intl.NumberFormat('sv-SE').format(member.sales)} kr
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeContent: {
    flex: 1,
    marginRight: 16,
  },
  welcomeTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  plingButton: {
    minWidth: 120,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  competitionsContainer: {
    paddingRight: 20,
    gap: 16,
  },
  competitionCard: {
    width: 280,
    height: 160,
    overflow: 'hidden',
  },
  competitionImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  competitionOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  competitionContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
  },
  competitionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 8,
  },
  competitionStats: {
    flexDirection: 'row',
    gap: 16,
  },
  competitionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  competitionStatText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  teamCard: {
    padding: 20,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamName: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  teamRank: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  teamMembers: {
    gap: 16,
  },
  teamMember: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  memberName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  memberSales: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
});