import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Team } from '@/types';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, UserPlus } from 'lucide-react-native';
import { Modal } from '@/components/ui/Modal';
import TeamForm from './TeamForm';
import JoinTeamForm from './JoinTeamForm';

interface TeamActionsProps {
  selectedTeam: Team | null;
  isOwner: boolean;
  hasTeams: boolean;
  onCreateTeam: (name: string) => void;
  onEditTeam: (name: string) => void;
  onJoinTeam?: (code: string) => void;
  style?: ViewStyle;
}

export function TeamActions({ 
  selectedTeam, 
  isOwner,
  hasTeams,
  onCreateTeam, 
  onEditTeam,
  onJoinTeam,
  style 
}: TeamActionsProps) {
  const { colors } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  if (hasTeams) {
    return (
      <View style={[styles.container, style]}>
        {isOwner && selectedTeam && (
          <Button
            title="Redigera team"
            Icon={Edit}
            onPress={() => setShowEditModal(true)}
            variant="outline"
            size="medium"
            style={styles.button}
          />
        )}

        <Modal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Redigera team"
        >
          <TeamForm
            initialValues={{ name: selectedTeam?.name || '' }}
            onSubmit={(name) => {
              onEditTeam(name);
              setShowEditModal(false);
            }}
            submitLabel="Spara"
          />
        </Modal>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Button
        title="Skapa team"
        Icon={Plus}
        onPress={() => setShowCreateModal(true)}
        variant="primary"
        size="large"
        style={styles.button}
      />

      {onJoinTeam && (
        <Button
          title="Gå med i team"
          Icon={UserPlus}
          onPress={() => setShowJoinModal(true)}
          variant="outline"
          size="large"
          style={[styles.button, styles.secondaryButton]}
        />
      )}

      <Modal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Skapa nytt team"
      >
        <TeamForm
          onSubmit={(name) => {
            onCreateTeam(name);
            setShowCreateModal(false);
          }}
          submitLabel="Skapa"
        />
      </Modal>

      {onJoinTeam && (
        <Modal
          visible={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          title="Gå med i team"
        >
          <JoinTeamForm
            onSubmit={(code) => {
              onJoinTeam(code);
              setShowJoinModal(false);
            }}
            submitLabel="Gå med"
          />
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  button: {
    minWidth: 200,
    alignSelf: 'center',
  },
  secondaryButton: {
    marginTop: 16,
  },
}); 