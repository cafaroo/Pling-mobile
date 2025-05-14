import { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, Filter, Calendar } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import DateTimePicker from '@/components/ui/DateTimePicker';

type FilterOptions = {
  status: string[];
  type: string[];
  hasPrize: boolean | null;
  startDate: Date | null;
  endDate: Date | null;
};

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  initialFilters?: FilterOptions;
  style?: object;
};

const defaultFilters: FilterOptions = {
  status: [],
  type: [],
  hasPrize: null,
  startDate: null,
  endDate: null,
};

export default function FilterModal({
  visible,
  onClose,
  onApply,
  initialFilters = defaultFilters,
  style,
}: FilterModalProps) {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  const toggleStatus = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }));
  };

  const toggleType = (type: string) => {
    setFilters(prev => ({
      ...prev,
      type: prev.type.includes(type)
        ? prev.type.filter(t => t !== type)
        : [...prev.type, type]
    }));
  };

  const togglePrize = (value: boolean | null) => {
    setFilters(prev => ({
      ...prev,
      hasPrize: prev.hasPrize === value ? null : value
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters(defaultFilters);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.container,
          { backgroundColor: colors.background.dark },
          style
        ]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.main }]}>
              Filter Competitions
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={colors.text.light} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
                Status
              </Text>
              <View style={styles.optionsGrid}>
                {['active', 'upcoming', 'ended'].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.optionChip,
                      filters.status.includes(status) && { 
                        backgroundColor: colors.accent.yellow 
                      }
                    ]}
                    onPress={() => toggleStatus(status)}
                  >
                    <Text style={[
                      styles.optionText,
                      filters.status.includes(status) && { 
                        color: colors.background.dark 
                      }
                    ]}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
                Type
              </Text>
              <View style={styles.optionsGrid}>
                {['individual', 'team'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionChip,
                      filters.type.includes(type) && { 
                        backgroundColor: colors.accent.yellow 
                      }
                    ]}
                    onPress={() => toggleType(type)}
                  >
                    <Text style={[
                      styles.optionText,
                      filters.type.includes(type) && { 
                        color: colors.background.dark 
                      }
                    ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
                Prize
              </Text>
              <View style={styles.optionsGrid}>
                <TouchableOpacity
                  style={[
                    styles.optionChip,
                    filters.hasPrize === true && { 
                      backgroundColor: colors.accent.yellow 
                    }
                  ]}
                  onPress={() => togglePrize(true)}
                >
                  <Text style={[
                    styles.optionText,
                    filters.hasPrize === true && { 
                      color: colors.background.dark 
                    }
                  ]}>
                    With Prize
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.optionChip,
                    filters.hasPrize === false && { 
                      backgroundColor: colors.accent.yellow 
                    }
                  ]}
                  onPress={() => togglePrize(false)}
                >
                  <Text style={[
                    styles.optionText,
                    filters.hasPrize === false && { 
                      color: colors.background.dark 
                    }
                  ]}>
                    No Prize
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
                Date Range
              </Text>
              <View style={styles.dateContainer}>
                <View style={styles.dateField}>
                  <Text style={[styles.dateLabel, { color: colors.text.light }]}>
                    From
                  </Text>
                  <DateTimePicker
                    value={filters.startDate || new Date()}
                    onChange={(date) => setFilters(prev => ({
                      ...prev,
                      startDate: date,
                      endDate: prev.endDate && date > prev.endDate ? date : prev.endDate
                    }))}
                  />
                </View>
                <View style={styles.dateField}>
                  <Text style={[styles.dateLabel, { color: colors.text.light }]}>
                    To
                  </Text>
                  <DateTimePicker
                    value={filters.endDate || new Date()}
                    onChange={(date) => setFilters(prev => ({
                      ...prev,
                      endDate: date,
                      startDate: prev.startDate && date < prev.startDate ? date : prev.startDate
                    }))}
                    minimumDate={filters.startDate || undefined}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Reset"
              variant="outline"
              size="large"
              onPress={handleReset}
              style={styles.resetButton}
            />
            <Button
              title="Apply Filters"
              Icon={Filter}
              onPress={handleApply}
              variant="primary"
              size="large"
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'white',
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    marginBottom: 8,
  },
  footer: {
    marginTop: 24,
    flexDirection: 'row',
    gap: 12,
  },
  resetButton: {
    flex: 1,
  },
  applyButton: {
    flex: 2,
  },
});