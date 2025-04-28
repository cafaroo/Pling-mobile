import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, Calendar, Package } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import Card from '@/components/ui/Card';
import { format } from 'date-fns';

type GoalEntry = {
  id: string;
  value: number;
  source_type: string;
  recorded_at: string;
  sales?: {
    product?: string;
    comment?: string;
  };
};

type GoalEntriesListProps = {
  entries: GoalEntry[];
  isAmount?: boolean;
  style?: object;
};

export default function GoalEntriesList({ 
  entries, 
  isAmount = true,
  style 
}: GoalEntriesListProps) {
  const { colors } = useTheme();

  if (entries.length === 0) {
    return (
      <Card style={[styles.emptyContainer, style]}>
        <Text style={[styles.emptyText, { color: colors.text.light }]}>
          No entries recorded yet
        </Text>
      </Card>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, { color: colors.text.main }]}>
        Recent Entries
      </Text>
      
      {entries.map((entry) => (
        <Card key={entry.id} style={styles.entryCard}>
          <View style={styles.entryHeader}>
            <View style={styles.entryInfo}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary.light }]}>
                <TrendingUp size={16} color={colors.accent.yellow} />
              </View>
              
              <View>
                <Text style={[styles.entryType, { color: colors.text.main }]}>
                  {entry.source_type === 'sale' ? 'Sale' : 'Manual Entry'}
                </Text>
                
                {entry.sales?.product && (
                  <View style={styles.productContainer}>
                    <Package size={12} color={colors.text.light} />
                    <Text style={[styles.productText, { color: colors.text.light }]}>
                      {entry.sales.product}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            <Text style={[styles.entryValue, { color: colors.accent.yellow }]}>
              {isAmount 
                ? `${new Intl.NumberFormat('sv-SE').format(entry.value)} kr`
                : new Intl.NumberFormat('sv-SE').format(entry.value)
              }
            </Text>
          </View>
          
          {entry.sales?.comment && (
            <Text style={[styles.commentText, { color: colors.text.light }]}>
              {entry.sales.comment}
            </Text>
          )}
          
          <View style={styles.entryFooter}>
            <View style={styles.dateContainer}>
              <Calendar size={12} color={colors.text.light} />
              <Text style={[styles.dateText, { color: colors.text.light }]}>
                {format(new Date(entry.recorded_at), 'MMM d, yyyy HH:mm')}
              </Text>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  entryCard: {
    padding: 16,
    marginBottom: 8,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  entryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryType: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  productContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  productText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  entryValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  commentText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
});