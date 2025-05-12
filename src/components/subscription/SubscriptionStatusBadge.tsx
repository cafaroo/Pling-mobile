import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SubscriptionStatus, getSubscriptionStatusColor, getSubscriptionStatusDisplayName } from '../../domain/subscription/value-objects/SubscriptionTypes';

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus;
  daysLeft?: number;
  showDays?: boolean;
}

export const SubscriptionStatusBadge: React.FC<SubscriptionStatusBadgeProps> = ({
  status,
  daysLeft,
  showDays = true,
}) => {
  const statusColor = getSubscriptionStatusColor(status);
  const statusText = getSubscriptionStatusDisplayName(status);
  
  let daysText = '';
  if (showDays && daysLeft !== undefined) {
    if (status === 'trialing') {
      daysText = `${daysLeft} ${daysLeft === 1 ? 'dag' : 'dagar'} kvar av provperiod`;
    } else if (status === 'active') {
      daysText = `Förnyas om ${daysLeft} ${daysLeft === 1 ? 'dag' : 'dagar'}`;
    }
  }
  
  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: statusColor }]}>
        <Text style={styles.statusText}>{statusText}</Text>
      </View>
      
      {daysText ? (
        <Text style={styles.daysText}>{daysText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  daysText: {
    fontSize: 12,
    color: '#666',
  },
}); 