import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';
import { GoalTag } from '@/types/goal';
import { TagBadge } from './TagBadge';
import { Filter, X, Check, ChevronDown } from 'lucide-react-native';
import { useTags } from '@/hooks/useTags';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface TagFilterSelectorProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  label?: string;
  style?: object;
}

/**
 * TagFilterSelector - En komponent för att filtrera baserat på taggar
 */
export const TagFilterSelector: React.FC<TagFilterSelectorProps> = ({
  selectedTagIds,
  onTagsChange,
  label = 'Taggar',
  style
}) => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const { data: allTags = [] } = useTags();
  
  // Skapa en lista över valda taggar
  const selectedTags = useMemo(() => {
    return allTags.filter(tag => selectedTagIds.includes(tag.id));
  }, [allTags, selectedTagIds]);
  
  // Växla visning av filter-panelen
  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };
  
  // Hantera när en tagg klickas på
  const handleTagToggle = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };
  
  // Hjälpfunktion för att skapa en subtil bakgrundsfärg
  const getSubtleBackgroundColor = (alpha: string = 'CC') => {
    // Använd en neutral grå bakgrund istället för taggfärger
    return `rgba(60, 60, 90, ${parseFloat(alpha) / 255})`;
  };
  
  // Rendrera filter-panelen som innehåller alla tillgängliga taggar
  const renderTagPanel = () => {
    return (
      <Animated.View 
        entering={FadeIn.duration(150)} 
        exiting={FadeOut.duration(100)}
        style={styles.tagPanelWrapper}
      >
        <BlurView 
          intensity={20}
          tint="dark"
          style={[
            styles.tagPanel,
            { backgroundColor: 'rgba(0, 0, 0, 0.2)' }
          ]}
        >
          <View style={styles.tagPanelContent}>
            {allTags.map(tag => (
              <TouchableOpacity
                key={tag.id}
                style={[
                  styles.tagItem,
                  selectedTagIds.includes(tag.id) && { 
                    backgroundColor: `${tag.color || colors.primary.main}40`
                  }
                ]}
                onPress={() => handleTagToggle(tag.id)}
              >
                <View style={styles.tagItemContent}>
                  <View 
                    style={[
                      styles.tagColor, 
                      { backgroundColor: tag.color || colors.text.light }
                    ]} 
                  />
                  <Text style={[styles.tagName, { color: colors.text.main }]}>
                    {tag.name}
                  </Text>
                </View>
                
                {selectedTagIds.includes(tag.id) && (
                  <Check size={16} color={colors.accent.yellow} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </BlurView>
      </Animated.View>
    );
  };
  
  // Rendera huvudkomponenten med en plattformsspecifik container
  const renderContainer = (children: React.ReactNode) => {
    if (Platform.OS === 'web') {
      // På webben använder vi BlurView för bästa utseende
      return (
        <BlurView
          intensity={15}
          tint="dark"
          style={[
            styles.container,
            { backgroundColor: 'rgba(60, 60, 90, 0.35)' },
            style
          ]}
        >
          {children}
        </BlurView>
      );
    } else {
      // På mobil använder vi enkel solid bakgrund istället för gradient
      return (
        <View 
          style={[
            styles.container, 
            { backgroundColor: 'rgba(60, 60, 90, 0.35)' },
            style
          ]}
        >
          {children}
        </View>
      );
    }
  };
  
  return renderContainer(
    <>
      <TouchableOpacity 
        style={styles.header}
        onPress={toggleOpen}
      >
        <View style={styles.labelContainer}>
          <Filter size={18} color={colors.accent.yellow} />
          <Text style={[styles.label, { color: colors.text.main }]}>
            {label}
          </Text>
          {selectedTags.length > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.accent.yellow }]}>
              <Text style={styles.badgeText}>
                {selectedTags.length}
              </Text>
            </View>
          )}
        </View>
        
        <ChevronDown 
          size={18} 
          color={colors.text.light}
          style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>
      
      {isOpen && renderTagPanel()}
      
      {selectedTags.length > 0 && (
        <View style={styles.selectedTagsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedTagsContent}
          >
            {selectedTags.map(tag => (
              <TagBadge
                key={tag.id}
                tag={tag}
                size="small"
                onRemove={() => handleTagToggle(tag.id)}
                style={styles.selectedTag}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  badge: {
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    height: 24,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  tagPanelWrapper: {
    flex: 1,
  },
  tagPanel: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tagPanelContent: {
    padding: 12,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  tagItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagColor: {
    width: 24,
    height: 24,
    borderRadius: 4,
    marginRight: 8,
  },
  tagName: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectedTagsContainer: {
    marginTop: 4,
    paddingBottom: 8,
  },
  selectedTagsContent: {
    paddingHorizontal: 12,
    flexDirection: 'row',
  },
  selectedTag: {
    marginBottom: 0,
  }
}); 