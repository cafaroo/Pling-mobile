import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { StatisticsPeriod } from '@/domain/team/value-objects/TeamStatistics';

/**
 * Formaterar ett datum baserat på statistikperiod
 */
export function formatDate(date: Date, period: StatisticsPeriod): string {
  switch (period) {
    case StatisticsPeriod.DAILY:
      return format(date, 'HH:mm', { locale: sv });
    case StatisticsPeriod.WEEKLY:
      return format(date, 'EEE', { locale: sv });
    case StatisticsPeriod.MONTHLY:
      return format(date, 'd MMM', { locale: sv });
    case StatisticsPeriod.YEARLY:
      return format(date, 'MMM', { locale: sv });
    default:
      return format(date, 'yyyy-MM-dd', { locale: sv });
  }
}

/**
 * Formaterar ett datum med tid
 */
export function formatDateTime(date: Date): string {
  return format(date, 'yyyy-MM-dd HH:mm', { locale: sv });
}

/**
 * Formaterar ett datum som relativ tid (t.ex. "2 dagar sedan")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just nu';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minut' : 'minuter'} sedan`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'timme' : 'timmar'} sedan`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'dag' : 'dagar'} sedan`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'vecka' : 'veckor'} sedan`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'månad' : 'månader'} sedan`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} ${diffInYears === 1 ? 'år' : 'år'} sedan`;
} 