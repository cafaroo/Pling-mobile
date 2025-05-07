import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { GoalTag } from '@/types/goal';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface TagBadgeProps {
  tag: GoalTag;
  onRemove?: () => void;
  size?: 'small' | 'medium' | 'large';
  style?: object;
  outlineOnly?: boolean;
}

/**
 * En komponent för att visa en enskild tagg
 */
export const TagBadge: React.FC<TagBadgeProps> = ({
  tag,
  onRemove,
  size = 'medium',
  style,
  outlineOnly = false
}) => {
  const { colors } = useTheme();
  
  // Anpassa storlek baserat på prop
  const getFontSize = () => {
    switch (size) {
      case 'small': return 10;
      case 'large': return 14;
      default: return 12;
    }
  };
  
  const getPadding = () => {
    switch (size) {
      case 'small': return { paddingVertical: 2, paddingHorizontal: 6 };
      case 'large': return { paddingVertical: 6, paddingHorizontal: 12 };
      default: return { paddingVertical: 4, paddingHorizontal: 8 };
    }
  };

  // Kollar om taggens färg är ljus eller mörk för att avgöra textfärg
  const isLightColor = (color: string) => {
    // Konvertera HEX till RGB-komponenter
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Beräkna ljushet (0-255)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    // Om ljushet är över 128, anses färgen vara ljus
    return brightness > 128;
  };
  
  // Gör färgen mer subtil genom att minska mättnaden
  const getSubtleColor = (color: string) => {
    const baseColor = color || '#6B7280';
    
    // Konvertera till RGB
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(baseColor);
    if (!result) return baseColor;
    
    // Blanda med en gråton för att göra färgen mer subtil
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    // Beräkna genomsnitt av RGB för en naturlig nedtoningseffekt
    const avg = (r + g + b) / 3;
    
    // Blanda ursprunglig färg med gråton (60% original, 40% gråton) för mjukare utseende
    const mixedR = Math.round(r * 0.6 + avg * 0.4);
    const mixedG = Math.round(g * 0.6 + avg * 0.4);
    const mixedB = Math.round(b * 0.6 + avg * 0.4);
    
    return `#${mixedR.toString(16).padStart(2, '0')}${mixedG.toString(16).padStart(2, '0')}${mixedB.toString(16).padStart(2, '0')}`;
  };
  
  // Skapa färger för gradient baserad på taggfärg
  const getGradientColors = () => {
    // Mycket subtila transparenta gråtoner för neutral bakgrund
    const baseColor = 'rgba(63, 65, 77, 0.85)';
    // Aningen ljusare nyans med mjuk transparens
    const lighterColor = 'rgba(70, 72, 85, 0.80)';
    // Aningen mörkare nyans med mjuk transparens
    const darkerColor = 'rgba(60, 62, 72, 0.90)';
    
    // Returnera en mycket subtil gradient med transparens
    return [darkerColor, baseColor, lighterColor];
  };
  
  // Hjälpfunktion för att få en ljusare variant av en färg
  const getLighterColor = (hex: string, percent: number) => {
    // Konvertera till RGB
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    
    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);
    
    // Gör ljusare
    r = Math.min(255, r + Math.floor((255 - r) * (percent / 100)));
    g = Math.min(255, g + Math.floor((255 - g) * (percent / 100)));
    b = Math.min(255, b + Math.floor((255 - b) * (percent / 100)));
    
    // Konvertera tillbaka till HEX
    return `#${(r).toString(16).padStart(2, '0')}${(g).toString(16).padStart(2, '0')}${(b).toString(16).padStart(2, '0')}`;
  };
  
  // Hjälpfunktion för att få en mörkare variant av en färg
  const getDarkerColor = (hex: string, percent: number) => {
    // Konvertera till RGB
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    
    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);
    
    // Gör mörkare
    r = Math.max(0, r - Math.floor(r * (percent / 100)));
    g = Math.max(0, g - Math.floor(g * (percent / 100)));
    b = Math.max(0, b - Math.floor(b * (percent / 100)));
    
    // Konvertera tillbaka till HEX
    return `#${(r).toString(16).padStart(2, '0')}${(g).toString(16).padStart(2, '0')}${(b).toString(16).padStart(2, '0')}`;
  };
  
  const textColor = outlineOnly 
    ? tag.color || colors.text.main
    : isLightColor(tag.color || '#6B7280') 
      ? '#111827' // Mörk text för ljusa bakgrunder
      : '#FFFFFF'; // Ljus text för mörka bakgrunder
  
  // Skugga baserad på taggens färg
  const getShadowStyle = () => {
    if (outlineOnly) return {};
    
    return {
      shadowColor: '#333',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 1
    };
  };
  
  // Rendera innehållet i taggen (oavsett vilket container vi använder)
  const renderTagContent = () => (
    <>
      <Text style={[styles.text, { fontSize: getFontSize(), color: textColor }]}>
        {tag.name}
      </Text>
      
      {onRemove && (
        <TouchableOpacity 
          style={styles.removeButton} 
          onPress={onRemove}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X 
            size={size === 'small' ? 12 : size === 'large' ? 16 : 14} 
            color={textColor} 
          />
        </TouchableOpacity>
      )}
    </>
  );

  return (
    <Animated.View 
      entering={FadeIn.duration(300)}
      style={[
        styles.containerOuter, 
        getShadowStyle()
      ]}
    >
      {outlineOnly ? (
        // Outline-version med förbättrad design
        <View 
          style={[
            styles.container, 
            {
              borderColor: getSubtleColor(tag.color) || '#6B7280',
              borderWidth: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              ...getPadding()
            },
            style
          ]}
        >
          {renderTagContent()}
        </View>
      ) : (
        // Plattformsspecifik rendering
        Platform.OS === 'web' ? (
          // På webb - använd BlurView för bästa utseende
          <BlurView 
            intensity={12} 
            tint="dark"
            style={[
              styles.container, 
              { 
                backgroundColor: `${tag.color || '#6B7280'}CC`,
                ...getPadding()
              },
              style
            ]}
          >
            {renderTagContent()}
          </BlurView>
        ) : (
          // På mobil - använd en mycket subtil bakgrund istället för tydlig gradient
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[
              styles.container,
              { 
                ...getPadding(),
                backgroundColor: 'rgba(63, 65, 77, 0.85)' // Fallback med transparent grå
              },
              style
            ]}
          >
            {renderTagContent()}
          </LinearGradient>
        )
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  containerOuter: {
    marginRight: 6,
    marginBottom: 6,
    borderRadius: 100,
    overflow: 'hidden',
  },
  container: {
    borderRadius: 100, // Stort värde för att säkerställa avrundade hörn
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  text: {
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  removeButton: {
    marginLeft: 4,
    opacity: 0.8,
  }
}); 