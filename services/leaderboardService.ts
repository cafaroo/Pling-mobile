import { supabase } from './supabaseClient';
import { LeaderboardEntry } from '@/types';

// Get leaderboard data
export const getLeaderboard = async (period: 'week' | 'month' | 'year' = 'week'): Promise<LeaderboardEntry[]> => {
  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Start of week (Monday)
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of month
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1); // Start of year
        break;
    }

    startDate.setHours(0, 0, 0, 0);

    // Get sales data with user info and calculate totals
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select(`
        amount,
        user_id,
        profiles (
          id,
          name,
          avatar_url
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString());

    if (salesError) throw salesError;

    // Group and sum sales by user
    const userSales = salesData.reduce((acc, sale) => {
      const userId = sale.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          id: userId,
          name: sale.profiles.name,
          avatarUrl: sale.profiles.avatar_url,
          amount: 0,
          positionChange: 0 // We'll calculate this later
        };
      }
      acc[userId].amount += sale.amount;
      return acc;
    }, {} as Record<string, LeaderboardEntry>);

    // Convert to array and sort by amount
    let leaderboard = Object.values(userSales).sort((a, b) => b.amount - a.amount);

    // Get previous period rankings for position changes
    const previousStartDate = new Date(startDate);
    switch (period) {
      case 'week':
        previousStartDate.setDate(previousStartDate.getDate() - 7);
        break;
      case 'month':
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        break;
      case 'year':
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
        break;
    }

    const { data: previousSalesData, error: previousError } = await supabase
      .from('sales')
      .select('amount, user_id')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    if (previousError) throw previousError;

    // Calculate previous rankings
    const previousRankings = previousSalesData
      .reduce((acc, sale) => {
        acc[sale.user_id] = (acc[sale.user_id] || 0) + sale.amount;
        return acc;
      }, {} as Record<string, number>);

    const previousPositions = Object.entries(previousRankings)
      .sort(([, a], [, b]) => b - a)
      .reduce((acc, [userId], index) => {
        acc[userId] = index + 1;
        return acc;
      }, {} as Record<string, number>);

    // Calculate position changes
    leaderboard = leaderboard.map((entry, index) => {
      const currentPosition = index + 1;
      const previousPosition = previousPositions[entry.id] || currentPosition;
      return {
        ...entry,
        positionChange: previousPosition - currentPosition
      };
    });

    return leaderboard;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
};