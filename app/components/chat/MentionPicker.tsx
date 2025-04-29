import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/services/supabaseClient';

type TeamMember = {
  id: string;
  name: string;
  avatar_url?: string;
};

type MentionPickerProps = {
  teamId: string;
  onSelect: (member: TeamMember) => void;
  onClose: () => void;
  searchQuery: string;
};

export const MentionPicker: React.FC<MentionPickerProps> = ({
  teamId,
  onSelect,
  onClose,
  searchQuery,
}) => {
  const { colors } = useTheme();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teamId) {
      loadTeamMembers();
    }
  }, [teamId]);

  useEffect(() => {
    if (members.length > 0) {
      const filtered = members.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMembers(filtered);
    }
  }, [searchQuery, members]);

  const loadTeamMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: teamMembers, error: queryError } = await supabase
        .from('team_members')
        .select(`
          user_id,
          profiles!team_members_user_id_fkey (
            id,
            name,
            avatar_url
          )
        `)
        .eq('team_id', teamId);

      if (queryError) throw queryError;

      if (!teamMembers) {
        setMembers([]);
        setFilteredMembers([]);
        return;
      }

      console.log('Raw team members data:', teamMembers);

      // Validera och formatera team members
      const formattedMembers = teamMembers
        .map(member => member.profiles)
        .filter((profile): profile is NonNullable<typeof profile> => 
          profile !== null && 
          typeof profile === 'object' && 
          typeof profile.id === 'string' && 
          typeof profile.name === 'string'
        )
        .map(profile => ({
          id: profile.id,
          name: profile.name,
          avatar_url: profile.avatar_url,
        }));

      console.log('Formatted members:', formattedMembers);
      setMembers(formattedMembers);
      setFilteredMembers(formattedMembers);
    } catch (error) {
      console.error('Error loading team members:', error);
      setError('Kunde inte ladda teammedlemmar');
      setMembers([]);
      setFilteredMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMember = ({ item }: { item: TeamMember }) => {
    if (!item || !item.name) {
      console.error('Invalid member item:', item);
      return null;
    }

    return (
      <TouchableOpacity
        style={[styles.memberItem, { backgroundColor: colors.neutral[800] }]}
        onPress={() => onSelect(item)}
      >
        {item.avatar_url ? (
          <Image
            source={{ uri: item.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.neutral[600] }]}>
            <Text style={[styles.avatarText, { color: colors.text.light }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={[styles.memberName, { color: colors.text.main }]}>{item.name}</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 200,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  memberName: {
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
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