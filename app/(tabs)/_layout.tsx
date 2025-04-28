import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Bell, User, Trophy, Award, Users, Target } from 'lucide-react-native';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useTheme } from '@/context/ThemeContext';
import TabBarIcon from '@/components/ui/TabBarIcon';

export default function TabLayout() {
  const { colors } = useTheme();
  const { unreadCount } = useUnreadMessages();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          backgroundColor: 'transparent',
        },
        tabBarBackground: () => (
          <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        ),
        tabBarActiveTintColor: colors.accent.yellow,
        tabBarInactiveTintColor: colors.neutral[300],
        tabBarLabelStyle: styles.tabBarLabel,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pling',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon icon={Bell} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Topplista',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon icon={Trophy} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="competitions"
        options={{
          title: 'Tävlingar',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon icon={Award} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Mål',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon icon={Target} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: 'Teams',
          tabBarIcon: ({ color, size }) => {
            return (
              <View>
                <TabBarIcon icon={Users} color={color} size={size} />
                {unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.accent.yellow }]}>
                    <Text style={styles.badgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            );
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon icon={User} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginBottom: 5,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: '#1E1B4B',
  },
});