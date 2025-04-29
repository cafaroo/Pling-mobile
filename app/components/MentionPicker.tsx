import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
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

  useEffect(() => {
    loadTeamMembers();
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
      console.log('Loading team members for team:', teamId);
      const { data: teamMembers, error } = await supabase
        .from('team_members')
        .select(`
          user:user_id (
            id,
            name,
            avatar_url
          )
        `)
        .eq('team_id', teamId);

      if (error) throw error;

      const formattedMembers = teamMembers
        .map(member => member.user)
        .filter(member => member !== null)
        .map(member => ({
          id: member.id,
          name: member.name,
          avatar_url: member.avatar_url,
        }));

      console.log('Loaded team members:', formattedMembers);
      setMembers(formattedMembers);
      setFilteredMembers(formattedMembers);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const renderMember = ({ item }: { item: TeamMember }) => (
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

  return (
    <View style={[styles.container, { backgroundColor: colors.neutral[900] }]}>
      <FlatList
        data={filteredMembers}
        renderItem={renderMember}
        keyExtractor={(item) => item.id}
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
}); 