import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TeamMember } from '@/types/team';
import { Clock, Check, X } from 'lucide-react-native';
import { MemberItem } from './MemberItem';

/**
 * Props för PendingApprovalCard-komponenten
 * @interface PendingApprovalCardProps
 * @property {TeamMember[]} pendingMembers - Lista med väntande medlemmar som behöver godkännas
 * @property {(userId: string) => void} onApprove - Callback-funktion som anropas när en medlem godkänns
 * @property {(userId: string) => void} onReject - Callback-funktion som anropas när en medlem avvisas
 * @property {boolean} [isLoading] - Indikerar om komponenten är i laddningsläge
 */
interface PendingApprovalCardProps {
  pendingMembers: TeamMember[];
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  isLoading?: boolean;
}

/**
 * Props för ActionButtons-komponenten
 * @interface ActionButtonsProps
 * @property {string} memberId - ID för medlemmen som knapparna tillhör
 * @property {(userId: string) => void} onApprove - Callback-funktion som anropas vid godkännande
 * @property {(userId: string) => void} onReject - Callback-funktion som anropas vid avvisning
 * @property {boolean} [isLoading] - Indikerar om knappar är i laddningsläge
 */
interface ActionButtonsProps {
  memberId: string;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  isLoading?: boolean;
}

/**
 * Renderar godkännings- och avvisningsknappar för en enskild medlem
 * 
 * @param {ActionButtonsProps} props - Komponentens props
 * @returns {React.ReactElement} Renderade knappar
 */
const ActionButtons = ({ memberId, onApprove, onReject, isLoading }: ActionButtonsProps) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.actions}>
      <Button 
        Icon={X}
        variant="outline"
        size="small"
        onPress={() => onReject(memberId)}
        disabled={isLoading}
        style={[styles.actionButton, { borderColor: colors.error }]}
      />
      <Button 
        Icon={Check}
        variant="primary"
        size="small"
        onPress={() => onApprove(memberId)}
        disabled={isLoading}
        style={styles.actionButton}
      />
    </View>
  );
};

/**
 * Kort som visar väntande teammedlemmar som behöver godkännas
 * 
 * Denna komponent visar en lista över medlemmar som väntar på godkännande
 * med knappar för att godkänna eller avvisa varje medlem. Den använder MemberItem
 * för att visa medlemsinformation och ActionButtons för interaktionsknappar.
 * 
 * @param {PendingApprovalCardProps} props - Komponentens props
 * @returns {React.ReactElement | null} Renderat kort med väntande godkännanden eller null om listan är tom
 * 
 * @example
 * <PendingApprovalCard
 *   pendingMembers={pendingMembers}
 *   onApprove={handleApprove}
 *   onReject={handleReject}
 *   isLoading={isSubmitting}
 * />
 */
export const PendingApprovalCard = ({ pendingMembers, onApprove, onReject, isLoading = false }: PendingApprovalCardProps) => {
  const { colors } = useTheme();

  if (pendingMembers.length === 0) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Clock color={colors.accent.yellow} size={24} />
          <Text style={[styles.title, { color: colors.text.main }]}>
            Väntande Godkännanden
          </Text>
        </View>
        <Text style={[styles.count, { color: colors.text.light }]}>
          {pendingMembers.length} väntande
        </Text>
      </View>

      <View style={styles.membersList}>
        {pendingMembers.map((member) => (
          <View key={member.id} style={styles.memberItemContainer}>
            <MemberItem 
              member={member}
              variant="compact"
              showActions={false}
              showRoleBadge={false}
            />
            <ActionButtons 
              memberId={member.user_id} 
              onApprove={onApprove} 
              onReject={onReject} 
              isLoading={isLoading} 
            />
          </View>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  count: {
    fontSize: 14,
  },
  membersList: {
    gap: 12,
  },
  memberItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    minWidth: 40,
    height: 40,
  },
});