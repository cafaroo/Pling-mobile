import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { chatService } from '@/services/chatService';
import PlingModal from '@/components/sales/PlingModal';
import { TeamMember } from '@/types/team';

type MentionPickerProps = {
  teamId: string;
  onSelect: (member: TeamMember) => void;
  onClose: () => void;
  searchQuery: string;
};

export default function MentionPicker({
  teamId,
  onSelect,
  onClose,
  searchQuery,
}: MentionPickerProps) {
  const { colors } = useTheme();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (teamId) {
      loadTeamMembers();
    }
  }, [teamId]);

  useEffect(() => {
    if (searchQuery && members.length > 0) {
      searchMembers();
    } else {
      setFilteredMembers(members);
    }
  }, [searchQuery, members]);

  const loadTeamMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const teamMembers = await chatService.getTeamMembers(teamId);
      setMembers(teamMembers);
      setFilteredMembers(teamMembers);
    } catch (error) {
      console.error('Error loading team members:', error);
      setError('Kunde inte ladda teammedlemmar');
      setMembers([]);
      setFilteredMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchMembers = async () => {
    try {
      const searchResults = await chatService.searchTeamMembers(teamId, searchQuery);
      setFilteredMembers(searchResults);
    } catch (error) {
      console.error('Error searching members:', error);
      setError('Kunde inte söka efter medlemmar');
    }
  };

  const handlePlingPress = () => {
    setModalVisible(true);
  };

  const renderMember = ({ item }: { item: TeamMember }) => {
    if (!item?.profile?.name) {
      console.error('Invalid member item:', item);
      return null;
    }

    return (
      <TouchableOpacity
        style={[styles.memberItem, { backgroundColor: colors.neutral[800] }]}
        onPress={() => onSelect(item)}
      >
        {item.profile.avatar_url ? (
          <Image
            source={{ uri: item.profile.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.neutral[600] }]}>
            <Text style={[styles.avatarText, { color: colors.text.light }]}>
              {item.profile.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.memberInfo}>
          <Text style={[styles.memberName, { color: colors.text.main }]}>
            {item.profile.name}
          </Text>
          <Text style={[styles.memberRole, { color: colors.text.light }]}>
            {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.neutral[900] }]}>
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.neutral[900] }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      </View>
    );
  }

  if (filteredMembers.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: colors.neutral[900] }]}>
        <Text style={[styles.emptyText, { color: colors.text.light }]}>
          Inga medlemmar hittades
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.neutral[900] }]}>
      <FlatList
        data={filteredMembers}
        renderItem={renderMember}
        keyExtractor={(item) => item?.id || 'unknown'}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      />
      <PlingModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 200,
    borderRadius: 8,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)' }
      : Platform.OS === 'android'
      ? { elevation: 4 }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }),
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  memberInfo: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  memberRole: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    opacity: 0.7,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    opacity: 0.7,
  },
}); 