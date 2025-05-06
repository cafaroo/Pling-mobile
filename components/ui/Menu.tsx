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

// Standard menyalternativ för dropdown select
export interface MenuItem {
  label: string;
  value?: string;
  icon?: React.ElementType;
  variant?: 'default' | 'danger';
  destructive?: boolean;
  onPress?: () => void;
  submenu?: any[];
}

// Props när komponenten används som dropdown
interface DropdownMenuProps {
  items: MenuItem[];
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  style?: object;
  mode?: 'dropdown';
  triggerComponent?: React.ReactNode;
  visible?: boolean;
  onDismiss?: () => void;
  anchor?: React.RefObject<any>;
}

// Props när komponenten används som action menu
interface ActionMenuProps {
  items: MenuItem[];
  visible: boolean;
  onDismiss: () => void;
  anchor: React.RefObject<any>;
  mode: 'action';
  style?: object;
}

// Union type för alla möjliga props
type MenuProps = DropdownMenuProps | ActionMenuProps;

// Type guard för att skilja mellan prop-typer
const isActionMenu = (props: MenuProps): props is ActionMenuProps => {
  return props.mode === 'action';
};

export const Menu = (props: MenuProps) => {
  const { colors } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<View>(null);

  if (!colors) {
    console.warn('Theme colors are undefined in Menu');
    return null;
  }

  // Bestäm om vi använder action menu eller dropdown
  const isAction = 'mode' in props && props.mode === 'action';
  const isVisible = isAction ? props.visible : isDropdownOpen;
  const onClose = isAction ? props.onDismiss : () => setIsDropdownOpen(false);
  const anchorRef = isAction ? props.anchor : triggerRef;

  const handleDropdownPress = () => {
    if (isAction) return;
    
    if ((props as DropdownMenuProps).disabled) return;
    
    anchorRef.current?.measure((x, y, width, height, pageX, pageY) => {
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
      setIsDropdownOpen(true);
    });
  };

  // Position the menu for action menu
  React.useEffect(() => {
    if (isAction && isVisible && anchorRef.current) {
      anchorRef.current.measure((x, y, width, height, pageX, pageY) => {
        const windowHeight = Dimensions.get('window').height;
        const windowWidth = Dimensions.get('window').width;
        const spaceBelow = windowHeight - pageY - height;
        const spaceRight = windowWidth - pageX;
        
        // Place the menu below and to the right of the anchor
        const menuTop = spaceBelow < 200 ? pageY - 200 : pageY + height;
        const menuLeft = spaceRight < 150 ? pageX - 150 : pageX;
        
        setMenuPosition({
          top: menuTop,
          left: menuLeft,
          width: 150,
        });
      });
    }
  }, [isAction, isVisible]);

  const handleSelect = (item: MenuItem) => {
    if (isAction) {
      item.onPress?.();
    } else {
      if (item.value) {
        (props as DropdownMenuProps).onChange?.(item.value);
      }
    }
    onClose();
  };

  // För dropdown-läge, visa triggerkomponent
  if (!isAction) {
    const dropdownProps = props as DropdownMenuProps;
    const selectedItem = dropdownProps.items.find(item => item.value === dropdownProps.value);

    return (
      <>
        <TouchableOpacity
          onPress={handleDropdownPress}
          disabled={dropdownProps.disabled}
          style={[dropdownProps.style]}
        >
          {dropdownProps.triggerComponent || (
            <View
              ref={triggerRef}
              style={[
                styles.trigger,
                {
                  backgroundColor: colors.background.light,
                  borderColor: colors.background.light,
                  opacity: dropdownProps.disabled ? 0.5 : 1,
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
                {selectedItem?.label || dropdownProps.placeholder || 'Välj alternativ'}
              </Text>
              <ChevronDown
                size={20}
                color={colors.text.light}
                style={[
                  styles.icon,
                  { transform: [{ rotate: isDropdownOpen ? '180deg' : '0deg' }] },
                ]}
              />
            </View>
          )}
        </TouchableOpacity>

        <Modal
          visible={isVisible}
          transparent
          animationType="fade"
          onRequestClose={onClose}
        >
          <Pressable
            style={styles.overlay}
            onPress={onClose}
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
              {props.items.map((item, index) => {
                const Icon = item.icon;
                const isDestructive = item.variant === 'danger' || item.destructive;
                
                return (
                  <TouchableOpacity
                    key={item.value || `item-${index}`}
                    style={[
                      styles.item,
                      index < props.items.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.background.light,
                      },
                    ]}
                    onPress={() => handleSelect(item)}
                  >
                    {Icon && (
                      <Icon
                        size={20}
                        color={isDestructive ? colors.error : colors.text.main}
                        style={styles.itemIcon}
                      />
                    )}
                    <Text
                      style={[
                        styles.itemText,
                        {
                          color: isDestructive ? colors.error : colors.text.main,
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
  } 
  
  // För action-läge, visa endast menyn
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.overlay}
        onPress={onClose}
      >
        <View
          style={[
            styles.menu,
            {
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
              backgroundColor: colors.background.card,
              borderColor: colors.border.subtle,
            },
            props.style
          ]}
        >
          {props.items.map((item, index) => {
            const Icon = item.icon;
            const isDestructive = item.variant === 'danger' || item.destructive;
            
            return (
              <TouchableOpacity
                key={`action-item-${index}`}
                style={[
                  styles.item,
                  index < props.items.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border.subtle,
                  },
                ]}
                onPress={() => handleSelect(item)}
              >
                {Icon && (
                  <Icon
                    size={20}
                    color={isDestructive ? colors.error : colors.text.main}
                    style={styles.itemIcon}
                  />
                )}
                <Text
                  style={[
                    styles.itemText,
                    {
                      color: isDestructive ? colors.error : colors.text.main,
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