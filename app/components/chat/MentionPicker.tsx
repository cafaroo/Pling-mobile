import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { TeamMember } from '@/types/team';
import { Avatar } from '@/components/ui/Avatar';

interface TeamMemberWithProfile extends TeamMember {
  profiles: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  } | null;
}

interface MentionPickerProps {
  members: TeamMemberWithProfile[];
  searchQuery: string;
  onSelectMember: (member: TeamMemberWithProfile) => void;
  onClose: () => void;
}

const MentionPicker: React.FC<MentionPickerProps> = ({
  members,
  searchQuery,
  onSelectMember,
  onClose,
}) => {
  const { colors } = useTheme();
  
  const filteredMembers = members.filter((member) =>
    member.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.neutral[800] }
    ]}>
      {filteredMembers.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.text.light }]}>
          Inga medlemmar hittades
        </Text>
      ) : (
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.memberItem,
                { borderBottomColor: colors.neutral[700] }
              ]}
              onPress={() => {
                onSelectMember(item);
                onClose();
              }}
            >
              <Avatar
                url={item.profiles?.avatar_url || undefined}
                fallback={item.profiles?.name?.[0] || '?'}
                size="sm"
              />
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: colors.text.main }]}>
                  {item.profiles?.name || 'Okänd användare'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
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
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  memberInfo: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  emptyText: {
    padding: 16,
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});

export default MentionPicker; 