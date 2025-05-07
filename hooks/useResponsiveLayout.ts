import { useWindowDimensions, ScaledSize, Platform } from 'react-native';
import { useMemo } from 'react';

export interface ResponsiveLayout {
  isTablet: boolean;
  containerStyle: {
    padding: number;
    maxWidth?: number;
  };
  cardStyle: {
    width: string | number;
    marginHorizontal?: number;
  };
  gridStyle: {
    columnCount: number;
    spacing: number;
  };
  textStyle: {
    fontSize: number;
    lineHeight: number;
  };
}

const TABLET_BREAKPOINT = 768;
const DESKTOP_BREAKPOINT = 1024;

export const useResponsiveLayout = (): ResponsiveLayout => {
  const { width, height } = useWindowDimensions();
  
  return useMemo(() => {
    const isTablet = width >= TABLET_BREAKPOINT;
    const isDesktop = width >= DESKTOP_BREAKPOINT;
    
    // Basera padding på skärmstorlek
    const basePadding = isTablet ? 24 : 16;
    
    // Anpassa container stil
    const containerStyle = {
      padding: basePadding,
      maxWidth: isDesktop ? 1200 : undefined,
    };
    
    // Anpassa kort stil
    const cardStyle = {
      width: isTablet ? '48%' : '100%',
      marginHorizontal: isTablet ? 8 : 0,
    };
    
    // Anpassa grid layout
    const gridStyle = {
      columnCount: isDesktop ? 3 : isTablet ? 2 : 1,
      spacing: isTablet ? 16 : 12,
    };
    
    // Anpassa text storlekar
    const textStyle = {
      fontSize: isTablet ? 16 : 14,
      lineHeight: isTablet ? 24 : 20,
    };
    
    return {
      isTablet,
      containerStyle,
      cardStyle,
      gridStyle,
      textStyle,
    };
  }, [width, height]);
}; 