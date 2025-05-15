import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface ProgressBarProps {
  /** Framsteg i procent (0-100) */
  progress: number;
  /** Bredd på komponenten */
  width?: number;
  /** Höjd på komponenten */
  height?: number;
  /** Färg på laddningsindikator */
  color?: string;
  /** Om procent ska visas som text */
  showPercentage?: boolean;
  /** Om komponenten ska visa en pulserande animation vid 100% */
  animate?: boolean;
}

/**
 * Visar en laddningsindikator med valfri färg och animation
 */
export const ProgressBar = ({
  progress,
  width = 200,
  height = 8,
  color = '#0066cc',
  showPercentage = true,
  animate = false
}: ProgressBarProps) => {
  // Begränsa progress till 0-100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  // Beräkna indikatorbredden
  const fillWidth = (clampedProgress / 100) * width;
  
  // Skapa animation för pulserande effekt vid 100%
  const isComplete = clampedProgress === 100;
  
  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.track, 
          { 
            width, 
            height,
            borderRadius: height / 2
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.fill, 
            { 
              width: fillWidth, 
              height, 
              backgroundColor: color,
              borderRadius: height / 2,
              opacity: isComplete && animate ? 0.8 : 1
            }
          ]}
        />
      </View>
      
      {showPercentage && (
        <Text style={styles.percentageText}>
          {Math.round(clampedProgress)}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  track: {
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  percentageText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
    textAlign: 'center',
  },
}); 