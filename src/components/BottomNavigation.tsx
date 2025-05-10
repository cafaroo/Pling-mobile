import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Bell, Award, Target, Users, User, LucideProps } from 'lucide-react-native';
import { router, usePathname } from 'expo-router';

const { width } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';

// Tab configuration
interface TabItem {
  key: string;
  label: string;
  icon: React.ComponentType<LucideProps>;
  route: string;
}

const TABS: TabItem[] = [
  {
    key: 'pling',
    label: 'Pling',
    icon: Bell,
    route: '/',
  },
  {
    key: 'competitions',
    label: 'Tävlingar',
    icon: Award,
    route: '/competitions/index',
  },
  {
    key: 'goals',
    label: 'Mål',
    icon: Target,
    route: '/goals/index',
  },
  {
    key: 'team',
    label: 'Team',
    icon: Users,
    route: '/team/index',
  },
  {
    key: 'profile',
    label: 'Profil',
    icon: User,
    route: '/profile/index',
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  // Matcha även mot huvudsökvägen utan /index i slutet
  const normalizedPath = pathname.endsWith('/index') ? pathname : pathname + '/index';
  const activeTabIndex = TABS.findIndex(tab => 
    tab.route === pathname || tab.route === normalizedPath
  ) !== -1 
    ? TABS.findIndex(tab => tab.route === pathname || tab.route === normalizedPath) 
    : 0;
  
  // Animation values
  const indicatorPosition = useRef(new Animated.Value(activeTabIndex)).current;
  const tabScales = TABS.map(() => useRef(new Animated.Value(1)).current);
  
  // Update indicator position when active tab changes
  useEffect(() => {
    Animated.spring(indicatorPosition, {
      toValue: activeTabIndex,
      useNativeDriver: true,
      friction: 8,
      tension: 50,
    }).start();
  }, [activeTabIndex]);
  
  // Handle tab press
  const handleTabPress = (index: number, route: string) => {
    // Animate the pressed tab
    Animated.sequence([
      Animated.timing(tabScales[index], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(tabScales[index], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Navigate to the route
    router.push(route as any);
  };
  
  // Calculate indicator position
  const translateX = indicatorPosition.interpolate({
    inputRange: [0, TABS.length - 1],
    outputRange: [0, width - width / TABS.length],
  });
  
  // Render tab item
  const renderTab = (tab: TabItem, index: number) => {
    const isActive = index === activeTabIndex;
    
    return (
      <Animated.View 
        key={tab.key}
        style={[
          styles.tabContainer,
          { transform: [{ scale: tabScales[index] }] }
        ]}
      >
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabPress(index, tab.route)}
          activeOpacity={0.7}
        >
          <tab.icon 
            size={22} 
            color={isActive ? '#FACC15' : 'rgba(255, 255, 255, 0.6)'} 
          />
          <Text 
            style={[
              styles.tabLabel,
              isActive && styles.activeTabLabel
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  return (
    <View style={styles.container}>
      {/* Glass effect background */}
      {!IS_WEB ? (
        <BlurView
          intensity={30}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={styles.webGlassEffect} />
      )}
      
      {/* Border at the top */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topBorder}
      />
      
      {/* Active tab indicator */}
      <Animated.View 
        style={[
          styles.activeIndicator,
          { transform: [{ translateX }] }
        ]}
      >
        <LinearGradient
          colors={['#FACC15', '#F59E0B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.indicatorGradient}
        />
      </Animated.View>
      
      {/* Tab items */}
      <View style={styles.tabsContainer}>
        {TABS.map(renderTab)}
      </View>
      
      {/* Safe area padding for iPhone X+ */}
      <View style={styles.safeAreaPadding} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  webGlassEffect: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30, 27, 75, 0.85)',
    backdropFilter: 'blur(10px)',
  },
  topBorder: {
    height: 1,
    width: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    height: 60,
    width: '100%',
  },
  tabContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    width: '100%',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  activeTabLabel: {
    color: '#FACC15',
    fontWeight: 'bold',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: width / TABS.length,
    height: 3,
    zIndex: 1,
  },
  indicatorGradient: {
    height: '100%',
    width: '50%',
    alignSelf: 'center',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  safeAreaPadding: {
    height: Platform.OS === 'ios' ? 20 : 0,
    backgroundColor: 'rgba(30, 27, 75, 0.85)',
  },
}); 