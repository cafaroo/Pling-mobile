import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { ChevronDown } from 'lucide-react-native';

export interface MenuItem {
  label: string;
  value: string;
  icon?: React.ElementType;
  variant?: 'default' | 'danger';
}

interface MenuProps {
  items: MenuItem[];
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  style?: object;
}

export const Menu = ({
  items,
  value,
  placeholder = 'Välj ett alternativ',
  onChange,
  disabled = false,
  style,
}: MenuProps) => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<View>(null);

  if (!colors) {
    console.warn('Theme colors are undefined in Menu');
    return null;
  }

  const selectedItem = items.find(item => item.value === value);

  const handlePress = () => {
    if (disabled) return;
    
    triggerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      const windowHeight = Dimensions.get('window').height;
      const spaceBelow = windowHeight - pageY - height;
      const spaceAbove = pageY;
      
      // Determine if menu should open upward or downward
      const shouldOpenUpward = spaceBelow < 200 && spaceAbove > spaceBelow;
      
      setMenuPosition({
        top: shouldOpenUpward ? pageY - Math.min(spaceAbove, 200) : pageY + height,
        left: pageX,
        width: width,
      });
      setIsOpen(true);
    });
  };

  const handleSelect = (item: MenuItem) => {
    onChange?.(item.value);
    setIsOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        style={[style]}
      >
        <View
          ref={triggerRef}
          style={[
            styles.trigger,
            {
              backgroundColor: colors.background.light,
              borderColor: colors.background.light,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.triggerText,
              { color: selectedItem ? colors.text.main : colors.text.light },
            ]}
            numberOfLines={1}
          >
            {selectedItem?.label || placeholder}
          </Text>
          <ChevronDown
            size={20}
            color={colors.text.light}
            style={[
              styles.icon,
              { transform: [{ rotate: isOpen ? '180deg' : '0deg' }] },
            ]}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              styles.menu,
              {
                top: menuPosition.top,
                left: menuPosition.left,
                width: menuPosition.width,
                backgroundColor: colors.background.main,
                borderColor: colors.background.light,
              },
            ]}
          >
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.item,
                    index < items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.background.light,
                    },
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  {Icon && (
                    <Icon
                      size={20}
                      color={
                        item.variant === 'danger'
                          ? colors.error
                          : colors.text.main
                      }
                      style={styles.itemIcon}
                    />
                  )}
                  <Text
                    style={[
                      styles.itemText,
                      {
                        color:
                          item.variant === 'danger'
                            ? colors.error
                            : colors.text.main,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  triggerText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  icon: {
    transition: Platform.OS === 'web' ? '0.2s' : undefined,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menu: {
    position: 'absolute',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  itemIcon: {
    marginRight: 8,
  },
  itemText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
}); 