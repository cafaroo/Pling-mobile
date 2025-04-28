import { supabase } from './supabaseClient';
import { UserStats, Badge } from '@/types';

// Get user statistics
export const getUserStats = async (userId: string) => {
  try {
    // In a real implementation, this would query the database
    // For now, return mock data
    return getMockUserStats();
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
};

// Get user badges
export const getUserBadges = async (userId: string) => {
  try {
    // In a real implementation, this would query the database
    // For now, return mock data
    return getMockUserBadges();
  } catch (error) {
    console.error('Error getting user badges:', error);
    throw error;
  }
};

// Mock data for development
const getMockUserStats = (): UserStats => {
  return {
    weekAmount: 32500,
    monthAmount: 120000,
    largestSale: 25000,
    totalSales: 15,
    level: 3,
  };
};

// Mock data for development
const getMockUserBadges = (): Badge[] => {
  return [
    {
      id: '1',
      name: 'Superstart',
      description: 'Nådde 100 000 kr i försäljning på en månad',
      icon: '🚀',
      color: '#FACC15',
      dateEarned: new Date(Date.now() - 1209600000).toISOString(), // 2 weeks ago
    },
    {
      id: '2',
      name: 'Storaffär',
      description: 'Sålde för över 20 000 kr i en försäljning',
      icon: '💎',
      color: '#10B981',
      dateEarned: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
    },
    {
      id: '3',
      name: 'Säljseeria',
      description: '5 försäljningar på en dag',
      icon: '🔥',
      color: '#EF4444',
      dateEarned: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    },
    {
      id: '4',
      name: 'Klubbmedlem',
      description: 'Har varit på Pling i över 3 månader',
      icon: '🏆',
      color: '#EC4899',
      dateEarned: new Date(Date.now() - 7776000000).toISOString(), // 3 months ago
    },
  ];
};