import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Text } from './Text';
import { ChevronDown, Check } from 'lucide-react-native';

export interface DropdownOption {
  label: string;
  value: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Välj ett alternativ',
  disabled = false,
  error,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useTheme();

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (option: DropdownOption) => {
    if (!option.disabled) {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text 
          variant="caption" 
          style={[
            styles.label,
            { color: error ? theme.colors.destructive : theme.colors.foreground }
          ]}
        >
          {label}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.trigger,
          {
            backgroundColor: theme.colors.card,
            borderColor: error 
              ? theme.colors.destructive 
              : theme.colors.border,
          },
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <View style={styles.triggerContent}>
          {selectedOption?.icon}
          <Text 
            style={[
              styles.triggerText,
              { 
                color: selectedOption 
                  ? theme.colors.foreground 
                  : theme.colors.foregroundMuted,
                marginLeft: selectedOption?.icon ? 8 : 0,
              }
            ]}
          >
            {selectedOption?.label || placeholder}
          </Text>
        </View>
        <ChevronDown 
          size={20} 
          color={disabled ? theme.colors.foregroundMuted : theme.colors.foreground} 
        />
      </TouchableOpacity>

      {error && (
        <Text 
          variant="caption" 
          style={[styles.error, { color: theme.colors.destructive }]}
        >
          {error}
        </Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={[
            styles.overlay,
            { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
          ]}
          onPress={() => setIsOpen(false)}
          activeOpacity={1}
        >
          <View 
            style={[
              styles.content,
              {
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.border,
              }
            ]}
          >
            <ScrollView bounces={false}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    {
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderColor: theme.colors.border,
                      opacity: option.disabled ? 0.5 : 1,
                    }
                  ]}
                  onPress={() => handleSelect(option)}
                  disabled={option.disabled}
                >
                  <View style={styles.optionContent}>
                    {option.icon}
                    <View style={[styles.optionText, { marginLeft: option.icon ? 8 : 0 }]}>
                      <Text>{option.label}</Text>
                      {option.description && (
                        <Text 
                          variant="caption" 
                          style={{ color: theme.colors.foregroundMuted }}
                        >
                          {option.description}
                        </Text>
                      )}
                    </View>
                  </View>
                  {option.value === value && (
                    <Check size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: 4,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  triggerText: {
    flex: 1,
  },
  error: {
    marginTop: 4,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  content: {
    maxHeight: '80%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    flex: 1,
  },
}); 