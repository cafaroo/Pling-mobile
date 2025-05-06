import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { GoalFilter, GoalStatus, GoalType } from '@/types/goal';
import { Check, X, RotateCcw, ArrowUp, ArrowDown } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { TagFilterSelector } from './TagFilterSelector';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface GoalFiltersProps {
  initialFilter?: GoalFilter;
  onFilterChange: (filter: GoalFilter) => void;
  onClose?: () => void;
  allowTypeFilter?: boolean;
  allowScopeFilter?: boolean;
  allowTagFilter?: boolean;
}

/**
 * GoalFilters - En komponent för att filtrera mål
 */
export const GoalFilters: React.FC<GoalFiltersProps> = ({
  initialFilter = {},
  onFilterChange,
  onClose,
  allowTypeFilter = true,
  allowScopeFilter = false,
  allowTagFilter = true,
}) => {
  const { colors } = useTheme();
  const [filter, setFilter] = React.useState<GoalFilter>(initialFilter);
  
  // Hantera statusfilter
  const handleStatusToggle = (status: GoalStatus) => {
    setFilter(prev => {
      const currentStatuses = prev.status || [];
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter(s => s !== status)
        : [...currentStatuses, status];
        
      return {
        ...prev,
        status: newStatuses.length > 0 ? newStatuses : undefined
      };
    });
  };
  
  // Hantera typfilter
  const handleTypeToggle = (type: GoalType) => {
    setFilter(prev => {
      const currentTypes = prev.type || [];
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter(t => t !== type)
        : [...currentTypes, type];
        
      return {
        ...prev,
        type: newTypes.length > 0 ? newTypes : undefined
      };
    });
  };
  
  // Hantera taggfilter
  const handleTagsChange = (tagIds: string[]) => {
    setFilter(prev => ({
      ...prev,
      tags: tagIds.length > 0 ? tagIds : undefined
    }));
  };
  
  // Hantera sortering
  const handleSortChange = (sortBy: GoalFilter['sortBy'], sortDirection: GoalFilter['sortDirection'] = 'desc') => {
    setFilter(prev => ({
      ...prev,
      sortBy,
      sortDirection
    }));
  };
  
  // Återställ filter
  const handleReset = () => {
    const resetFilter: GoalFilter = {};
    setFilter(resetFilter);
  };
  
  // Applicera filter
  const handleApply = () => {
    onFilterChange(filter);
    onClose?.();
  };
  
  // Status filter chips
  const statusOptions: { value: GoalStatus; label: string; color: string }[] = [
    { value: 'active', label: 'Aktiva', color: colors.primary.light },
    { value: 'completed', label: 'Avklarade', color: colors.success },
    { value: 'paused', label: 'Pausade', color: colors.accent.yellow },
    { value: 'canceled', label: 'Avbrutna', color: colors.error },
  ];
  
  // Typ filter chips
  const typeOptions: { value: GoalType; label: string }[] = [
    { value: 'performance', label: 'Prestation' },
    { value: 'learning', label: 'Lärande' },
    { value: 'habit', label: 'Vana' },
    { value: 'project', label: 'Projekt' },
    { value: 'other', label: 'Annat' },
  ];
  
  // Sorteringsalternativ
  const sortOptions: { value: GoalFilter['sortBy']; label: string }[] = [
    { value: 'deadline', label: 'Deadline' },
    { value: 'progress', label: 'Framsteg' },
    { value: 'created_at', label: 'Skapad' },
    { value: 'difficulty', label: 'Svårighetsgrad' },
  ];
  
  // Skapa gradient färger för filter-containern
  const getGradientColors = () => {
    const baseColor = 'rgba(30, 27, 75, 0.95)';
    const lighterColor = 'rgba(49, 46, 129, 0.9)';
    const darkerColor = 'rgba(20, 20, 30, 0.98)';
    
    return [darkerColor, baseColor, lighterColor];
  };
  
  // Rendera container med plattformsspecifik hantering
  const renderFilterContainer = (children: React.ReactNode) => {
    const containerStyle = [
      styles.contentContainer
    ];
    
    if (Platform.OS === 'web') {
      return (
        <BlurView intensity={20} tint="dark" style={containerStyle}>
          {children}
        </BlurView>
      );
    } else {
      return (
        <LinearGradient
          colors={getGradientColors()}
          style={containerStyle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {children}
        </LinearGradient>
      );
    }
  };
  
  return (
    <Animated.View 
      style={styles.container}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
    >
      {renderFilterContainer(
        <>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.main }]}>
              Filtrera mål
            </Text>
            {onClose && (
              <TouchableOpacity 
                onPress={onClose} 
                style={[
                  styles.closeButton,
                  { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                ]}
              >
                <X size={18} color={colors.text.light} />
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Tag filter */}
            {allowTagFilter && (
              <View style={styles.section}>
                <TagFilterSelector
                  selectedTagIds={filter.tags || []}
                  onTagsChange={handleTagsChange}
                  label="Filtrera på taggar"
                />
              </View>
            )}
            
            {/* Status filter */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
                Status
              </Text>
              <View style={styles.chipContainer}>
                {statusOptions.map(option => {
                  const isSelected = filter.status?.includes(option.value) || false;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.chip,
                        { 
                          backgroundColor: isSelected 
                            ? option.color + '40' 
                            : 'rgba(0, 0, 0, 0.2)' 
                        }
                      ]}
                      onPress={() => handleStatusToggle(option.value)}
                    >
                      <Text 
                        style={[
                          styles.chipText, 
                          { color: isSelected ? option.color : colors.text.light }
                        ]}
                      >
                        {option.label}
                      </Text>
                      {isSelected && (
                        <Check size={12} color={option.color} style={styles.chipIcon} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            
            {/* Typ filter */}
            {allowTypeFilter && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
                  Typ
                </Text>
                <View style={styles.chipContainer}>
                  {typeOptions.map(option => {
                    const isSelected = filter.type?.includes(option.value) || false;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.chip,
                          { 
                            backgroundColor: isSelected 
                              ? colors.accent.yellow + '40' 
                              : 'rgba(0, 0, 0, 0.2)' 
                          }
                        ]}
                        onPress={() => handleTypeToggle(option.value)}
                      >
                        <Text 
                          style={[
                            styles.chipText, 
                            { 
                              color: isSelected 
                                ? colors.accent.yellow 
                                : colors.text.light 
                            }
                          ]}
                        >
                          {option.label}
                        </Text>
                        {isSelected && (
                          <Check 
                            size={12} 
                            color={colors.accent.yellow} 
                            style={styles.chipIcon} 
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
            
            {/* Sortering */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
                Sortera efter
              </Text>
              <View style={styles.sortContainer}>
                {sortOptions.map(option => {
                  const isSelected = filter.sortBy === option.value;
                  const isAscending = isSelected && filter.sortDirection === 'asc';
                  
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.sortOption,
                        { 
                          backgroundColor: isSelected 
                            ? colors.primary.main + '30' 
                            : 'rgba(0, 0, 0, 0.2)' 
                        }
                      ]}
                      onPress={() => handleSortChange(
                        option.value, 
                        isSelected && !isAscending ? 'asc' : 'desc'
                      )}
                    >
                      <Text 
                        style={[
                          styles.sortText,
                          { color: isSelected ? colors.primary.light : colors.text.light }
                        ]}
                      >
                        {option.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.directionIconContainer}>
                          {isAscending ? (
                            <ArrowUp size={14} color={colors.primary.light} />
                          ) : (
                            <ArrowDown size={14} color={colors.primary.light} />
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.footer}>
            <Button
              title="Återställ"
              variant="outline"
              icon={RotateCcw}
              onPress={handleReset}
              style={styles.resetButton}
            />
            <Button
              title="Använd filter"
              onPress={handleApply}
              style={styles.applyButton}
            />
          </View>
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  contentContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    maxHeight: 400,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipIcon: {
    marginLeft: 4,
  },
  sortContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: '48%',
  },
  sortText: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  directionIconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  resetButton: {
    flex: 1,
  },
  applyButton: {
    flex: 1,
  },
}); 