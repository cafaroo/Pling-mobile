import { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type PlingAnimationProps = {
  amount: string;
};

export default function PlingAnimation({ amount }: PlingAnimationProps) {
  const { colors } = useTheme();
  
  const scale = new Animated.Value(0);
  const opacity = new Animated.Value(0);
  
  useEffect(() => {
    // Scale up and fade in
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Fade out
    setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 1500);
  }, []);
  
  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          { 
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <Text style={styles.plingText}>PLING!</Text>
        <Text style={styles.amountText}>
          +{new Intl.NumberFormat('sv-SE').format(parseInt(amount))} kr
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  content: {
    backgroundColor: '#FACC15',
    paddingHorizontal: 40,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  plingText: {
    fontFamily: 'Inter-Bold',
    fontSize: 40,
    color: '#1E1B4B',
    marginBottom: 8,
  },
  amountText: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#1E1B4B',
  },
});