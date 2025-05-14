import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import useTeamQueries from '@/hooks/useTeamQueries';
import { testGoalApi } from '@/services/goalApiTester';

/**
 * Testkomponent för att verifiera att Goal-API:et fungerar korrekt mot Supabase
 * Används endast under utveckling
 */
export default function GoalApiTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const teamQueries = useTeamQueries();
  const { data: teamsData } = teamQueries.getUserTeams(user?.id || '', {
    enabled: !!user?.id
  });
  
  // Välj det första teamet i listan om inget team är valt
  React.useEffect(() => {
    if (!teamId && teamsData?.length > 0) {
      setTeamId(teamsData[0].id);
    }
  }, [teamsData, teamId]);
  
  const runTests = async () => {
    if (!user?.id || !teamId) {
      setError('Användare eller team saknas');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const testResults = await testGoalApi(user.id, teamId);
      setResults(testResults);
    } catch (err: any) {
      setError(err.message || 'Ett fel uppstod');
      console.error('Test error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderTeamSelector = () => (
    <View style={styles.teamSelector}>
      <Text style={styles.label}>Välj team för test:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {teamsData?.map((team) => (
          <TouchableOpacity
            key={team.id}
            style={[
              styles.teamButton,
              teamId === team.id && styles.selectedTeam
            ]}
            onPress={() => setTeamId(team.id)}
          >
            <Text style={styles.teamButtonText}>{team.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
  
  const renderResultItem = (label: string, passed: boolean) => (
    <View key={label} style={styles.resultItem}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={[styles.resultStatus, { color: passed ? '#10B981' : '#EF4444' }]}>
        {passed ? '✓ Lyckades' : '✗ Misslyckades'}
      </Text>
    </View>
  );
  
  const renderResults = () => {
    if (!results) return null;
    
    return (
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsHeader}>
          Test {results.success ? 'lyckades' : 'misslyckades'}
        </Text>
        
        {results.error && (
          <Text style={styles.errorMessage}>{results.error}</Text>
        )}
        
        <View style={styles.resultsList}>
          {Object.entries(results.results || {}).map(([key, value]) => 
            renderResultItem(key, Boolean(value))
          )}
        </View>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Goal API-tester</Text>
      <Text style={styles.subtitle}>
        Kontrollerar att alla API-anrop fungerar korrekt mot Supabase
      </Text>
      
      {renderTeamSelector()}
      
      <TouchableOpacity
        style={styles.runButton}
        onPress={runTests}
        disabled={isLoading || !teamId}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.runButtonText}>Kör tester</Text>
        )}
      </TouchableOpacity>
      
      {error && (
        <Text style={styles.errorMessage}>{error}</Text>
      )}
      
      {renderResults()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  teamSelector: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  teamButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
  },
  selectedTeam: {
    backgroundColor: '#5B21B6',
  },
  teamButtonText: {
    color: '#FFFFFF',
  },
  runButton: {
    backgroundColor: '#FACC15',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  runButtonText: {
    color: '#0F0E2A',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorMessage: {
    color: '#EF4444',
    marginVertical: 8,
  },
  resultsContainer: {
    marginTop: 16,
  },
  resultsHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  resultsList: {
    marginTop: 8,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
  },
  resultLabel: {
    color: '#FFFFFF',
  },
  resultStatus: {
    fontWeight: 'bold',
  },
}); 