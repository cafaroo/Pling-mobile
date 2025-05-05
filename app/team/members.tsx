import React, { useState } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';
import { TeamMemberList } from '@/components/team/TeamMemberList';
import Header from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import * as teamService from '@/services/teamService';
import { UserPlus, Users } from 'lucide-react-native';
import { TeamRole } from '@/types/team';
import { ToastService } from '@/components/ui/Toast';

export default function TeamMembersScreen() {
  const { teamId } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);

  // Hämta teamdata och användarroll
  const { data: team, isLoading: isTeamLoading } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamService.getTeam(teamId as string),
    enabled: !!teamId,
  });

  const { data: userRole } = useQuery({
    queryKey: ['team-role', teamId],
    queryFn: () => teamService.getUserRole(teamId as string),
    enabled: !!teamId,
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.main,
    },
    content: {
      flex: 1,
      padding: 16,
      gap: 16,
    },
    card: {
      backgroundColor: colors.background.card,
      borderRadius: 12,
      padding: 16,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
        web: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
      }),
    },
    memberCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.background.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
        web: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
      }),
    },
    memberInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    memberName: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 16,
      color: colors.text.main,
    },
    memberRole: {
      fontFamily: 'Inter-Regular',
      fontSize: 14,
      color: colors.text.light,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    blurView: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 12,
    },
    statsCard: {
      marginBottom: 16,
      overflow: 'hidden',
      borderRadius: 16,
    },
    statsBlur: {
      padding: 16,
    },
    statsContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statsText: {
      marginLeft: 16,
    },
    statsTitle: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      marginBottom: 4,
    },
    statsSubtitle: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
    },
  });

  if (isTeamLoading) {
    return <LoadingState />;
  }

  if (!team) {
    return (
      <ErrorState
        title="Kunde inte hitta teamet"
        description="Teamet kunde inte hittas. Kontrollera att du har rätt länk."
        action={{
          label: 'Gå tillbaka',
          onPress: () => router.back(),
        }}
      />
    );
  }

  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

  const handleInviteMember = () => {
    router.push('/team/join');
  };

  return (
    <View style={styles.container}>
      <Header
        title="Teammedlemmar"
        showBackButton
        rightElement={
          isOwnerOrAdmin ? (
            <Button
              variant="secondary"
              size="small"
              icon={UserPlus}
              onPress={handleInviteMember}
              label="Bjud in"
            />
          ) : undefined
        }
      />

      <View style={styles.content}>
        <Card style={styles.statsCard}>
          <BlurView intensity={20} style={styles.statsBlur}>
            <View style={styles.statsContent}>
              <Users size={24} color={colors.accent.yellow} />
              <View style={styles.statsText}>
                <Text style={[styles.statsTitle, { color: colors.text.main }]}>
                  {team.team_members?.length || 0} medlemmar
                </Text>
                <Text style={[styles.statsSubtitle, { color: colors.text.light }]}>
                  {isOwnerOrAdmin ? 'Hantera ditt teams medlemmar' : 'Se dina teammedlemmar'}
                </Text>
              </View>
            </View>
          </BlurView>
        </Card>

        <TeamMemberList
          teamId={teamId as string}
          currentUserRole={userRole as TeamRole}
          variant="detailed"
          showRoleBadges
          showStatusBadges
        />
      </View>
    </View>
  );
} 