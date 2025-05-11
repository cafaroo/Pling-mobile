import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Database, Bug, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { supabase } from '@services/supabaseClient';
import Container from '@/components/ui/Container';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function DebugMembershipScreen() {
  const { colors } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const [teamMembership, setTeamMembership] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadMembershipData();
    }
  }, [user?.id]);

  const loadMembershipData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get raw team membership data
      const { data, error } = await supabase
        .from('team_members')
        .select('*, teams(name)')
        .eq('user_id', user?.id || '')
        .maybeSingle();

      if (error) throw error;
      
      setTeamMembership(data);
    } catch (err) {
      console.error('Error loading membership data:', err);
      setError('Could not load membership data');
    } finally {
      setIsLoading(false);
    }
  };

  const updateApprovalStatus = async (status: 'pending' | 'approved' | 'rejected') => {
    if (!teamMembership) return;
    
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ approval_status: status })
        .eq('id', teamMembership.id);
        
      if (error) throw error;
      
      // Reload data
      await loadMembershipData();
    } catch (err) {
      console.error('Error updating approval status:', err);
      setError('Failed to update approval status');
    }
  };

  return (
    <Container>
      <LinearGradient
        colors={[colors.background.dark, colors.primary.dark]}
        style={styles.background}
      />
      <Header 
        title="Debug Membership" 
        icon={Bug} 
        leftIcon={ArrowLeft}
        onLeftIconPress={() => router.back()}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <Card style={styles.card}>
            <Text style={[styles.loadingText, { color: colors.text.light }]}>
              Loading membership data...
            </Text>
          </Card>
        ) : error ? (
          <Card style={styles.card}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
            <Button
              title="Try Again"
              onPress={loadMembershipData}
              variant="outline"
              size="small"
              style={styles.button}
            />
          </Card>
        ) : !teamMembership ? (
          <Card style={styles.card}>
            <Text style={[styles.infoText, { color: colors.text.main }]}>
              No team membership found for this user.
            </Text>
          </Card>
        ) : (
          <>
            <Card style={styles.card}>
              <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
                Team Membership Details
              </Text>
              
              <View style={styles.dataRow}>
                <Text style={[styles.dataLabel, { color: colors.text.light }]}>
                  Team ID:
                </Text>
                <Text style={[styles.dataValue, { color: colors.text.main }]}>
                  {teamMembership.team_id}
                </Text>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={[styles.dataLabel, { color: colors.text.light }]}>
                  Team Name:
                </Text>
                <Text style={[styles.dataValue, { color: colors.text.main }]}>
                  {teamMembership.teams?.name || 'Unknown'}
                </Text>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={[styles.dataLabel, { color: colors.text.light }]}>
                  User ID:
                </Text>
                <Text style={[styles.dataValue, { color: colors.text.main }]}>
                  {teamMembership.user_id}
                </Text>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={[styles.dataLabel, { color: colors.text.light }]}>
                  Role:
                </Text>
                <Text style={[styles.dataValue, { color: colors.text.main }]}>
                  {teamMembership.role}
                </Text>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={[styles.dataLabel, { color: colors.text.light }]}>
                  Approval Status:
                </Text>
                <Text style={[
                  styles.dataValue, 
                  { 
                    color: 
                      teamMembership.approval_status === 'approved' ? colors.success :
                      teamMembership.approval_status === 'pending' ? colors.accent.yellow :
                      colors.error
                  }
                ]}>
                  {teamMembership.approval_status || 'approved (default)'}
                </Text>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={[styles.dataLabel, { color: colors.text.light }]}>
                  Created At:
                </Text>
                <Text style={[styles.dataValue, { color: colors.text.main }]}>
                  {new Date(teamMembership.created_at).toLocaleString()}
                </Text>
              </View>
            </Card>
            
            <Card style={styles.card}>
              <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
                Debug Actions
              </Text>
              <Text style={[styles.infoText, { color: colors.text.light }]}>
                Use these buttons to change the approval status for testing purposes.
              </Text>
              
              <View style={styles.buttonRow}>
                <Button
                  title="Set Pending"
                  onPress={() => updateApprovalStatus('pending')}
                  variant="outline"
                  size="small"
                  style={[styles.actionButton, { borderColor: colors.accent.yellow }]}
                />
                
                <Button
                  title="Set Approved"
                  onPress={() => updateApprovalStatus('approved')}
                  variant="outline"
                  size="small"
                  style={[styles.actionButton, { borderColor: colors.success }]}
                />
                
                <Button
                  title="Set Rejected"
                  onPress={() => updateApprovalStatus('rejected')}
                  variant="outline"
                  size="small"
                  style={[styles.actionButton, { borderColor: colors.error }]}
                />
              </View>
            </Card>
            
            <Card style={styles.card}>
              <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
                Raw Data
              </Text>
              <ScrollView style={styles.jsonContainer}>
                <Text style={[styles.jsonText, { color: colors.text.light }]}>
                  {JSON.stringify(teamMembership, null, 2)}
                </Text>
              </ScrollView>
            </Card>
          </>
        )}
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    padding: 20,
    marginBottom: 16,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    alignSelf: 'center',
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 8,
  },
  dataLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    width: 120,
  },
  dataValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  jsonContainer: {
    maxHeight: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 12,
    borderRadius: 8,
  },
  jsonText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});