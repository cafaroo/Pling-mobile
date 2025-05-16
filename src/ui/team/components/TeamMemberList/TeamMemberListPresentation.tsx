import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { MemberCard } from '../MemberCard';
import { AddMemberForm } from '../AddMemberForm';
import { EmptyState } from '@/ui/shared/components/EmptyState';
import { ProgressInfo } from '@/application/shared/hooks/useStandardizedHook';

interface TeamMember {
  id: string;
  name?: string;
  role: string;
  addedAt?: string;
}

interface TeamMemberListPresentationProps {
  // Data
  members: TeamMember[];
  isAdmin: boolean;
  isLoading: boolean;
  isAddingMember: boolean;
  addingProgress?: ProgressInfo | null;
  showAddForm: boolean;
  
  // Händelser
  onAddMember: (userId: string, role: string) => void;
  onRemoveMember: (memberId: string) => void;
  onChangeRole: (memberId: string, role: string) => void;
  onToggleAddForm: () => void;
}

/**
 * Presentationskomponent för att visa en lista med teammedlemmar
 */
export const TeamMemberListPresentation: React.FC<TeamMemberListPresentationProps> = ({
  members,
  isAdmin,
  isLoading,
  isAddingMember,
  addingProgress,
  showAddForm,
  onAddMember,
  onRemoveMember,
  onChangeRole,
  onToggleAddForm,
}) => {
  // Rendera en tom tillståndsmeddelande om det inte finns några medlemmar
  if (members.length === 0 && !isLoading) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Inga medlemmar"
          message="Det finns inga medlemmar i detta team ännu."
          actionText={isAdmin ? "Lägg till medlem" : undefined}
          onAction={isAdmin ? onToggleAddForm : undefined}
        />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Teammedlemmar</Text>
        {isAdmin && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={onToggleAddForm}
          >
            <Text style={styles.addButtonText}>
              {showAddForm ? 'Dölj formulär' : 'Lägg till medlem'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {showAddForm && (
        <AddMemberForm
          onSubmit={onAddMember}
          isLoading={isAddingMember}
          progress={addingProgress}
        />
      )}
      
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MemberCard
            member={item}
            isAdmin={isAdmin}
            onRemove={onRemoveMember}
            onRoleChange={(role) => onChangeRole(item.id, role)}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 16,
  },
}); 