import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { TeamInvitation } from '@types/team';
import { Mail, Calendar, Clock, Check, X, ChevronRight } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

/**
 * Props för InvitationCard-komponenten
 * 
 * @interface InvitationCardProps
 * @property {TeamInvitation} invitation - Inbjudningen som ska visas
 * @property {() => void} [onAccept] - Callback som anropas vid accepterande
 * @property {() => void} [onDecline] - Callback som anropas vid avböjande
 * @property {() => void} [onPress] - Callback som anropas vid klick på hela kortet
 * @property {boolean} [isLoading] - Indikerar laddningstillstånd
 * @property {'default' | 'compact' | 'detailed'} [variant] - Visningsvariant
 */
interface InvitationCardProps {
  invitation: TeamInvitation;
  onAccept?: () => void;
  onDecline?: () => void;
  onPress?: () => void;
  isLoading?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

/**
 * Kort som visar en teaminbjudan med alternativ att acceptera eller avböja
 * 
 * Denna komponent visar information om en teaminbjudan inklusive
 * vilket team inbjudan är till, vem som skickade den, när den förfaller,
 * och knappar för att acceptera eller avböja. Finns i olika visningsvarianter.
 * 
 * @param {InvitationCardProps} props - Komponentens props
 * @returns {React.ReactElement} Den renderade komponenten
 * 
 * @example
 * <InvitationCard
 *   invitation={invitation}
 *   onAccept={handleAccept}
 *   onDecline={handleDecline}
 *   isLoading={isSubmitting}
 * />
 */
export const InvitationCard: React.FC<InvitationCardProps> = ({
  invitation,
  onAccept,
  onDecline,
  onPress,
  isLoading = false,
  variant = 'default'
}) => {
  const { colors } = useTheme();
  
  // Beräkna utgångstid relativt till nuvarande tid
  const expiresAt = new Date(invitation.expires_at);
  const timeLeft = formatDistanceToNow(expiresAt, { 
    addSuffix: true,
    locale: sv 
  });
  
  // Kontrollera om inbjudan håller på att förfalla (mindre än 24 timmar kvar)
  const isExpiringSoon = expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000;
  
  const CardContent = () => {
    switch (variant) {
      case 'compact':
        return (
          <View style={styles.compactContainer}>
            <View style={styles.compactInfoContainer}>
              <Text style={[styles.teamName, { color: colors.text.main }]} numberOfLines={1}>
                {invitation.team?.name || 'Team'}
              </Text>
              <Text style={[styles.expiry, { color: isExpiringSoon ? colors.warning : colors.text.light }]}>
                <Clock size={12} color={isExpiringSoon ? colors.warning : colors.text.light} />
                {' '}Förfaller {timeLeft}
              </Text>
            </View>
            
            {(onAccept || onDecline) && (
              <View style={styles.compactActions}>
                {onDecline && (
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: colors.error }]}
                    onPress={onDecline}
                    disabled={isLoading}
                  >
                    <X size={16} color="#FFF" />
                  </TouchableOpacity>
                )}
                {onAccept && (
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: colors.success }]}
                    onPress={onAccept}
                    disabled={isLoading}
                  >
                    <Check size={16} color="#FFF" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );

      case 'detailed':
        return (
          <View style={styles.detailedContainer}>
            <View style={styles.header}>
              <Mail size={24} color={colors.primary.main} style={styles.icon} />
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: colors.text.main }]}>
                  Inbjudan till team
                </Text>
                <Text style={[styles.teamNameLarge, { color: colors.primary.main }]}>
                  {invitation.team?.name || 'Team'}
                </Text>
              </View>
            </View>
            
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text.light }]}>
                  Inbjudan till:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text.main }]}>
                  {invitation.email}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text.light }]}>
                  Roll:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text.main }]}>
                  {getRoleLabel(invitation.role)}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.text.light }]}>
                  Förfaller:
                </Text>
                <Text 
                  style={[
                    styles.detailValue, 
                    { color: isExpiringSoon ? colors.warning : colors.text.main }
                  ]}
                >
                  {timeLeft}
                </Text>
              </View>
            </View>
            
            {(onAccept || onDecline) && (
              <View style={styles.detailedActions}>
                {onDecline && (
                  <Button
                    title="Avböj"
                    Icon={X}
                    variant="outline"
                    style={[styles.button, { borderColor: colors.error }]}
                    textStyle={{ color: colors.error }}
                    iconColor={colors.error}
                    onPress={onDecline}
                    disabled={isLoading}
                  />
                )}
                {onAccept && (
                  <Button
                    title="Acceptera"
                    Icon={Check}
                    variant="primary"
                    style={styles.button}
                    onPress={onAccept}
                    disabled={isLoading}
                    loading={isLoading}
                  />
                )}
              </View>
            )}
          </View>
        );

      default: // 'default'
        return (
          <View style={styles.defaultContainer}>
            <View style={styles.defaultContent}>
              <View style={styles.infoContainer}>
                <Text style={[styles.teamName, { color: colors.text.main }]}>
                  {invitation.team?.name || 'Team'}
                </Text>
                <Text style={[styles.email, { color: colors.text.light }]}>
                  <Mail size={14} color={colors.text.light} />
                  {' '}{invitation.email}
                </Text>
                <Text style={[styles.expiry, { color: isExpiringSoon ? colors.warning : colors.text.light }]}>
                  <Clock size={14} color={isExpiringSoon ? colors.warning : colors.text.light} />
                  {' '}Förfaller {timeLeft}
                </Text>
              </View>
              
              {(onAccept || onDecline) && (
                <View style={styles.actions}>
                  {onDecline && (
                    <Button
                      title="Avböj"
                      Icon={X}
                      variant="outline"
                      size="small"
                      style={[styles.button, { borderColor: colors.error }]}
                      textStyle={{ color: colors.error }}
                      iconColor={colors.error}
                      onPress={onDecline}
                      disabled={isLoading}
                    />
                  )}
                  {onAccept && (
                    <Button
                      title="Acceptera"
                      Icon={Check}
                      variant="primary"
                      size="small"
                      style={styles.button}
                      onPress={onAccept}
                      disabled={isLoading}
                      loading={isLoading}
                    />
                  )}
                </View>
              )}
            </View>
            
            {onPress && (
              <TouchableOpacity 
                style={styles.chevronContainer} 
                onPress={onPress}
                disabled={isLoading}
              >
                <ChevronRight size={20} color={colors.text.light} />
              </TouchableOpacity>
            )}
          </View>
        );
    }
  };
  
  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (onPress && variant !== 'detailed') {
      return (
        <TouchableOpacity
          onPress={onPress}
          disabled={isLoading}
          style={styles.cardTouchable}
        >
          <Card style={styles.card}>{children}</Card>
        </TouchableOpacity>
      );
    }
    return <Card style={styles.card}>{children}</Card>;
  };
  
  return (
    <CardWrapper>
      <CardContent />
    </CardWrapper>
  );
};

/**
 * Returnerar lokaliserad etikett för en teamroll
 * 
 * @param {string} role - Rollens värde
 * @returns {string} - Den lokaliserade etiketten
 */
function getRoleLabel(role: string): string {
  switch (role) {
    case 'owner':
      return 'Ägare';
    case 'admin':
      return 'Administratör';
    case 'moderator':
      return 'Moderator';
    case 'member':
    default:
      return 'Medlem';
  }
}

const styles = StyleSheet.create({
  cardTouchable: {
    marginVertical: 8,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  compactInfoContainer: {
    flex: 1,
  },
  compactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  defaultContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoContainer: {
    flex: 1,
  },
  chevronContainer: {
    paddingLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 4,
  },
  expiry: {
    fontSize: 14,
  },
  button: {
    minWidth: 100,
  },
  detailedContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    marginBottom: 4,
  },
  teamNameLarge: {
    fontSize: 20,
    fontWeight: '700',
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailedActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
}); 