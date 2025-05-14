import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { GoalTag } from '@/types/goal';
import { TagBadge } from './TagBadge';
import { Plus } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface TagListProps {
  tags: GoalTag[];
  onRemoveTag?: (tagId: string) => void;
  onMorePress?: () => void;
  size?: 'small' | 'medium' | 'large';
  maxDisplay?: number;
  scrollable?: boolean;
  style?: object;
  outlineOnly?: boolean;
}

/**
 * TagList - En komponent för att visa en lista av taggar
 */
export const TagList: React.FC<TagListProps> = ({
  tags,
  onRemoveTag,
  onMorePress,
  size = 'medium',
  maxDisplay = 10,
  scrollable = false,
  style,
  outlineOnly = false
}) => {
  const { colors } = useTheme();
  const [displayTags, setDisplayTags] = React.useState<GoalTag[]>([]);
  const [hasMore, setHasMore] = React.useState(false);
  
  // Beräkna vilka taggar som ska visas
  React.useEffect(() => {
    if (tags.length <= maxDisplay) {
      setDisplayTags(tags);
      setHasMore(false);
    } else {
      setDisplayTags(tags.slice(0, maxDisplay));
      setHasMore(true);
    }
  }, [tags, maxDisplay]);
  
  // Hjälpfunktion för att få en subtil färg för container
  const getSubtleContainerColor = (alpha: string = 'CC') => {
    // Använd en neutral grå bakgrund istället för taggfärger
    return `rgba(60, 60, 90, ${parseFloat(alpha) / 255})`;
  };
  
  // Renderera innehållet
  const renderContent = () => (
    <>
      {displayTags.map(tag => (
        <TagBadge
          key={tag.id}
          tag={tag}
          onRemove={onRemoveTag ? () => onRemoveTag(tag.id) : undefined}
          size={size}
          outlineOnly={outlineOnly}
        />
      ))}
      
      {hasMore && onMorePress && (
        <TouchableOpacity 
          style={[
            styles.moreButton, 
            { 
              borderColor: colors.accent.yellow,
              backgroundColor: outlineOnly ? 'transparent' : 'rgba(0, 0, 0, 0.3)'
            }
          ]}
          onPress={onMorePress}
        >
          <Plus size={16} color={colors.accent.yellow} />
          <Text style={[styles.moreText, { color: colors.accent.yellow }]}>
            {tags.length - maxDisplay}
          </Text>
        </TouchableOpacity>
      )}
    </>
  );
  
  const renderContainer = (children: React.ReactNode) => {
    if (outlineOnly) {
      return (
        <View style={[styles.container, style]}>
          {children}
        </View>
      );
    }
    
    // På webb använder vi BlurView för bästa resultat
    if (Platform.OS === 'web') {
      return (
        <BlurView 
          intensity={12} 
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
    }
    
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
  };
  
  if (scrollable) {
    return renderContainer(
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderContent()}
      </ScrollView>
    );
  }
  
  return renderContainer(
    <View style={styles.flexWrap}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 8,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingRight: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  moreContainer: {
    borderRadius: 100,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 }, // Mindre skugga
    shadowOpacity: 0.1,
    shadowRadius: 2, // Mindre radie
    elevation: 1, // Mindre elevation
  },
  moreText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  moreButton: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 100,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  flexWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
}); 