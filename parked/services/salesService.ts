import { supabase } from '@/lib/supabase';
import { Sale } from '@/types';

type SaleData = {
  userId: string;
  amount: number;
  product?: string;
  comment?: string;
};

// Add a new sale
export const addSale = async (data: SaleData) => {
  try {
    const { data: sale, error } = await supabase
      .from('sales')
      .insert({
        user_id: data.userId,
        amount: data.amount,
        product: data.product,
        comment: data.comment,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return sale;
  } catch (error) {
    console.error('Error adding sale:', error);
    throw error;
  }
};

// Get user sales
const getUserSales = async (userId: string, period: 'week' | 'month' | 'year' = 'week') => {
  try {
    let rangeQuery;

    // Determine date range based on period
    const now = new Date();
    if (period === 'week') {
      // Start of current week (Monday)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
      startOfWeek.setHours(0, 0, 0, 0);
      rangeQuery = `created_at.gte.${startOfWeek.toISOString()}`;
    } else if (period === 'month') {
      // Start of current month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      rangeQuery = `created_at.gte.${startOfMonth.toISOString()}`;
    } else if (period === 'year') {
      // Start of current year
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      rangeQuery = `created_at.gte.${startOfYear.toISOString()}`;
    }

    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    return data.map((sale: any) => ({
      id: sale.id,
      userId: sale.user_id,
      amount: sale.amount,
      product: sale.product,
      comment: sale.comment,
      createdAt: sale.created_at,
    })) as Sale[];
  } catch (error) {
    console.error('Error getting user sales:', error);
    return [];
  }
};