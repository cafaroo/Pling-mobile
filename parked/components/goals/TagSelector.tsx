import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  TextInput as RNTextInput,
  Modal,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';
import { GoalTag } from '@/types/goal';
import { TagBadge } from './TagBadge';
import { Plus, Search, X, Check, Tag as TagIcon, PaintBucket } from 'lucide-react-native';
import TextInput from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { useTags, useCreateTag } from '@/hooks/useTags';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// Standardfärger för taggar
const TAG_COLORS = [
  '#EF4444', // Röd
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Gul
  '#84CC16', // Lime
  '#22C55E', // Grön
  '#10B981', // Smaragd
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Ljusblå
  '#3B82F6', // Blå
  '#6366F1', // Indigo
  '#8B5CF6', // Violett
  '#A855F7', // Lila
  '#D946EF', // Fuchsia
  '#EC4899', // Rosa
];

interface TagSelectorProps {
  selectedTags: GoalTag[];
  onTagsChange: (tags: GoalTag[]) => void;
  label?: string;
  error?: string;
  style?: object;
}

/**
 * En komponent för att välja och hantera taggar
 */
export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onTagsChange,
  label = 'Taggar',
  error,
  style
}) => {
  const { colors } = useTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  
  // Hämta alla taggar
  const { data: allTags = [], isLoading, isError } = useTags();
  const createTagMutation = useCreateTag();
  
  // Filtrera taggar baserat på söktext
  const filteredTags = searchText
    ? allTags.filter(tag => 
        tag.name.toLowerCase().includes(searchText.toLowerCase()))
    : allTags;
    
  // Kontrollera om en tagg är vald
  const isTagSelected = (tagId: string) => {
    return selectedTags.some(tag => tag.id === tagId);
  };
  
  // Hantera val av tagg
  const handleTagToggle = (tag: GoalTag) => {
    if (isTagSelected(tag.id)) {
      // Ta bort den från valda
      onTagsChange(selectedTags.filter(t => t.id !== tag.id));
    } else {
      // Lägg till den till valda
      onTagsChange([...selectedTags, tag]);
    }
  };
  
  // Hantera borttagning av tagg från valda
  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
  };
  
  // Hantera skapande av ny tagg
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    setIsCreatingTag(true);
    
    try {
      const newTag = await createTagMutation.mutateAsync({
        name: newTagName.trim(),
        color: selectedColor
      });
      
      // Lägg till den nya taggen till valda
      onTagsChange([...selectedTags, newTag]);
      
      // Återställ formulär
      setNewTagName('');
      setSelectedColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
      setIsCreatingTag(false);
    } catch (error) {
      console.error('Fel vid skapande av tagg:', error);
      setIsCreatingTag(false);
    }
  };
  
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, { color: colors.text.main }]}>
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.selector,
          { backgroundColor: 'rgba(0, 0, 0, 0.2)' },
          error && { borderColor: colors.error, borderWidth: 1 }
        ]}
        onPress={() => setIsModalVisible(true)}
      >
        {selectedTags.length > 0 ? (
          <View style={styles.selectedTagsContainer}>
            {selectedTags.map(tag => (
              <TagBadge
                key={tag.id}
                tag={tag}
                size="small"
                onRemove={() => handleRemoveTag(tag.id)}
              />
            ))}
          </View>
        ) : (
          <Text style={[styles.placeholder, { color: colors.text.light }]}>
            Välj taggar...
          </Text>
        )}
        
        <View style={styles.addIconContainer}>
          <TagIcon size={18} color={colors.text.light} />
        </View>
      </TouchableOpacity>
      
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}
      
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <BlurView
            intensity={20}
            tint="dark"
            style={[styles.modalContent, { backgroundColor: 'rgba(30, 30, 50, 0.8)' }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.main }]}>
                Hantera taggar
              </Text>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <X size={20} color={colors.text.light} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Search size={20} color={colors.text.light} style={styles.searchIcon} />
                <RNTextInput
                  style={[
                    styles.searchInput,
                    { 
                      color: colors.text.main,
                      backgroundColor: 'transparent',
                    }
                  ]}
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="Sök taggar..."
                  placeholderTextColor={colors.text.light}
                />
              </View>
            </View>
            
            <View style={styles.tagListContainer}>
              {isLoading ? (
                <ActivityIndicator size="large" color={colors.accent.yellow} />
              ) : isError ? (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  Kunde inte hämta taggar
                </Text>
              ) : filteredTags.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.text.light }]}>
                  Inga taggar hittades
                </Text>
              ) : (
                <ScrollView contentContainerStyle={styles.tagList}>
                  {filteredTags.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.tagItem,
                        isTagSelected(item.id) && { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                      ]}
                      onPress={() => handleTagToggle(item)}
                    >
                      <View style={[styles.tagColorIndicator, { backgroundColor: item.color }]} />
                      <Text style={[styles.tagName, { color: colors.text.main }]}>
                        {item.name}
                      </Text>
                      
                      {isTagSelected(item.id) && (
                        <Check size={16} color={colors.accent.green} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
            
            <View style={styles.divider} />
            
            <Animated.View 
              style={styles.createTagSection}
              entering={FadeIn.duration(300)}
            >
              <View style={styles.sectionHeader}>
                <PaintBucket size={16} color={colors.accent.yellow} />
                <Text style={[styles.sectionTitle, { color: colors.text.main }]}>
                  Skapa ny tagg
                </Text>
              </View>
              
              <View style={styles.createTagForm}>
                <RNTextInput
                  style={[
                    styles.tagInput,
                    { 
                      color: colors.text.main,
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  ]}
                  value={newTagName}
                  onChangeText={setNewTagName}
                  placeholder="Taggnamn..."
                  placeholderTextColor={colors.text.light}
                />
                
                <Text style={[styles.colorSelectorLabel, { color: colors.text.light }]}>
                  Välj färg:
                </Text>
                
                <View style={styles.colorSelector}>
                  {TAG_COLORS.map(color => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        selectedColor === color && styles.selectedColorOption
                      ]}
                      onPress={() => setSelectedColor(color)}
                    />
                  ))}
                </View>
                
                <View style={styles.previewContainer}>
                  <Text style={[styles.previewLabel, { color: colors.text.light }]}>
                    Förhandsgranskning:
                  </Text>
                  
                  <TagBadge
                    tag={{
                      id: 'preview',
                      name: newTagName || 'Ny tagg',
                      color: selectedColor
                    }}
                  />
                </View>
                
                <Button
                  title="Skapa tagg"
                  icon={TagIcon}
                  onPress={handleCreateTag}
                  disabled={!newTagName.trim() || isCreatingTag}
                  loading={isCreatingTag}
                  style={styles.createButton}
                />
              </View>
            </Animated.View>
            
            <View style={styles.modalFooter}>
              <Button
                title="Klar"
                onPress={() => setIsModalVisible(false)}
                variant="primary"
              />
            </View>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  selector: {
    borderRadius: 8,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedTagsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  placeholder: {
    flex: 1,
    fontSize: 14,
  },
  addIconContainer: {
    marginLeft: 8,
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 12,
    padding: 16,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 8,
  },
  tagListContainer: {
    flex: 1,
    minHeight: 200,
    maxHeight: 300,
  },
  tagList: {
    paddingVertical: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  tagColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  tagName: {
    fontSize: 14,
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  createTagSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  createTagForm: {
    gap: 12,
  },
  tagInput: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  colorSelectorLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: 'white',
    transform: [{ scale: 1.1 }],
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  previewLabel: {
    marginRight: 8,
    fontSize: 14,
  },
  createButton: {
    marginTop: 8,
  },
  modalFooter: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
}); 